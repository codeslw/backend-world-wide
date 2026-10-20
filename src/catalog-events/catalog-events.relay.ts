import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  connect,
  DiscardPolicy,
  JetStreamClient,
  JSONCodec,
  nanos,
  NatsConnection,
  RetentionPolicy,
  StorageType,
} from 'nats';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../db/prisma.service';
import { loadCatalogSnapshot } from './catalog-snapshots';

/** JetStream stream holding the latest state of every catalog entity. */
export const CATALOG_STREAM = 'WW_CATALOG';
/** Subjects are `ww.catalog.v1.<entity>.<id>`, one per entity. */
export const CATALOG_SUBJECT_PREFIX = 'ww.catalog.v1';

const BATCH_SIZE = 200;
const POLL_INTERVAL_MS = 1000;
const PUBLISHED_RETENTION_DAYS = 30;
const SUBJECT_TOKEN = /^[A-Za-z0-9_-]+$/;

interface PendingChange {
  entity: string;
  entityId: string;
  outboxId: bigint;
}

/**
 * Publishes catalog changes from the `catalog_outbox` table to NATS JetStream.
 *
 * Triggers enqueue "entity X changed" rows in the same transaction as the
 * change; this relay reads each entity's current state and publishes it (or a
 * tombstone when deleted). The stream keeps only the last message per subject,
 * so it always holds the full, current catalog and consumers can rebuild from
 * it at any time. Delivery is at-least-once; consumers must order by stream
 * sequence (see docs/catalog-events.md).
 */
@Injectable()
export class CatalogEventsRelay
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(CatalogEventsRelay.name);
  private readonly codec = JSONCodec();
  private nc?: NatsConnection;
  private js?: JetStreamClient;
  private timer?: NodeJS.Timeout;
  private stopped = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  onApplicationBootstrap() {
    const url = this.config.get<string>('NATS_URL');
    if (!url) {
      this.logger.warn(
        'NATS_URL is not set: catalog events are queued in catalog_outbox but not published',
      );
      return;
    }
    // Don't block app startup on NATS; keep retrying in the background.
    void this.start(url);
  }

  async onModuleDestroy() {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    await this.nc?.drain().catch(() => undefined);
  }

  private async start(url: string) {
    while (!this.stopped) {
      try {
        this.nc = await connect({
          servers: url,
          name: 'edu-world-wide',
          maxReconnectAttempts: -1,
        });
        await this.ensureStream();
        this.js = this.nc.jetstream();
        this.logger.log(`Publishing catalog events to ${CATALOG_STREAM}`);
        this.schedule();
        return;
      } catch (error) {
        this.logger.error(`NATS setup failed, retrying in 5s: ${error}`);
        await this.nc?.close().catch(() => undefined);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }

  private async ensureStream() {
    const jsm = await this.nc!.jetstreamManager();
    const config = {
      name: CATALOG_STREAM,
      subjects: [`${CATALOG_SUBJECT_PREFIX}.>`],
      storage: StorageType.File,
      retention: RetentionPolicy.Limits,
      discard: DiscardPolicy.Old,
      max_msgs_per_subject: 1,
      duplicate_window: nanos(2 * 60 * 1000),
    };
    try {
      await jsm.streams.add(config);
    } catch {
      // Already exists with a different config: bring it up to date.
      await jsm.streams.update(CATALOG_STREAM, config);
    }
  }

  private schedule() {
    if (this.stopped) return;
    this.timer = setTimeout(() => void this.tick(), POLL_INTERVAL_MS);
  }

  private async tick() {
    try {
      while (!this.stopped && (await this.publishBatch()) === BATCH_SIZE) {
        // Drain the backlog before sleeping again.
      }
    } catch (error) {
      this.logger.error(`Catalog relay batch failed: ${error}`);
    } finally {
      this.schedule();
    }
  }

  /** Publishes one batch; returns the number of outbox rows handled. */
  private publishBatch(): Promise<number> {
    return this.prisma.$transaction(
      async (tx) => {
        // Only one relay (across replicas) publishes at a time, so snapshots
        // reach the stream in the order they were read.
        const [{ locked }] = await tx.$queryRaw<{ locked: boolean }[]>`
          SELECT pg_try_advisory_xact_lock(7172600) AS locked`;
        if (!locked) return 0;

        const rows = await tx.catalogOutbox.findMany({
          where: { publishedAt: null },
          orderBy: { id: 'asc' },
          take: BATCH_SIZE,
          select: { id: true, entity: true, entityId: true },
        });
        if (rows.length === 0) return 0;

        // Several changes to one entity collapse into one publish of its
        // latest state.
        const pending = new Map<string, PendingChange>();
        for (const row of rows) {
          pending.set(`${row.entity}:${row.entityId}`, {
            entity: row.entity,
            entityId: row.entityId,
            outboxId: row.id,
          });
        }
        for (const change of pending.values()) {
          await this.publish(tx, change);
        }

        await tx.catalogOutbox.updateMany({
          where: { id: { in: rows.map((r) => r.id) } },
          data: { publishedAt: new Date() },
        });
        return rows.length;
      },
      { maxWait: 10_000, timeout: 60_000 },
    );
  }

  private async publish(
    tx: Prisma.TransactionClient,
    { entity, entityId, outboxId }: PendingChange,
  ) {
    if (!SUBJECT_TOKEN.test(entity) || !SUBJECT_TOKEN.test(entityId)) {
      this.logger.error(
        `Skipping catalog change with unsafe subject: ${entity}/${entityId}`,
      );
      return;
    }
    const data = await loadCatalogSnapshot(tx, entity, entityId);
    if (data === undefined) {
      this.logger.error(`Skipping unknown catalog entity "${entity}"`);
      return;
    }
    const event = {
      schema: 'ww.catalog.v1',
      entity,
      id: entityId,
      deleted: data === null,
      outboxId: outboxId.toString(),
      publishedAt: new Date().toISOString(),
      data,
    };
    await this.js!.publish(
      `${CATALOG_SUBJECT_PREFIX}.${entity}.${entityId}`,
      this.codec.encode(event),
      { msgID: `${entity}:${entityId}:${outboxId}` },
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM, { name: 'prune-catalog-outbox' })
  async prunePublished() {
    const cutoff = new Date(Date.now() - PUBLISHED_RETENTION_DAYS * 86_400_000);
    const { count } = await this.prisma.catalogOutbox.deleteMany({
      where: { publishedAt: { lt: cutoff } },
    });
    if (count > 0)
      this.logger.log(`Pruned ${count} published catalog_outbox rows`);
  }
}
