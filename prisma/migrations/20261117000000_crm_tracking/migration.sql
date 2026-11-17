-- Lets the admin panel track what edu-crm sends: where a student or an
-- application was created, when the CRM last updated it, and who manages it
-- there. Student documents get the file details and uploader that
-- application documents already have.

ALTER TABLE "partner_students"
  ADD COLUMN "origin" TEXT NOT NULL DEFAULT 'PORTAL',
  ADD COLUMN "crmSyncedAt" TIMESTAMP(3),
  ADD COLUMN "crmAssigneeName" TEXT;

ALTER TABLE "partner_applications"
  ADD COLUMN "origin" TEXT NOT NULL DEFAULT 'PORTAL',
  ADD COLUMN "crmSyncedAt" TIMESTAMP(3),
  ADD COLUMN "crmAssigneeName" TEXT;

-- origin: PORTAL (partner portal), ADMIN (admin panel), CRM (edu-crm).
ALTER TABLE "partner_students" ADD CONSTRAINT "partner_students_origin_check" CHECK ("origin" IN ('PORTAL', 'ADMIN', 'CRM'));
ALTER TABLE "partner_applications" ADD CONSTRAINT "partner_applications_origin_check" CHECK ("origin" IN ('PORTAL', 'ADMIN', 'CRM'));
CREATE INDEX "partner_students_origin_idx" ON "partner_students"("origin");
CREATE INDEX "partner_applications_origin_idx" ON "partner_applications"("origin");

-- Backfill. The portal and the admin panel audit every creation; the CRM
-- consumer doesn't, so a record without a creation entry came from the CRM.
UPDATE "partner_applications" SET "origin" = 'ADMIN' WHERE "createdByAdminId" IS NOT NULL;
UPDATE "partner_applications" pa SET "origin" = 'CRM'
WHERE pa."createdByAdminId" IS NULL AND NOT EXISTS (
  SELECT 1 FROM "partner_audit_logs" l
  WHERE l."action" = 'APPLICATION_CREATED' AND l."targetId" = pa."id");
UPDATE "partner_students" ps SET "origin" = 'CRM'
WHERE NOT EXISTS (
  SELECT 1 FROM "partner_audit_logs" l
  WHERE l."action" = 'STUDENT_CREATED' AND l."targetId" = ps."id");

ALTER TABLE "student_documents"
  ADD COLUMN "fileSize" INTEGER,
  ADD COLUMN "mimeType" TEXT,
  ADD COLUMN "uploadedById" TEXT,
  ADD COLUMN "uploadedByRole" "Role";
ALTER TABLE "student_documents" ADD CONSTRAINT "student_documents_uploadedById_fkey"
  FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Store the stage the status implies wherever it was never set or is out of
-- range (same rule as src/crm-events/process-stage.ts), so lists can filter on it.
UPDATE "partner_applications" SET "stage" = CASE "status"
    WHEN 'DRAFT' THEN CASE WHEN "stage" BETWEEN 1 AND 3 THEN "stage" ELSE 2 END
    WHEN 'DOCUMENTS_REQUIRED' THEN 3
    WHEN 'SUBMITTED' THEN 4
    WHEN 'UNDER_REVIEW' THEN 4
    WHEN 'CONDITIONAL_OFFER' THEN 5
    WHEN 'ACCEPTED' THEN CASE WHEN "stage" IN (5, 6) THEN "stage" ELSE 5 END
    WHEN 'ENROLLED' THEN 7
    ELSE CASE WHEN "stage" BETWEEN 1 AND 7 THEN "stage" ELSE 2 END
  END;
CREATE INDEX "partner_applications_stage_idx" ON "partner_applications"("stage");
