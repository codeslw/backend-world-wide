# Partner and admin events (`ww.partner.v1`)

edu-crm is the internal tool of the admin team. This stream gives it the admin
accounts that sign in to it, and the agencies and agency employees whose students it
shows. Same mechanism as the catalog (see `catalog-events.md`): triggers write
`catalog_outbox` rows in the same transaction as the change, `CatalogEventsRelay`
publishes the current state, last message per subject kept. **No password or
password hash is ever published.**

## Stream

| Setting | Value |
|---|---|
| Stream | `WW_PARTNERS` (created by the relay) |
| Subjects | `ww.partner.v1.<partner_org\|partner_account\|admin_account>.<id>` |

## `admin_account`

One per `ADMIN` user, keyed by the user id:
`id, email, firstName, lastName, phone, passwordChangedAt, createdAt, updatedAt`.

The CRM creates the admin with these details. It signs them in by asking this service
to check the password (below). `passwordChangedAt` (set by a trigger whenever the
password changes) makes the CRM end sessions opened before it. A user who stops
being an admin, or is deleted, is a tombstone (`deleted: true`).

## `partner_org`

`id, ownerId, name, isActive, phone, email, country, city, updatedAt`

## `partner_account`

One per `PARTNER` user: `id, email, phone, firstName, lastName, organizationId,
partnerRole, permissions, updatedAt`. The CRM uses it to name a student's agency
manager; **partners can't sign in to the CRM**.

The internal "house" agency (organization `…c001`, owner `…c002`) holds the students
that edu-crm creates; it exists only for that and its owner can't sign in.

## Admin sign-in for edu-crm (`/api/v1/crm/auth/*`)

Service-only endpoints: header `X-Service-Token: <CRM_SERVICE_TOKEN>` (at least 32
characters, compared in constant time; the endpoints are off when it is unset), and
not rate limited. Only `ADMIN` users.

| Endpoint | Body | Answer |
|---|---|---|
| `POST /crm/auth/verify` | `email, password` | `id, email, firstName, lastName, phone, passwordChangedAt`, or 401 |
| `POST /crm/auth/change-password` | `userId, currentPassword, newPassword` | `passwordChangedAt` |
| `POST /crm/auth/forgot-password` | `email` | emails a 6-digit code (the same answer for unknown emails; needs SMTP) |
| `POST /crm/auth/reset-password` | `email, code, newPassword` | `passwordChangedAt` |

A password changed this way also signs the account out of the admin panel (refresh
tokens are revoked).

## Creating partners

- `POST /users/admin/create` with `role: PARTNER` requires `profile.phoneNumber` in
  international format and creates the organization immediately.
- `POST /partner-members` accepts an optional `phoneNumber`.

## Operations

`npm run catalog:resync` re-queues partners as well as the catalog.
