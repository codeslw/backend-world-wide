-- One admission model for every application, whoever submitted it.
--
-- Until now a client's application (`applications`) knew five statuses while a
-- partner's (`partner_applications`) and edu-crm know nine statuses and seven
-- process stages. This gives client applications the same status and stage.
-- The old five-value column stays and follows the new one (trigger below), so
-- API consumers that read `applicationStatus` keep working.

-- 1. Client applications: canonical status, stage and what edu-crm tracks.
ALTER TABLE "applications"
  ADD COLUMN "status" "PartnerApplicationStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "stage" INTEGER,
  ADD COLUMN "intakeId" TEXT,
  ADD COLUMN "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "detailsChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "visaStatus" TEXT,
  ADD COLUMN "origin" TEXT NOT NULL DEFAULT 'SITE',
  ADD COLUMN "crmSyncedAt" TIMESTAMP(3),
  ADD COLUMN "crmAssigneeName" TEXT;
ALTER TABLE "applications" ADD CONSTRAINT "applications_origin_check" CHECK ("origin" IN ('SITE', 'ADMIN', 'CRM'));
ALTER TABLE "applications" ADD CONSTRAINT "applications_visa_check"
  CHECK ("visaStatus" IN ('PREPARING', 'SUBMITTED', 'APPROVED', 'REFUSED'));

-- 2. Partner applications: when the status and the details last changed (the
-- newest change wins when both systems changed the same thing), the exact
-- intake (a program can have two intakes in one season), the visa.
ALTER TABLE "partner_applications"
  ADD COLUMN "intakeId" TEXT,
  ADD COLUMN "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "detailsChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "visaStatus" TEXT;
ALTER TABLE "partner_applications" ADD CONSTRAINT "partner_applications_visa_check"
  CHECK ("visaStatus" IN ('PREPARING', 'SUBMITTED', 'APPROVED', 'REFUSED'));

UPDATE "applications" SET
  "status" = CASE "applicationStatus"
    WHEN 'DRAFT' THEN 'DRAFT'::"PartnerApplicationStatus"
    WHEN 'SUBMITTED' THEN 'SUBMITTED'::"PartnerApplicationStatus"
    WHEN 'UNDER_REVIEW' THEN 'UNDER_REVIEW'::"PartnerApplicationStatus"
    WHEN 'APPROVED' THEN 'ACCEPTED'::"PartnerApplicationStatus"
    WHEN 'REJECTED' THEN 'REJECTED'::"PartnerApplicationStatus" END,
  "statusChangedAt" = "updatedAt", "detailsChangedAt" = "updatedAt";
UPDATE "partner_applications" SET "statusChangedAt" = "updatedAt", "detailsChangedAt" = "updatedAt";

-- 3. The stage a status allows: the same rule as src/crm-events/process-stage.ts
-- and edu-crm's NormalizeStage.
CREATE OR REPLACE FUNCTION admission_stage(p_status TEXT, p_stage INTEGER) RETURNS INTEGER AS $$
  SELECT CASE p_status
    WHEN 'DRAFT' THEN CASE WHEN p_stage BETWEEN 1 AND 3 THEN p_stage ELSE 2 END
    WHEN 'DOCUMENTS_REQUIRED' THEN 3
    WHEN 'SUBMITTED' THEN 4
    WHEN 'UNDER_REVIEW' THEN 4
    WHEN 'CONDITIONAL_OFFER' THEN 5
    WHEN 'ACCEPTED' THEN CASE WHEN p_stage IN (5, 6) THEN p_stage ELSE 5 END
    WHEN 'ENROLLED' THEN 7
    ELSE CASE WHEN p_stage BETWEEN 1 AND 7 THEN p_stage ELSE 2 END
  END;
$$ LANGUAGE sql IMMUTABLE;

UPDATE "applications" SET "stage" = admission_stage("status"::TEXT, "stage");

CREATE OR REPLACE FUNCTION application_legacy_status(p "PartnerApplicationStatus") RETURNS "ApplicationStatus" AS $$
  SELECT (CASE p
    WHEN 'DRAFT' THEN 'DRAFT'
    WHEN 'SUBMITTED' THEN 'SUBMITTED'
    WHEN 'ACCEPTED' THEN 'APPROVED'
    WHEN 'ENROLLED' THEN 'APPROVED'
    WHEN 'REJECTED' THEN 'REJECTED'
    WHEN 'WITHDRAWN' THEN 'REJECTED'
    ELSE 'UNDER_REVIEW' -- under review, documents required, conditional offer
  END)::"ApplicationStatus";
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION application_canonical_status(p "ApplicationStatus") RETURNS "PartnerApplicationStatus" AS $$
  SELECT (CASE p WHEN 'APPROVED' THEN 'ACCEPTED' ELSE p::TEXT END)::"PartnerApplicationStatus";
$$ LANGUAGE sql IMMUTABLE;

-- 4. Keep the two status columns, the stage and the change times consistent,
-- whichever code path writes the row. A writer that sets a change time itself
-- (changes arriving from edu-crm) keeps the one it set.
CREATE OR REPLACE FUNCTION applications_before_write() RETURNS trigger AS $$
DECLARE
  ts TIMESTAMP(3) := (clock_timestamp() AT TIME ZONE 'UTC');
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW."status" = 'DRAFT' AND NEW."applicationStatus" <> 'DRAFT' THEN
      NEW."status" := application_canonical_status(NEW."applicationStatus");
    END IF;
  ELSIF NEW."status" IS NOT DISTINCT FROM OLD."status"
        AND NEW."applicationStatus" IS DISTINCT FROM OLD."applicationStatus"
        AND application_legacy_status(NEW."status") <> NEW."applicationStatus" THEN
    NEW."status" := application_canonical_status(NEW."applicationStatus");
  END IF;
  NEW."applicationStatus" := application_legacy_status(NEW."status");
  NEW."stage" := admission_stage(NEW."status"::TEXT, NEW."stage");
  IF NEW."status" <> 'DRAFT' AND NEW."submittedAt" IS NULL AND NEW."status" <> 'WITHDRAWN' THEN
    NEW."submittedAt" := ts;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF (NEW."status", NEW."stage", NEW."rejectionReason") IS DISTINCT FROM (OLD."status", OLD."stage", OLD."rejectionReason")
       AND NEW."statusChangedAt" = OLD."statusChangedAt" THEN
      NEW."statusChangedAt" := ts;
    END IF;
    IF (NEW."preferredUniversity", NEW."preferredProgram", NEW."intakeSeason", NEW."intakeYear", NEW."intakeId")
       IS DISTINCT FROM (OLD."preferredUniversity", OLD."preferredProgram", OLD."intakeSeason", OLD."intakeYear", OLD."intakeId") THEN
      -- A season or year picked without naming the intake no longer refers to the old one.
      IF NEW."intakeId" IS NOT DISTINCT FROM OLD."intakeId" THEN NEW."intakeId" := NULL; END IF;
      IF NEW."detailsChangedAt" = OLD."detailsChangedAt" THEN NEW."detailsChangedAt" := ts; END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER applications_before_write BEFORE INSERT OR UPDATE ON "applications"
  FOR EACH ROW EXECUTE FUNCTION applications_before_write();

CREATE OR REPLACE FUNCTION partner_applications_before_write() RETURNS trigger AS $$
DECLARE
  ts TIMESTAMP(3) := (clock_timestamp() AT TIME ZONE 'UTC');
BEGIN
  NEW."stage" := admission_stage(NEW."status"::TEXT, NEW."stage");
  IF TG_OP = 'UPDATE' THEN
    IF (NEW."status", NEW."stage", NEW."rejectionReason") IS DISTINCT FROM (OLD."status", OLD."stage", OLD."rejectionReason")
       AND NEW."statusChangedAt" = OLD."statusChangedAt" THEN
      NEW."statusChangedAt" := ts;
    END IF;
    IF (NEW."universityId", NEW."programId", NEW."intakeSeason", NEW."intakeYear", NEW."intakeId")
       IS DISTINCT FROM (OLD."universityId", OLD."programId", OLD."intakeSeason", OLD."intakeYear", OLD."intakeId") THEN
      IF NEW."intakeId" IS NOT DISTINCT FROM OLD."intakeId" THEN NEW."intakeId" := NULL; END IF;
      IF NEW."detailsChangedAt" = OLD."detailsChangedAt" THEN NEW."detailsChangedAt" := ts; END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER partner_applications_before_write BEFORE INSERT OR UPDATE ON "partner_applications"
  FOR EACH ROW EXECUTE FUNCTION partner_applications_before_write();

CREATE INDEX "applications_status_idx" ON "applications"("status");
CREATE INDEX "applications_stage_idx" ON "applications"("stage");

-- 5. Documents: one vocabulary (DocumentRequirementKind) across the process
-- template, the program's requirements and what applicants upload, so a
-- passport on the profile answers the passport requirement.
ALTER TABLE "application_document_types" ADD COLUMN "kind" "DocumentRequirementKind";
ALTER TABLE "application_documents"
  ADD COLUMN "requirementKind" "DocumentRequirementKind",
  ADD COLUMN "expiresAt" TIMESTAMP(3),
  ADD COLUMN "uploadedByName" TEXT;
CREATE INDEX "application_documents_requirementKind_idx" ON "application_documents"("requirementKind");
ALTER TABLE "student_documents"
  ADD COLUMN "expiresAt" TIMESTAMP(3),
  ADD COLUMN "uploadedByName" TEXT;

UPDATE "application_document_types" SET "kind" = (CASE
  WHEN "name" ~* 'passport|паспорт|pasport' THEN 'PASSPORT'
  WHEN "name" ~* 'transcript|табель|транскрипт|tabel' THEN 'TRANSCRIPT'
  WHEN "name" ~* 'diploma|аттестат|диплом|degree|attestat' THEN 'DIPLOMA'
  WHEN "name" ~* 'recommend|referral|рекоменд' THEN 'RECOMMENDATION_LETTER'
  WHEN "name" ~* 'motivation|statement of purpose|мотивац' THEN 'MOTIVATION_LETTER'
  WHEN "name" ~* 'bank|financial|funds|банк|финанс' THEN 'FINANCIAL_PROOF'
  WHEN "name" ~* 'ielts|toefl|language|english|язык|duolingo' THEN 'ENGLISH_CERTIFICATE'
  WHEN "name" ~* '\m(gmat|gre|sat|act)\M' THEN 'STANDARDIZED_TEST_SCORE'
  WHEN "name" ~* 'photo|фото' THEN 'PHOTO'
  WHEN "name" ~* 'medical|медиц' THEN 'MEDICAL_CERTIFICATE'
  WHEN "name" ~* '\m(cv|resume|résumé|резюме)\M' THEN 'CV'
  WHEN "name" ~* 'portfolio|портфолио' THEN 'PORTFOLIO'
  WHEN "name" ~* 'research' THEN 'RESEARCH_PROPOSAL'
  ELSE NULL END)::"DocumentRequirementKind"
WHERE "kind" IS NULL;

-- 6. Mini applications: what the public forms already send (service, country,
-- notes) is kept now, and edu-crm works them.
ALTER TABLE "mini_applications"
  ALTER COLUMN "lastName" SET DEFAULT '',
  ADD COLUMN "source" TEXT NOT NULL DEFAULT 'QUICK_FORM',
  ADD COLUMN "service" TEXT,
  ADD COLUMN "country" TEXT,
  ADD COLUMN "notes" TEXT,
  ADD COLUMN "universityId" TEXT,
  ADD COLUMN "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "crmSyncedAt" TIMESTAMP(3),
  ADD COLUMN "crmAssigneeName" TEXT;
UPDATE "mini_applications" SET "statusChangedAt" = "updatedAt";
CREATE INDEX "mini_applications_createdAt_idx" ON "mini_applications"("createdAt");

CREATE OR REPLACE FUNCTION mini_applications_before_update() RETURNS trigger AS $$
BEGIN
  IF NEW."status" IS DISTINCT FROM OLD."status" AND NEW."statusChangedAt" = OLD."statusChangedAt" THEN
    NEW."statusChangedAt" := (clock_timestamp() AT TIME ZONE 'UTC');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER mini_applications_before_update BEFORE UPDATE ON "mini_applications"
  FOR EACH ROW EXECUTE FUNCTION mini_applications_before_update();

-- 7. When a password last changed: edu-crm ends the sessions opened before it.
ALTER TABLE "users" ADD COLUMN "passwordChangedAt" TIMESTAMP(3);
CREATE OR REPLACE FUNCTION users_password_changed() RETURNS trigger AS $$
BEGIN
  IF NEW."password" IS DISTINCT FROM OLD."password" THEN
    NEW."passwordChangedAt" := (clock_timestamp() AT TIME ZONE 'UTC');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER users_password_changed BEFORE UPDATE ON "users"
  FOR EACH ROW EXECUTE FUNCTION users_password_changed();
