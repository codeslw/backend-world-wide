-- edu-crm becomes the internal system of the admin team. It receives every
-- applicant and application, client and partner ones alike, the mini
-- applications and the admin accounts. Same mechanism as before: triggers write
-- catalog_outbox rows, CatalogEventsRelay publishes the current state.
--
-- Changes applied from edu-crm (ww.origin = 'crm') are not queued, so they are
-- not sent back.

-- 1. The admin team's own "agency". Applicants that staff add in edu-crm are
-- kept here as partner students of this organization. Its account can't sign
-- in (the password is not a bcrypt hash).
INSERT INTO "users" ("id", "email", "password", "role", "isEmailVerified", "createdAt", "updatedAt")
VALUES ('00000000-0000-4000-8000-00000000c002', 'crm-internal@system.invalid', '!', 'PARTNER', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;
INSERT INTO "profiles" ("id", "userId", "firstName", "lastName", "recommendationLetterGuids", "createdAt", "updatedAt")
VALUES ('00000000-0000-4000-8000-00000000c003', '00000000-0000-4000-8000-00000000c002', 'Edu CRM', '', '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;
INSERT INTO "partner_organizations" ("id", "ownerId", "name", "isActive", "createdAt", "updatedAt")
VALUES ('00000000-0000-4000-8000-00000000c001', '00000000-0000-4000-8000-00000000c002', 'World Wide Consulting (CRM)', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION crm_outbox_enqueue(p_entity TEXT, p_id TEXT) RETURNS void AS $$
BEGIN
  IF p_id IS NULL OR current_setting('ww.origin', true) = 'crm' THEN RETURN; END IF;
  INSERT INTO "catalog_outbox" ("entity", "entityId") VALUES (p_entity, p_id);
END;
$$ LANGUAGE plpgsql;

-- 2. Accounts: admins and clients (partners keep their own trigger). A role
-- change queues the old kind too, so it is removed there.
CREATE OR REPLACE FUNCTION people_outbox_user() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW."role" = OLD."role" AND NEW."email" = OLD."email"
     AND NEW."passwordChangedAt" IS NOT DISTINCT FROM OLD."passwordChangedAt" THEN
    RETURN NULL;
  END IF;
  IF TG_OP <> 'INSERT' THEN
    IF OLD."role" = 'ADMIN' THEN PERFORM crm_outbox_enqueue('admin_account', OLD."id"); END IF;
    IF OLD."role" = 'CLIENT' THEN PERFORM crm_outbox_enqueue('client_applicant', OLD."id"); END IF;
  END IF;
  IF TG_OP <> 'DELETE' AND (TG_OP = 'INSERT' OR NEW."role" <> OLD."role") THEN
    IF NEW."role" = 'ADMIN' THEN PERFORM crm_outbox_enqueue('admin_account', NEW."id"); END IF;
    IF NEW."role" = 'CLIENT' THEN PERFORM crm_outbox_enqueue('client_applicant', NEW."id"); END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER people_outbox_user AFTER INSERT OR UPDATE OR DELETE ON "users"
  FOR EACH ROW EXECUTE FUNCTION people_outbox_user();

-- Profiles of admins and clients. Files on a client's profile answer document
-- requirements, so the client's applications follow.
CREATE OR REPLACE FUNCTION people_outbox_profile() RETURNS trigger AS $$
DECLARE
  uid TEXT := COALESCE(NEW."userId", OLD."userId");
  pid TEXT := COALESCE(NEW."id", OLD."id");
  r "Role";
BEGIN
  SELECT "role" INTO r FROM "users" WHERE "id" = uid;
  IF r = 'ADMIN' THEN
    PERFORM crm_outbox_enqueue('admin_account', uid);
  ELSIF r = 'CLIENT' THEN
    PERFORM crm_outbox_enqueue('client_applicant', uid);
    IF TG_OP = 'UPDATE' AND (NEW."passportCopyGuid", NEW."cvGuid", NEW."motivationLetterGuid", NEW."recommendationLetterGuids")
       IS DISTINCT FROM (OLD."passportCopyGuid", OLD."cvGuid", OLD."motivationLetterGuid", OLD."recommendationLetterGuids") THEN
      PERFORM crm_outbox_enqueue('client_application', a."id") FROM "applications" a WHERE a."profileId" = pid;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER people_outbox_profile AFTER INSERT OR UPDATE OR DELETE ON "profiles"
  FOR EACH ROW EXECUTE FUNCTION people_outbox_profile();

-- Education and tests belong to a profile.
CREATE OR REPLACE FUNCTION people_outbox_profile_part() RETURNS trigger AS $$
DECLARE
  pid TEXT := COALESCE(NEW."profileId", OLD."profileId");
BEGIN
  PERFORM crm_outbox_enqueue('client_applicant', u."id")
    FROM "profiles" p JOIN "users" u ON u."id" = p."userId" AND u."role" = 'CLIENT' WHERE p."id" = pid;
  PERFORM crm_outbox_enqueue('client_application', a."id") FROM "applications" a WHERE a."profileId" = pid;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER people_outbox_education AFTER INSERT OR UPDATE OR DELETE ON "education_history"
  FOR EACH ROW EXECUTE FUNCTION people_outbox_profile_part();
CREATE TRIGGER people_outbox_language AFTER INSERT OR UPDATE OR DELETE ON "language_certificates"
  FOR EACH ROW EXECUTE FUNCTION people_outbox_profile_part();
CREATE TRIGGER people_outbox_tests AFTER INSERT OR UPDATE OR DELETE ON "standardized_tests"
  FOR EACH ROW EXECUTE FUNCTION people_outbox_profile_part();

-- 3. Client applications and mini applications (student_outbox_capture already
-- skips changes that came from edu-crm).
CREATE TRIGGER student_outbox_client_application AFTER INSERT OR UPDATE OR DELETE ON "applications"
  FOR EACH ROW EXECUTE FUNCTION student_outbox_capture('client_application');
CREATE TRIGGER student_outbox_mini_application AFTER INSERT OR UPDATE OR DELETE ON "mini_applications"
  FOR EACH ROW EXECUTE FUNCTION student_outbox_capture('mini_application');

-- 4. Documents: an upload or a review changes the progress shown on the
-- application. Queued whoever made the change: edu-crm reads the counts from here.
CREATE OR REPLACE FUNCTION document_outbox_application() RETURNS trigger AS $$
DECLARE
  partner_app TEXT := COALESCE(NEW."partnerApplicationId", OLD."partnerApplicationId");
  client_app TEXT := COALESCE(NEW."applicationId", OLD."applicationId");
BEGIN
  IF partner_app IS NOT NULL THEN
    INSERT INTO "catalog_outbox" ("entity", "entityId") VALUES ('partner_application', partner_app);
  END IF;
  IF client_app IS NOT NULL THEN
    INSERT INTO "catalog_outbox" ("entity", "entityId") VALUES ('client_application', client_app);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER document_outbox_application AFTER INSERT OR UPDATE OR DELETE ON "application_documents"
  FOR EACH ROW EXECUTE FUNCTION document_outbox_application();

CREATE OR REPLACE FUNCTION document_outbox_student() RETURNS trigger AS $$
DECLARE
  sid TEXT := COALESCE(NEW."studentId", OLD."studentId");
BEGIN
  INSERT INTO "catalog_outbox" ("entity", "entityId") VALUES ('partner_student', sid);
  INSERT INTO "catalog_outbox" ("entity", "entityId")
    SELECT 'partner_application', "id" FROM "partner_applications" WHERE "partnerStudentId" = sid;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER document_outbox_student AFTER INSERT OR UPDATE OR DELETE ON "student_documents"
  FOR EACH ROW EXECUTE FUNCTION document_outbox_student();

-- 5. The backfill covers the new entities (people first, so they reach the
-- stream before their applications).
CREATE OR REPLACE FUNCTION catalog_outbox_backfill() RETURNS BIGINT AS $$
    WITH ins AS (
        INSERT INTO "catalog_outbox" ("entity", "entityId")
        SELECT e, i FROM (
                  SELECT 1 AS o, 'country' AS e, "code"::TEXT AS i FROM "Country"
        UNION ALL SELECT 2, 'city', "id" FROM "City"
        UNION ALL SELECT 3, 'study_language', "id" FROM "study_languages"
        UNION ALL SELECT 4, 'faculty', "id" FROM "faculties"
        UNION ALL SELECT 5, 'department', "id" FROM "departments"
        UNION ALL SELECT 6, 'intake', "id" FROM "intakes"
        UNION ALL SELECT 7, 'university', "id" FROM "universities"
        UNION ALL SELECT 8, 'program', "id" FROM "university_programs"
        UNION ALL SELECT 9, 'partner_org', "id" FROM "partner_organizations"
        UNION ALL SELECT 10, 'partner_account', "id" FROM "users" WHERE "role" = 'PARTNER'
        UNION ALL SELECT 11, 'admin_account', "id" FROM "users" WHERE "role" = 'ADMIN'
        UNION ALL SELECT 12, 'partner_student', "id" FROM "partner_students"
        UNION ALL SELECT 13, 'client_applicant', "id" FROM "users" WHERE "role" = 'CLIENT'
        UNION ALL SELECT 14, 'partner_application', "id" FROM "partner_applications"
        UNION ALL SELECT 15, 'client_application', "id" FROM "applications"
        UNION ALL SELECT 16, 'mini_application', "id" FROM "mini_applications"
        ) x ORDER BY o
        RETURNING 1
    )
    SELECT count(*) FROM ins;
$$ LANGUAGE sql;

-- 6. Publish what exists. Partner accounts are queued again so their last
-- message on the stream no longer carries a password hash.
INSERT INTO "catalog_outbox" ("entity", "entityId")
SELECT e, i FROM (
          SELECT 1 AS o, 'partner_org' AS e, "id" AS i FROM "partner_organizations"
UNION ALL SELECT 2, 'partner_account', "id" FROM "users" WHERE "role" = 'PARTNER'
UNION ALL SELECT 3, 'admin_account', "id" FROM "users" WHERE "role" = 'ADMIN'
UNION ALL SELECT 4, 'partner_student', "id" FROM "partner_students"
UNION ALL SELECT 5, 'client_applicant', "id" FROM "users" WHERE "role" = 'CLIENT'
UNION ALL SELECT 6, 'partner_application', "id" FROM "partner_applications"
UNION ALL SELECT 7, 'client_application', "id" FROM "applications"
UNION ALL SELECT 8, 'mini_application', "id" FROM "mini_applications"
) x ORDER BY o;
