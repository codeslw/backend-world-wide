# Student events (`ww.student.v1` and `crm.student.v1`)

edu-crm is the admin team's tool for admissions: **every** applicant, application and
website request is mirrored there under the **same id**, over NATS JetStream, and what
the team does in the CRM comes back.

| edu-world-wide | edu-crm | WW_STUDENTS entity |
|---|---|---|
| client user + profile | applicant (`client`) | `client_applicant` (keyed by user id) |
| `partner_students` | applicant (`partner`) | `partner_student` |
| `applications` | application (`client`) | `client_application` |
| `partner_applications` | application (`partner`) | `partner_application` |
| `mini_applications` | website request | `mini_application` |

```
edu-world-wide ──WW_STUDENTS──▶ edu-crm      (ww.student.v1.<entity>.<id>)
edu-world-wide ◀─CRM_STUDENTS── edu-crm      (crm.student.v1.<entity>.<id>)
```

## world-wide → CRM

Triggers write `catalog_outbox` rows; `CatalogEventsRelay` publishes the current
state within about a quarter second, last message per subject kept. A deleted row is a
tombstone (`deleted: true`). Open applications are re-published nightly so their
document counts and expiry dates stay current.

- **Applicants** (`client_applicant`, `partner_student`): `id, kind, partnerId?,
  organizationId?, firstName, lastName, middleName, phone, email, accountEmail?,
  dateOfBirth, gender, nationality, country, city, passportExpiryDate, hasPassport,
  leadSource, profile {desiredLevel, education[], tests[]}, documentKinds[],
  documentExpiries[], origin, createdAt, updatedAt`. Passport numbers and addresses
  are not published; the CRM reads the full profile through `GET /crm/applicants/:kind/:id`.
- **Applications**: `id, kind, applicantId, partnerId?, organizationId?,
  universityId, programId, intakeSeason, intakeYear, intakeId, status, stage,
  rejectionReason, submittedAt, reviewedAt, statusChangedAt, detailsChangedAt,
  visaStatus, notes, adminNotes, englishProficiency, gpa, prerequisites,
  backupPrograms, documents {required, uploaded, approved, rejected},
  documentExpiries, origin, createdAt, updatedAt`.
- **Mini applications**: `id, firstName, lastName, phone, source, service, country,
  notes, universityId, status (NEW|CONTACTED|CLOSED), statusChangedAt, createdAt,
  updatedAt`.

On deploy, the migration queues every record. `npm run catalog:resync` republishes
everything.

## CRM → world-wide (`CRM_STUDENTS`)

Subjects `crm.student.v1.{applicant,application,mini_application}.<id>`, the whole
record, `data` without null fields. `CrmEventsConsumer` (durable `ww-students`) and
`CrmStudentsApplier` upsert it. Failed events are retried with backoff (up to 10
minutes apart) for as long as it takes, with an error logged after 10 attempts.

- **applicant**: contacts go to the client's profile (never their sign-in email), or to
  the partner student. A student made in the CRM belongs to the internal house agency.
- **application**: status, stage, rejection reason, submission, university, program,
  intake and visa. The CRM's internal notes are never sent. A status change made by a
  partner application's CRM user is written to the audit log under `changedByName`.
  Applications need an intake.
- **mini_application**: status and the CRM manager. The CRM's finer statuses map
  onto ours: `qualified` arrives as `CONTACTED`, `converted` as `CLOSED`.

## Statuses, stages and conflicts

Client and partner applications use the same **nine statuses** (`applications.status`;
the old five-value `applicationStatus` is derived from it by a trigger) and **seven
stages** (1 Консультация, 2 Выбор вуза, 3 Документы, 4 Подача, 5 Оффер, 6 Виза,
7 Готово). `admission_stage()` in SQL, `normalizeStage` here and `NormalizeStage` in
edu-crm are the same rule.

Each application keeps two change times: `statusChangedAt` (status, stage, rejection
reason, submission) and `detailsChangedAt` (university, program, intake). **The later
change wins, group by group**, and both systems apply exactly this rule (`newerGroups`).
When the CRM sends something older than what is here, we send ours back. In both
systems, users can't reopen a closed application or return it to draft.

`PUT /applications/:id/status` and `PUT /partner-applications/:id/status` enforce the
same transition rule as edu-crm; responses carry `stage` and `allowedStatuses`.

## Documents

Documents stay here (`application_documents`, `student_documents`, profile files).
Kinds are `DocumentRequirementKind`. An application's checklist merges the process
template with the program's document requirements by kind; a requirement the program
adds is addressed as `kind:<KIND>`. Matching profile files appear in the checklist and
can be attached (`POST /application-documents/from-profile`, admins). The response's
`documentTypeId` is the key to upload against.

edu-crm calls these endpoints with `X-Service-Token: <CRM_SERVICE_TOKEN>` and either
`X-Act-As-User: <admin id>` (the signed-in admin, or the configured one for CRM staff)
or `X-Act-As-Student: partner:<id> | client:<user id>` (the student's own page in the
CRM, which can only reach that student's applications). `ServiceActorGuard` covers
`/application-documents/*`, `/student-documents/*`, `POST /files/upload` and
`/crm/applicants/*`.

## Tracking in the admin panel

Records carry `origin` (where they were created), `crmSyncedAt` and `crmAssigneeName`
(the CRM manager), and the admin panel shows them.

## Echo suppression

The consumer sets `ww.origin = 'crm'` for its transaction, which the outbox triggers
skip; edu-crm does the same with `crm.origin = 'sync'`. Documents are the exception:
a change to an application's documents always republishes the application, because its
counts must reach the CRM.

## Deploy order

Deploy edu-crm first, then this service right after. This service's migrations queue
everything the CRM needs; admins can't sign in to the new CRM until this version runs
(it answers the password checks).

## Compatibility

Adding fields is fine. Renaming or removing one needs a new `v2` subject published
alongside v1 until both sides have moved.
