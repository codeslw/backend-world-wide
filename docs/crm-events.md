# CRM events (`crm.partner.v1`)

edu-crm publishes to NATS JetStream; edu-world-wide consumes (the other direction from
`catalog-events.md` and `partner-events.md`).

## Stream

| Setting | Value |
|---|---|
| Stream | `CRM_PARTNERS` (created by the CRM worker) |
| Subjects | `crm.partner.v1.telegram_link.<phone digits>` |
| Retention | last message per subject: a new consumer rebuilds everything by reading from the start |
| Consumer | durable `ww-telegram-links` (created by `CrmEventsConsumer`) |

## `telegram_link`

Says whether a phone number is linked to the CRM's Telegram bot, i.e. whether that person
can already receive CRM sign-in codes.

```json
{
  "schema": "crm.partner.v1", "entity": "telegram_link", "id": "+998938337157",
  "deleted": false, "publishedAt": "...",
  "data": { "phone": "+998938337157", "linkedAt": "2026-10-20T17:45:41Z" }
}
```

`deleted: true` means the link is gone (the person shared a different number from the same
Telegram account, or blocked the bot). The Telegram chat id is never published.

## Here

- `CrmEventsConsumer` (`src/crm-events`) applies events to `partner_telegram_links`, keeping
  rows forever with `linked = false` for unlinks; `streamSeq` orders events, so a late older
  event can't bring a link back.
- `GET /partner-telegram/status[?userId=]` (admin only) joins partners with that table. Phone
  numbers are compared after stripping spaces, dashes and parentheses.
- The admin panel polls it after creating a partner and shows it in the users list.
- Without `NATS_URL` nothing is mirrored and every partner shows as not linked.
- Run one world-wide instance per durable name, or each instance sees only some events.
