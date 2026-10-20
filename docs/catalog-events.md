# Catalog events (`ww.catalog.v1`)

edu-world-wide publishes its catalog to NATS JetStream so other services
(edu-crm first) can keep a read-only copy without calling this API or reading
this database. edu-world-wide is the only writer of this data.

## How it works

1. Triggers on the catalog tables insert a row into `catalog_outbox` in the
   same transaction as every insert, update, or delete — including nested
   Prisma writes, cascades, and raw SQL. A row only says "entity X changed".
2. `CatalogEventsRelay` (`src/catalog-events`) polls the outbox every second,
   reads each changed entity's **current state**, and publishes it to
   JetStream. Several changes to one entity in a batch become one message.
   A Postgres advisory lock keeps it to one publisher across replicas.
3. If `NATS_URL` is unset or NATS is down, changes stay queued in the outbox
   and are published once NATS is reachable. Nothing is lost.

## Stream

| Setting | Value |
|---|---|
| Stream | `WW_CATALOG` (created by the relay) |
| Subjects | `ww.catalog.v1.<entity>.<id>` |
| Retention | last message per subject: the stream always holds the full, current catalog |
| Dedup | `Nats-Msg-Id` = `<entity>:<id>:<outboxId>`, 2 minute window |

Entities: `country` (id = numeric code), `city`, `university`, `faculty`,
`department`, `study_language`, `intake`, `program`. A change to a program's
intakes (`university_program_intakes`) is published as a `program` event.

## Message

```json
{
  "schema": "ww.catalog.v1",
  "entity": "university",
  "id": "66666666-6666-6666-6666-666666666666",
  "deleted": false,
  "outboxId": "28",
  "publishedAt": "2026-10-19T06:26:01.120Z",
  "data": { "id": "…", "name": "…", "countryCode": 860, "…": "…" }
}
```

`deleted: true` with `data: null` is a tombstone. Field lists per entity are
in `src/catalog-events/catalog-snapshots.ts`.

## Consumer rules

- Delivery is at-least-once. Use the message's **stream sequence** as the
  entity version, and never let an older sequence overwrite a newer one. Each
  message carries the whole entity, so the newest one always wins.
- To rebuild from scratch, read the stream from the start; it holds exactly one
  message (latest state or tombstone) per entity.
- If the stream is ever deleted and recreated, sequences restart at 1.
  Consumers must detect this (local versions ahead of the stream) and reset.

## Compatibility

This is a public contract. Adding fields is fine. Renaming or removing a field,
or changing its type, needs a new `ww.catalog.v2` subject published alongside
v1 until every consumer has moved.

## Operations

- `npm run catalog:resync`: enqueue every catalog entity for republishing
  (safe to run anytime; consumers ignore unchanged data).
- Published outbox rows are pruned after 30 days (daily, 03:00).
