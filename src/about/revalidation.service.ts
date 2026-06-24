import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * Notifies the Next.js frontend to invalidate cached data for the About page
 * so admin edits show up immediately. Fire-and-forget: a revalidation failure
 * must never break the admin write that triggered it.
 *
 * Requires SITE_URL and REVALIDATE_SECRET in env. If either is missing the
 * notifier silently no-ops (e.g. local dev without a frontend running).
 */
@Injectable()
export class RevalidationService {
  private readonly logger = new Logger(RevalidationService.name);

  constructor(private readonly config: ConfigService) {}

  revalidateAbout(): void {
    const siteUrl = this.config.get<string>('SITE_URL');
    const secret = this.config.get<string>('REVALIDATE_SECRET');
    if (!siteUrl || !secret) {
      this.logger.debug(
        'Skipping About revalidation: SITE_URL or REVALIDATE_SECRET not set',
      );
      return;
    }

    const url = `${siteUrl.replace(/\/$/, '')}/api/revalidate`;
    axios
      .post(
        url,
        { tags: ['about'] },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-revalidate-secret': secret,
          },
          timeout: 5000,
        },
      )
      .then(() => {
        this.logger.log('Revalidated About page cache on frontend');
      })
      .catch((err) => {
        // Never throw: revalidation is best-effort.
        this.logger.warn(
          `Failed to revalidate About on frontend: ${
            err?.response?.status ?? ''
          } ${err?.message ?? err}`,
        );
      });
  }
}
