import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { PrismaService } from '../db/prisma.service';
import { ExchangeRatesResponseDto } from './dto/exchange-rates-response.dto';

/**
 * Shape of the exchangerate-api.com "standard" (latest) response we care about.
 * Docs: https://www.exchangerate-api.com/docs/standard-requests
 */
interface ExchangeRateApiResponse {
  result: 'success' | 'error';
  base_code: string;
  conversion_rates: Record<string, number>;
  time_last_update_unix: number;
  time_next_update_unix: number;
  'error-type'?: string;
}

/**
 * Fetches and caches foreign-exchange rates from exchangerate-api.com.
 *
 * Quota strategy (free tier = 1,500 requests/month):
 * - We fetch ONE base (USD) per call. Every currency pair the frontend needs is
 *   derived locally via USD as the pivot, so a refresh costs exactly 1 request
 *   no matter how many currencies we expose.
 * - The full rate table + the provider's own `time_next_update_unix` are persisted
 *   in a single DB row. Serving reads from the DB means restarts/deploys never
 *   trigger a fetch.
 * - A cron runs every 12h but only actually calls the API once we're past the
 *   stored `nextUpdateAt` (rates on the free tier only change once/day). Worst
 *   case ≈ 2 calls/day ≈ 62/month — comfortably under quota.
 */
@Injectable()
export class CurrenciesService implements OnModuleInit {
  private readonly logger = new Logger(CurrenciesService.name);
  private readonly baseCode = 'USD';

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private get apiKey(): string | undefined {
    const key = this.config.get<string>('EXCHANGE_RATE_API_KEY');
    return key && key.trim() ? key.trim() : undefined;
  }

  /** True when the converter is configured (API key present). */
  isEnabled(): boolean {
    return !!this.apiKey;
  }

  /**
   * On boot, seed the cache if it's empty or stale — but only if a key is set.
   * This does NOT force a fetch when the stored snapshot is still fresh, so
   * normal restarts cost zero requests.
   */
  async onModuleInit(): Promise<void> {
    if (!this.isEnabled()) {
      this.logger.warn(
        'EXCHANGE_RATE_API_KEY not set — currency converter disabled. ' +
          'Set it in .env to enable /currencies/rates.',
      );
      return;
    }
    try {
      await this.refreshIfStale();
    } catch (err) {
      // Never block app startup on a rate fetch.
      this.logger.error(
        `Initial exchange-rate seed failed: ${this.errMsg(err)}`,
      );
    }
  }

  /**
   * Runs every 12h. Refreshes only when the provider has published new rates
   * (now >= nextUpdateAt), so we never over-fetch.
   */
  @Cron(CronExpression.EVERY_12_HOURS, { name: 'refresh-exchange-rates' })
  async scheduledRefresh(): Promise<void> {
    if (!this.isEnabled()) return;
    try {
      const refreshed = await this.refreshIfStale();
      this.logger.log(
        refreshed
          ? 'Scheduled exchange-rate refresh: fetched new rates.'
          : 'Scheduled exchange-rate refresh: cache still fresh, skipped API call.',
      );
    } catch (err) {
      this.logger.error(
        `Scheduled exchange-rate refresh failed: ${this.errMsg(err)}`,
      );
    }
  }

  /**
   * Public read endpoint payload. Returns the cached table; if none exists yet
   * (e.g. very first boot before the seed completed) it attempts one fetch.
   * Throws 503 if the converter is disabled or no data can be produced.
   */
  async getRates(): Promise<ExchangeRatesResponseDto> {
    if (!this.isEnabled()) {
      throw new ServiceUnavailableException(
        'Currency converter is not configured (missing EXCHANGE_RATE_API_KEY).',
      );
    }

    let snapshot = await this.prisma.exchangeRateSnapshot.findFirst({
      orderBy: { fetchedAt: 'desc' },
    });

    if (!snapshot) {
      // No cache yet — try one fetch so the first request isn't empty.
      snapshot = await this.fetchAndStore();
    }

    if (!snapshot) {
      throw new ServiceUnavailableException(
        'Exchange rates are temporarily unavailable.',
      );
    }

    return {
      base: snapshot.baseCode,
      rates: snapshot.rates as Record<string, number>,
      fetchedAt: snapshot.fetchedAt.toISOString(),
      nextUpdateAt: snapshot.nextUpdateAt.toISOString(),
    };
  }

  /**
   * Force a refresh regardless of freshness (admin-triggered). Still just one
   * API request. Use sparingly — it counts against the monthly quota.
   */
  async forceRefresh(): Promise<ExchangeRatesResponseDto> {
    if (!this.isEnabled()) {
      throw new ServiceUnavailableException(
        'Currency converter is not configured (missing EXCHANGE_RATE_API_KEY).',
      );
    }
    const snapshot = await this.fetchAndStore();
    if (!snapshot) {
      throw new ServiceUnavailableException(
        'Failed to refresh exchange rates from the provider.',
      );
    }
    return {
      base: snapshot.baseCode,
      rates: snapshot.rates as Record<string, number>,
      fetchedAt: snapshot.fetchedAt.toISOString(),
      nextUpdateAt: snapshot.nextUpdateAt.toISOString(),
    };
  }

  /**
   * Fetches from the provider only if we have no snapshot or the stored one is
   * past its next-update time. Returns true if an API call was made.
   */
  private async refreshIfStale(): Promise<boolean> {
    const snapshot = await this.prisma.exchangeRateSnapshot.findFirst({
      orderBy: { fetchedAt: 'desc' },
    });

    const now = new Date();
    if (snapshot && snapshot.nextUpdateAt > now) {
      // Still fresh — the provider hasn't published new rates. Skip the call.
      return false;
    }

    await this.fetchAndStore();
    return true;
  }

  /**
   * Performs the single outbound request and upserts the snapshot. On failure
   * it logs and returns the last known snapshot (if any) so reads keep working
   * with slightly stale data rather than breaking.
   */
  private async fetchAndStore(): Promise<
    Awaited<ReturnType<PrismaService['exchangeRateSnapshot']['findFirst']>>
  > {
    const key = this.apiKey;
    if (!key) return null;

    const url = `https://v6.exchangerate-api.com/v6/${key}/latest/${this.baseCode}`;

    try {
      const { data } = await axios.get<ExchangeRateApiResponse>(url, {
        timeout: 10_000,
      });

      if (data.result !== 'success' || !data.conversion_rates) {
        throw new Error(
          `Provider returned non-success result: ${
            data['error-type'] ?? data.result
          }`,
        );
      }

      const fetchedAt = new Date(data.time_last_update_unix * 1000);
      const nextUpdateAt = new Date(data.time_next_update_unix * 1000);

      // Single-row cache: replace any previous snapshots atomically.
      const [, created] = await this.prisma.$transaction([
        this.prisma.exchangeRateSnapshot.deleteMany({}),
        this.prisma.exchangeRateSnapshot.create({
          data: {
            baseCode: data.base_code || this.baseCode,
            rates: data.conversion_rates,
            fetchedAt,
            nextUpdateAt,
          },
        }),
      ]);

      this.logger.log(
        `Fetched ${
          Object.keys(data.conversion_rates).length
        } exchange rates (base ${data.base_code}); next provider update ${nextUpdateAt.toISOString()}.`,
      );
      return created;
    } catch (err) {
      this.logger.error(
        `Failed to fetch exchange rates: ${this.errMsg(err)}`,
      );
      // Fall back to the last good snapshot so reads don't break.
      return this.prisma.exchangeRateSnapshot.findFirst({
        orderBy: { fetchedAt: 'desc' },
      });
    }
  }

  private errMsg(err: unknown): string {
    if (axios.isAxiosError(err)) {
      return `${err.response?.status ?? ''} ${err.message}`.trim();
    }
    return err instanceof Error ? err.message : String(err);
  }
}
