-- Student events for edu-crm (two-way sync of applicants and applications).
-- partner_students and partner_applications enqueue "entity X changed" rows in
-- catalog_outbox, like the catalog and partner tables; CatalogEventsRelay
-- publishes their current state to the WW_STUDENTS stream (ww.student.v1).
--
-- Changes that came from edu-crm (applied by CrmEventsConsumer, which sets
-- ww.origin = 'crm' for its transaction) are not enqueued, so they are not sent
-- back to where they came from.

CREATE OR REPLACE FUNCTION student_outbox_capture() RETURNS trigger AS $$
BEGIN
    IF current_setting('ww.origin', true) = 'crm' THEN
        RETURN NULL;
    END IF;
    IF TG_OP <> 'DELETE' THEN
        INSERT INTO "catalog_outbox" ("entity", "entityId") VALUES (TG_ARGV[0], NEW."id");
    ELSE
        INSERT INTO "catalog_outbox" ("entity", "entityId") VALUES (TG_ARGV[0], OLD."id");
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER student_outbox_student AFTER INSERT OR UPDATE OR DELETE ON "partner_students"
    FOR EACH ROW EXECUTE FUNCTION student_outbox_capture('partner_student');
CREATE TRIGGER student_outbox_application AFTER INSERT OR UPDATE OR DELETE ON "partner_applications"
    FOR EACH ROW EXECUTE FUNCTION student_outbox_capture('partner_application');

-- Replace the backfill so it also queues every student and application
-- (students first, so they reach the stream before their applications).
CREATE OR REPLACE FUNCTION catalog_outbox_backfill() RETURNS BIGINT AS $$
    WITH ins AS (
        INSERT INTO "catalog_outbox" ("entity", "entityId")
                  SELECT 'country', "code"::TEXT FROM "Country"
        UNION ALL SELECT 'city', "id" FROM "City"
        UNION ALL SELECT 'study_language', "id" FROM "study_languages"
        UNION ALL SELECT 'faculty', "id" FROM "faculties"
        UNION ALL SELECT 'department', "id" FROM "departments"
        UNION ALL SELECT 'intake', "id" FROM "intakes"
        UNION ALL SELECT 'university', "id" FROM "universities"
        UNION ALL SELECT 'program', "id" FROM "university_programs"
        UNION ALL SELECT 'partner_org', "id" FROM "partner_organizations"
        UNION ALL SELECT 'partner_account', "id" FROM "users" WHERE "role" = 'PARTNER'
        UNION ALL SELECT 'partner_student', "id" FROM "partner_students"
        UNION ALL SELECT 'partner_application', "id" FROM "partner_applications"
        RETURNING 1
    )
    SELECT count(*) FROM ins;
$$ LANGUAGE sql;

-- Publish the students and applications that already exist, so the CRM gets
-- them on first run.
INSERT INTO "catalog_outbox" ("entity", "entityId")
          SELECT 'partner_student', "id" FROM "partner_students"
UNION ALL SELECT 'partner_application', "id" FROM "partner_applications";
