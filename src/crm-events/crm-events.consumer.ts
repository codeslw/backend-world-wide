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
  JSONCodec,
  JsMsg,
  nanos,
  NatsConnection,
} from 'nats';
import { CrmEvent, CrmStudentsApplier } from './crm-students.applier';

const STREAM = 'CRM_STUDENTS';
const DURABLE = 'ww-students';
const SUBJECT = 'crm.student.v1.>';
const MAX_DELIVER = 10;

/**
 * Consumes the applicants and applications edu-crm publishes (stream
 * `CRM_STUDENTS`, created by the CRM worker) and applies them to
 * partner_students and partner_applications.
 *
 * The stream keeps the last message per entity and the durable consumer starts
 * from the beginning, so a fresh database catches up on everything.
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
    private readonly config: ConfigService,
    private readonly applier: CrmStudentsApplier,
  ) {}

  onApplicationBootstrap() {
    const url = this.config.get<string>('NATS_URL');
    if (!url) {
      this.logger.warn(
        'NATS_URL is not set: CRM student events are not consumed',
      );
      return;
    }
    // Don't block app startup on NATS or on the CRM having created the stream.
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
          name: 'edu-world-wide-crm-consumer',
          maxReconnectAttempts: -1,
        });
        const jsm = await this.nc.jetstreamManager();
        // The CRM creates the stream; wait for it instead of failing.
        await jsm.streams.info(STREAM);
        const config = {
          durable_name: DURABLE,
          filter_subject: SUBJECT,
          ack_policy: AckPolicy.Explicit,
          deliver_policy: DeliverPolicy.All,
          ack_wait: nanos(30_000),
          max_deliver: MAX_DELIVER,
          max_ack_pending: 1000,
        };
        try {
          await jsm.consumers.add(STREAM, config);
        } catch {
          await jsm.consumers.update(STREAM, DURABLE, config);
        }
        const consumer = await this.nc
          .jetstream()
          .consumers.get(STREAM, DURABLE);
        const messages = await consumer.consume();
        this.logger.log(`Consuming ${STREAM} (${SUBJECT})`);
        for await (const msg of messages) {
          if (this.stopped) break;
          await this.handle(msg);
        }
      } catch (error) {
        if (this.stopped) return;
        this.logger.warn(`CRM events not available, retrying in 5s: ${error}`);
      }
      await this.nc?.close().catch(() => undefined);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  private async handle(msg: JsMsg) {
    let event: CrmEvent;
    try {
      event = this.codec.decode(msg.data);
    } catch (error) {
      // A malformed message never succeeds; the CRM's next change replaces it.
      this.logger.error(`Dropping malformed message ${msg.subject}: ${error}`);
      msg.term();
      return;
    }
    try {
      const applied = await this.applier.apply(event);
      this.logger.debug(`${event.entity} ${event.id} applied=${applied}`);
      msg.ack();
    } catch (error) {
      if (msg.info.redeliveryCount >= MAX_DELIVER) {
        this.logger.error(
          `Giving up on ${event.entity} ${event.id} after ${MAX_DELIVER} attempts: ${error}`,
        );
        msg.term();
        return;
      }
      const attempt = msg.info.redeliveryCount;
      this.logger.warn(
        `${event.entity} ${event.id} failed (attempt ${attempt}), retrying: ${error}`,
      );
      msg.nak(attempt * attempt * 1000);
    }
  }
}
