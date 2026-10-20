import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AckPolicy,
  connect,
  DeliverPolicy,
  JsMsg,
  JSONCodec,
  NatsConnection,
} from 'nats';
import { PrismaService } from '../db/prisma.service';

/** Stream the CRM publishes partner events to (contract crm.partner.v1). */
const CRM_STREAM = 'CRM_PARTNERS';
const CONSUMER = 'ww-telegram-links';
const MAX_DELIVER = 10;
const E164 = /^\+[1-9][0-9]{7,14}$/;

interface CrmEvent {
  schema: string;
  entity: string;
  id: string;
  deleted: boolean;
  data?: { phone: string; linkedAt: string };
}

/**
 * Mirrors "this phone is linked to the CRM's Telegram bot" from the CRM into
 * partner_telegram_links. The stream keeps the last event per phone, so a new
 * consumer (or an empty table) is rebuilt by reading it from the start.
 */
@Injectable()
export class CrmEventsConsumer
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(CrmEventsConsumer.name);
  private readonly codec = JSONCodec<CrmEvent>();
  private nc?: NatsConnection;
  private stopped = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  onApplicationBootstrap() {
    const url = this.config.get<string>('NATS_URL');
    if (!url) {
      this.logger.warn(
        'NATS_URL is not set: Telegram link status from the CRM is not mirrored',
      );
      return;
    }
    // Don't block startup on NATS or on the CRM having created the stream.
    void this.run(url);
  }

  async onModuleDestroy() {
    this.stopped = true;
    await this.nc?.drain().catch(() => undefined);
  }

  private async run(url: string) {
    while (!this.stopped) {
      try {
        this.nc = await connect({
          servers: url,
          name: 'edu-world-wide-crm-events',
          maxReconnectAttempts: -1,
        });
        const jsm = await this.nc.jetstreamManager();
        await jsm.streams.info(CRM_STREAM); // throws until the CRM creates it
        await jsm.consumers.add(CRM_STREAM, {
          durable_name: CONSUMER,
          ack_policy: AckPolicy.Explicit,
          deliver_policy: DeliverPolicy.All,
          filter_subject: 'crm.partner.v1.>',
          max_deliver: MAX_DELIVER,
        });
        const consumer = await this.nc
          .jetstream()
          .consumers.get(CRM_STREAM, CONSUMER);
        this.logger.log(`Consuming ${CRM_STREAM} as ${CONSUMER}`);
        const messages = await consumer.consume();
        for await (const msg of messages) {
          await this.handle(msg);
        }
        return;
      } catch (error) {
        if (this.stopped) return;
        this.logger.warn(
          `CRM events not available yet, retrying in 5s: ${error}`,
        );
        await this.nc?.close().catch(() => undefined);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }

  private async handle(msg: JsMsg) {
    try {
      await this.apply(this.codec.decode(msg.data), msg.seq);
      msg.ack();
    } catch (error) {
      if (msg.info.deliveryCount >= MAX_DELIVER) {
        this.logger.error(
          `Giving up on CRM event ${msg.subject} (seq ${msg.seq}): ${error}`,
        );
        msg.term();
        return;
      }
      this.logger.warn(`CRM event ${msg.subject} failed, will retry: ${error}`);
      msg.nak(Math.min(30_000, 1000 * msg.info.deliveryCount ** 2));
    }
  }

  /** Applies one event unless the row already holds a newer one. */
  async apply(event: CrmEvent, seq: number) {
    if (event.entity !== 'telegram_link') return; // other entities: not ours
    if (!E164.test(event.id)) {
      this.logger.error(
        `Ignoring telegram_link event with bad phone "${event.id}"`,
      );
      return;
    }
    const linked = !event.deleted;
    const linkedAt =
      linked && event.data ? new Date(event.data.linkedAt) : null;
    await this.prisma.$executeRaw`
      INSERT INTO "partner_telegram_links" ("phone", "linked", "linkedAt", "streamSeq", "updatedAt")
      VALUES (${event.id}, ${linked}, ${linkedAt}, ${seq}, now())
      ON CONFLICT ("phone") DO UPDATE SET
        "linked" = EXCLUDED."linked",
        "linkedAt" = EXCLUDED."linkedAt",
        "streamSeq" = EXCLUDED."streamSeq",
        "updatedAt" = now()
      WHERE "partner_telegram_links"."streamSeq" <= EXCLUDED."streamSeq"`;
  }
}
