-- Catalog outbox: every change to a catalog table records "entity X changed"
-- in the same transaction, via triggers. CatalogEventsRelay publishes the
-- entity's current state to NATS JetStream and stamps "publishedAt".

-- CreateTable
CREATE TABLE "catalog_outbox" (
    "id" BIGSERIAL NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "catalog_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "catalog_outbox_publishedAt_id_idx" ON "catalog_outbox"("publishedAt", "id");

-- Trigger function. TG_ARGV[0] = entity name, TG_ARGV[1] = column holding the
-- entity id (e.g. "id", "code", or "universityProgramId" for the join table,
-- where an intake link change is a change of the program).
CREATE OR REPLACE FUNCTION catalog_outbox_capture() RETURNS trigger AS $$
DECLARE
    new_id TEXT;
    old_id TEXT;
BEGIN
    IF TG_OP <> 'DELETE' THEN
        new_id := to_jsonb(NEW) ->> TG_ARGV[1];
        INSERT INTO "catalog_outbox" ("entity", "entityId") VALUES (TG_ARGV[0], new_id);
    END IF;
    IF TG_OP <> 'INSERT' THEN
        old_id := to_jsonb(OLD) ->> TG_ARGV[1];
        IF new_id IS DISTINCT FROM old_id THEN
            INSERT INTO "catalog_outbox" ("entity", "entityId") VALUES (TG_ARGV[0], old_id);
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER catalog_outbox_country AFTER INSERT OR UPDATE OR DELETE ON "Country"
    FOR EACH ROW EXECUTE FUNCTION catalog_outbox_capture('country', 'code');
CREATE TRIGGER catalog_outbox_city AFTER INSERT OR UPDATE OR DELETE ON "City"
    FOR EACH ROW EXECUTE FUNCTION catalog_outbox_capture('city', 'id');
CREATE TRIGGER catalog_outbox_university AFTER INSERT OR UPDATE OR DELETE ON "universities"
    FOR EACH ROW EXECUTE FUNCTION catalog_outbox_capture('university', 'id');
CREATE TRIGGER catalog_outbox_faculty AFTER INSERT OR UPDATE OR DELETE ON "faculties"
    FOR EACH ROW EXECUTE FUNCTION catalog_outbox_capture('faculty', 'id');
CREATE TRIGGER catalog_outbox_department AFTER INSERT OR UPDATE OR DELETE ON "departments"
    FOR EACH ROW EXECUTE FUNCTION catalog_outbox_capture('department', 'id');
CREATE TRIGGER catalog_outbox_study_language AFTER INSERT OR UPDATE OR DELETE ON "study_languages"
    FOR EACH ROW EXECUTE FUNCTION catalog_outbox_capture('study_language', 'id');
CREATE TRIGGER catalog_outbox_intake AFTER INSERT OR UPDATE OR DELETE ON "intakes"
    FOR EACH ROW EXECUTE FUNCTION catalog_outbox_capture('intake', 'id');
CREATE TRIGGER catalog_outbox_program AFTER INSERT OR UPDATE OR DELETE ON "university_programs"
    FOR EACH ROW EXECUTE FUNCTION catalog_outbox_capture('program', 'id');
CREATE TRIGGER catalog_outbox_program_intake AFTER INSERT OR UPDATE OR DELETE ON "university_program_intakes"
    FOR EACH ROW EXECUTE FUNCTION catalog_outbox_capture('program', 'universityProgramId');

-- Enqueue every catalog entity for (re)publishing. Used for the initial sync
-- below and by `npm run catalog:resync`.
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
        RETURNING 1
    )
    SELECT count(*) FROM ins;
$$ LANGUAGE sql;

SELECT catalog_outbox_backfill();
