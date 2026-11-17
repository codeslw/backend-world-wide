# Student events (`ww.student.v1` and `crm.student.v1`)

Applicants and applications are kept in sync **both ways** between edu-world-wide
and edu-crm:

| edu-crm | edu-world-wide |
|---|---|
| `applicants` | `partner_students` |
| `applications` | `partner_applications` |

Both systems use the **same id** for a record, so an event is an upsert of the row
with that id and no mapping table is needed. Each direction has its own stream and a
single publisher.

```
edu-world-wide ──WW_STUDENTS──▶ edu-crm      (ww.student.v1.<entity>.<id>)
edu-world-wide ◀─CRM_STUDENTS── edu-crm      (crm.student.v1.<entity>.<id>)
```

## world-wide → CRM (`WW_STUDENTS`)

Same mechanism as the catalog (see `catalog-events.md`): triggers on `partner_students`
and `partner_applications` write `catalog_outbox` rows, `CatalogEventsRelay` publishes
the current state, last message per subject kept. Entities `partner_student` and
`partner_application`; a deleted row is a tombstone (`deleted: true`).

`partner_student` data: `id, partnerId, organizationId, firstName, lastName, phone,
email, createdAt, updatedAt`. `partner_application` data: `id, partnerId,
organizationId, partnerStudentId, universityId, programId, intakeSeason, intakeYear,
status, stage, notes, submittedAt, createdAt, updatedAt`.

`organizationId` is the organization the owning partner acts under (owned or joined);
the CRM skips a student whose partner has none. Only the contact fields are shared:
passport, education, documents and the rest of the student profile stay here.

On first run the migration queues every existing student and application, so the CRM
imports them. `npm run catalog:resync` republishes everything.

## CRM → world-wide (`CRM_STUDENTS`)

The CRM creates the stream and publishes with a transactional outbox. Subjects
`crm.student.v1.applicant.<id>` and `crm.student.v1.application.<id>`; the message is the
whole entity (same envelope as the other contracts, `data` without null fields).

`CrmEventsConsumer` (`src/crm-events`) reads it with the durable `ww-students` and
`CrmStudentsApplier` upserts:

- **applicant** → `partner_students`: `firstName`, `lastName`, `phone`, `email`. `phone`
  and `email` are left out of the event when the CRM has none, and an absent key never
  erases what is stored here. A new student belongs to the CRM user's partner account
  (`partnerUserId`) when that is a partner, otherwise to the organization's owner; an
  existing student keeps its partner.
- **application** → `partner_applications`: `status`, `notes`, `submittedAt`, university,
  program and intake (`intakeSeason` + `intakeYear`). world-wide needs an intake, so an
  application without one is not created until the CRM sends it again with one.
  The program must already be in the catalog (the event is retried until it is).
- If an application arrives before its applicant, a stub student (`—`) is created and the
  applicant event fills it in.

## Stage

`stage` (1-7) is the step of the admission process: 1 Консультация, 2 Выбор вуза, 3 Документы,
4 Подача, 5 Оффер, 6 Виза, 7 Готово. edu-crm sets it, `partner_applications.stage` stores it
(NULL until then) and both directions carry it. The status limits it; `normalizeStage`
(`src/crm-events/process-stage.ts`) is the same rule as edu-crm's `NormalizeStage`, and both are tested
with the same vectors. The snapshot always sends a stage that agrees with the status, even when the
status was changed here. These seven steps are the CRM's pipeline and are not the same thing as the
admin-managed `application_process_steps` template, which is unchanged.

## Documents

Documents are not synced: they live here only (`application_documents`, files in DO Spaces).
The CRM shows and uploads them by calling this service's API **on behalf of its user**:

- Headers `X-Service-Token: <CRM_SERVICE_TOKEN>` and `X-Act-As-User: <world-wide user id>`
  (the CRM login's `source_user_id`). `ServiceActorGuard` checks the token (timing-safe, at
  least 32 characters, disabled when unset), loads the user and sets `req.user` as the JWT
  strategy would. Only `PARTNER` and `ADMIN` users can be acted as, and not a partner of a
  deactivated organization.
- The guard is on `/application-documents/*`, `/student-documents/*` and `POST /files/upload` only. Everything
  else still needs a JWT.
- The endpoints' own rules apply to the acted-as user: a partner sees and uploads
  documents only for applications of partners it can see (`resolveVisiblePartnerIds`).
- Partners (and students) upload with status `PENDING` and cannot upload `OFFER_LETTER`
  or `ADMIN_DOC`; when they fulfil a requirement the requirement's `fileTypes` and
  `maxSizeMb` apply. They can delete their own uploads until approved, but not what the
  admin side uploaded. Reviewing (`PATCH /application-documents/:id/status`) is admin-only.

## Status changes here

`PUT /partner-applications/:id/status` (admin) follows the same transition rule as the CRM's
`CheckTransition`: final statuses (`ENROLLED`, `REJECTED`, `WITHDRAWN`) stay final, nothing
goes back to `DRAFT`, and a draft can only be submitted or withdrawn. It stores the
normalized stage and sets `submittedAt` the first time an application is submitted. The
response carries `stage` and `allowedStatuses` for the admin panel.

## Tracking in the admin panel

`partner_students` and `partner_applications` carry what the admin team needs to follow CRM
records (migration `20261117000000_crm_tracking`):

- `origin`: `CRM` when the consumer created the row, `PORTAL` (partner portal) or `ADMIN`.
  Existing rows were backfilled: a row without a creation entry in `partner_audit_logs` came
  from the CRM.
- `crmSyncedAt`: stamped on every CRM event applied to the row.
- `crmAssigneeName`: the record's manager in the CRM (`assigneeName` in the event; absent means
  nobody).
- `stage` is now stored normalized for every application, so lists filter on it
  (`GET /partner-applications?origin=CRM&stage=5`; `search` also matches the CRM manager).

The CRM requires an intake to create an application when the program offers intakes, so its
applications reach this service at once. `student_documents` rows store the storage key (reads
resolve a stable public URL, also for older rows saved with an expiring link), plus `fileSize`,
`mimeType` and the uploader; partners can't delete what an admin added.

## Echo suppression

A change applied from the other system must not be sent back. The consumer sets
`ww.origin = 'crm'` for its transaction and the `student_outbox_*` triggers skip it; the
CRM does the same with `crm.origin = 'sync'`. Consequently a record created in the CRM
appears in `WW_STUDENTS` only after it changes here.

## Conflicts

Last event wins. Statuses are the same nine values on both sides (the CRM uses lower
case). Retries: failed events are redelivered with backoff, up to 10 times.

## Compatibility

Adding fields is fine. Renaming or removing one needs a new `v2` subject published
alongside v1 until both sides have moved.
