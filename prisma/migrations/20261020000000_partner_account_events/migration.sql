-- Partner events for edu-crm. Same outbox as the catalog (catalog_outbox);
-- these rows say "partner_account X changed" or "partner_org X changed" and
-- CatalogEventsRelay publishes the current state to the WW_PARTNERS stream.
--
-- partner_account is keyed by USER id: it covers org owners (who have no
-- partner_members row) and members alike. The snapshot builder decides the
-- organization and role, so every table that influences it enqueues the user.

CREATE OR REPLACE FUNCTION partner_outbox_enqueue(p_entity TEXT, p_id TEXT) RETURNS void AS $$
    INSERT INTO "catalog_outbox" ("entity", "entityId") VALUES (p_entity, p_id);
$$ LANGUAGE sql;

-- users: only PARTNER users matter (clients and admins are not synced).
CREATE OR REPLACE FUNCTION partner_outbox_user() RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD."role" = 'PARTNER' THEN PERFORM partner_outbox_enqueue('partner_account', OLD."id"); END IF;
    ELSIF NEW."role" = 'PARTNER' OR (TG_OP = 'UPDATE' AND OLD."role" = 'PARTNER') THEN
        PERFORM partner_outbox_enqueue('partner_account', NEW."id");
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- profiles: name and phone live here.
CREATE OR REPLACE FUNCTION partner_outbox_profile() RETURNS trigger AS $$
DECLARE
    uid TEXT := COALESCE(NEW."userId", OLD."userId");
BEGIN
    IF EXISTS (SELECT 1 FROM "users" WHERE "id" = uid AND "role" = 'PARTNER') THEN
        PERFORM partner_outbox_enqueue('partner_account', uid);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION partner_outbox_member() RETURNS trigger AS $$
BEGIN
    IF TG_OP <> 'DELETE' THEN PERFORM partner_outbox_enqueue('partner_account', NEW."userId"); END IF;
    IF TG_OP <> 'INSERT' AND (TG_OP = 'DELETE' OR NEW."userId" <> OLD."userId") THEN
        PERFORM partner_outbox_enqueue('partner_account', OLD."userId");
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION partner_outbox_permission() RETURNS trigger AS $$
DECLARE
    uid TEXT;
BEGIN
    SELECT "userId" INTO uid FROM "partner_members" WHERE "id" = COALESCE(NEW."memberId", OLD."memberId");
    IF uid IS NOT NULL THEN PERFORM partner_outbox_enqueue('partner_account', uid); END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- organizations: the org itself, plus its owner's account (owner role/org).
CREATE OR REPLACE FUNCTION partner_outbox_org() RETURNS trigger AS $$
BEGIN
    IF TG_OP <> 'DELETE' THEN
        PERFORM partner_outbox_enqueue('partner_org', NEW."id");
        PERFORM partner_outbox_enqueue('partner_account', NEW."ownerId");
    END IF;
    IF TG_OP <> 'INSERT' THEN
        IF TG_OP = 'DELETE' THEN PERFORM partner_outbox_enqueue('partner_org', OLD."id"); END IF;
        IF TG_OP = 'DELETE' OR NEW."ownerId" <> OLD."ownerId" THEN
            PERFORM partner_outbox_enqueue('partner_account', OLD."ownerId");
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER partner_outbox_user AFTER INSERT OR UPDATE OR DELETE ON "users"
    FOR EACH ROW EXECUTE FUNCTION partner_outbox_user();
CREATE TRIGGER partner_outbox_profile AFTER INSERT OR UPDATE OR DELETE ON "profiles"
    FOR EACH ROW EXECUTE FUNCTION partner_outbox_profile();
CREATE TRIGGER partner_outbox_member AFTER INSERT OR UPDATE OR DELETE ON "partner_members"
    FOR EACH ROW EXECUTE FUNCTION partner_outbox_member();
CREATE TRIGGER partner_outbox_permission AFTER INSERT OR UPDATE OR DELETE ON "partner_permissions"
    FOR EACH ROW EXECUTE FUNCTION partner_outbox_permission();
CREATE TRIGGER partner_outbox_org AFTER INSERT OR UPDATE OR DELETE ON "partner_organizations"
    FOR EACH ROW EXECUTE FUNCTION partner_outbox_org();

-- Replace the backfill so it also queues every partner org and account.
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
        RETURNING 1
    )
    SELECT count(*) FROM ins;
$$ LANGUAGE sql;

-- Publish the partners that already exist (the catalog was queued by the
-- earlier migration).
INSERT INTO "catalog_outbox" ("entity", "entityId")
          SELECT 'partner_org', "id" FROM "partner_organizations"
UNION ALL SELECT 'partner_account', "id" FROM "users" WHERE "role" = 'PARTNER';
