# Partner events (`ww.partner.v1`)

edu-crm has no sign-up: partner organizations and logins are created here, in the
admin panel, and published to NATS JetStream so the CRM can mirror them. Same
mechanism as the catalog (see `catalog-events.md`): triggers write `catalog_outbox`
rows in the same transaction as the change, `CatalogEventsRelay` publishes the
current state, one message per entity, last message per subject kept.

## Stream

| Setting | Value |
|---|---|
| Stream | `WW_PARTNERS` (created by the relay) |
| Subjects | `ww.partner.v1.partner_org.<orgId>`, `ww.partner.v1.partner_account.<userId>` |

## `partner_org`

`id, ownerId, name, isActive, phone, email, country, city, updatedAt`

`isActive` is the platform access switch (`PATCH /partner-organizations/:id/access`).

## `partner_account`

One per `PARTNER` user, keyed by the **user** id:

```json
{
  "id": "user uuid",
  "email": "owner@acme.test",
  "phone": "+998901112233",
  "firstName": "Olim",
  "lastName": "Karimov",
  "organizationId": "org uuid, or null for an owner whose organization doesn't exist yet",
  "partnerRole": "OWNER | MANAGER | MEMBER",
  "permissions": ["VIEW_APPLICATIONS"],
  "updatedAt": "..."
}
```

- Owners have no `partner_members` row; they own the organization, so they are `OWNER`.
- `permissions` lists granted actions for members; owners and managers get `[]` because
  they can do everything (same rule as `PartnerPermissionsGuard`).
- `phone` is normalized to E.164 from `profiles.phoneNumber`, or `null` when it isn't a
  valid number. The CRM cannot activate an account without one.
- **No password data is ever published.**
- A deleted user, or one who stops being a `PARTNER`, is published as a tombstone
  (`deleted: true`); the CRM deactivates the login.

A change to the user, their profile, membership, permissions, or their organization
enqueues the account.

## Creating partners

- `POST /users/admin/create` with `role: PARTNER` now **requires**
  `profile.phoneNumber` in international format (`+998901234567`; spaces and dashes
  are stripped) and creates the organization immediately, instead of at the owner's
  first login.
- `POST /partner-members` accepts an optional `phoneNumber`. Without one the member
  cannot sign in to the CRM until an admin adds it to their profile.

## Operations

`npm run catalog:resync` re-queues partners as well as the catalog.
