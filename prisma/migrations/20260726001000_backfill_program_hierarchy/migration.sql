-- Data migration companion to 20260726000000_program_hierarchy_schema.
--
-- Background: the `programs` table was nominally a shared catalog but in
-- practice held ~1970 flat rows (no parent/child links, ~1845 distinct titles,
-- almost 1:1 with university_programs). It is therefore folded into
-- university_programs, which becomes the authoritative program entity, and a
-- small curated `faculties` taxonomy takes over the grouping role.
--
-- Steps:
--   1. copy programs.title onto university_programs.title
--   2. repoint applications / partner_applications / process templates from
--      programs.id to university_programs.id (materialising placeholder rows so
--      no application is orphaned)
--   3. seed the standard faculties and keyword-assign existing programs
--   4. drop university_programs."programId" and generate slugs
--
-- `programs` itself is intentionally left in place (now unreferenced) so this
-- can be rolled back; drop it in a follow-up once the new model is proven.

-- 1. Fold the catalog title into the program itself -------------------------

UPDATE "university_programs" up
SET "title" = COALESCE(NULLIF(TRIM(p."title"), ''), 'Untitled program')
FROM "programs" p
WHERE p."id" = up."programId";

-- Any row whose catalog entry vanished still needs a name.
UPDATE "university_programs" SET "title" = 'Untitled program' WHERE "title" IS NULL OR TRIM("title") = '';

ALTER TABLE "university_programs" ALTER COLUMN "title" SET NOT NULL;

-- 2. Repoint the application foreign keys -----------------------------------

ALTER TABLE "applications" DROP CONSTRAINT IF EXISTS "applications_preferredProgram_fkey";
ALTER TABLE "partner_applications" DROP CONSTRAINT IF EXISTS "partner_applications_programId_fkey";
ALTER TABLE "application_process_templates" DROP CONSTRAINT IF EXISTS "application_process_templates_programId_fkey";

-- Materialise a hidden university_programs row for every (university, catalog
-- program) pair referenced by an application that has no offering row, so the
-- new foreign keys can be enforced without deleting application history.
-- isActive = false keeps these placeholders out of every public listing.
INSERT INTO "university_programs" (
    "id", "universityId", "programId", "title", "tuitionFee", "tuitionFeeType",
    "tuitionFeeCurrency", "studyLevel", "studyMode", "additionalExpenses",
    "isActive", "isApplicationFeeRefundable", "isFeatured", "createdAt", "updatedAt"
)
SELECT
    gen_random_uuid()::TEXT, pairs."universityId", pairs."programId",
    COALESCE(NULLIF(TRIM(p."title"), ''), 'Untitled program'), 0, 'tuition_per_year',
    'USD', 'BACHELOR', 'FULL_TIME', '[]'::JSONB,
    false, false, false, NOW(), NOW()
FROM (
    SELECT DISTINCT "preferredUniversity" AS "universityId", "preferredProgram" AS "programId"
    FROM "applications"
    UNION
    SELECT DISTINCT "universityId", "programId" FROM "partner_applications"
) pairs
LEFT JOIN "programs" p ON p."id" = pairs."programId"
WHERE NOT EXISTS (
    SELECT 1 FROM "university_programs" up
    WHERE up."universityId" = pairs."universityId" AND up."programId" = pairs."programId"
);

-- Deterministic (university, catalog program) -> offering lookup. A catalog
-- program could be offered at several study levels; the lowest level wins.
UPDATE "applications" a
SET "preferredProgram" = m."id"
FROM (
    SELECT DISTINCT ON ("universityId", "programId") "universityId", "programId", "id"
    FROM "university_programs"
    ORDER BY "universityId", "programId", "studyLevel", "id"
) m
WHERE m."universityId" = a."preferredUniversity" AND m."programId" = a."preferredProgram";

UPDATE "partner_applications" pa
SET "programId" = m."id"
FROM (
    SELECT DISTINCT ON ("universityId", "programId") "universityId", "programId", "id"
    FROM "university_programs"
    ORDER BY "universityId", "programId", "studyLevel", "id"
) m
WHERE m."universityId" = pa."universityId" AND m."programId" = pa."programId";

-- Backup programs are a denormalised JSON snapshot keyed by catalog programId;
-- rewrite the ids so the stored references stay resolvable.
UPDATE "partner_applications" pa
SET "backupPrograms" = COALESCE((
    SELECT JSONB_AGG(
        CASE
            WHEN m."id" IS NOT NULL THEN JSONB_SET(elem, '{programId}', TO_JSONB(m."id"))
            ELSE elem
        END
    )
    FROM JSONB_ARRAY_ELEMENTS(pa."backupPrograms"::JSONB) AS elem
    LEFT JOIN LATERAL (
        SELECT DISTINCT ON (up."universityId", up."programId") up."id"
        FROM "university_programs" up
        WHERE up."universityId" = elem->>'universityId' AND up."programId" = elem->>'programId'
        ORDER BY up."universityId", up."programId", up."studyLevel", up."id"
    ) m ON TRUE
), '[]'::JSONB)
-- Only the type guard, deliberately. Postgres does not promise to evaluate
-- AND-ed conditions left to right, so pairing this with a
-- JSONB_ARRAY_LENGTH(...) > 0 check let the planner call array_length on rows
-- holding a JSON scalar and abort with 22023. The length check bought nothing
-- anyway: an empty array yields no JSONB_ARRAY_ELEMENTS rows, so JSONB_AGG
-- returns NULL and the COALESCE below rewrites '[]' to itself.
WHERE JSONB_TYPEOF(pa."backupPrograms"::JSONB) = 'array';

-- Process templates have no university context, so map to the oldest offering
-- of that catalog program. `programId` is UNIQUE, so drop the losers of any
-- collision back to NULL (which simply makes them standard templates).
UPDATE "application_process_templates" t
SET "programId" = m."id"
FROM (
    SELECT DISTINCT ON ("programId") "programId", "id"
    FROM "university_programs"
    ORDER BY "programId", "createdAt", "id"
) m
WHERE m."programId" = t."programId";

UPDATE "application_process_templates"
SET "programId" = NULL
WHERE "programId" IS NOT NULL
  AND "programId" NOT IN (SELECT "id" FROM "university_programs");

UPDATE "application_process_templates"
SET "programId" = NULL
WHERE "id" IN (
    SELECT "id" FROM (
        SELECT "id", ROW_NUMBER() OVER (PARTITION BY "programId" ORDER BY "createdAt", "id") AS rn
        FROM "application_process_templates"
        WHERE "programId" IS NOT NULL
    ) dupes
    WHERE rn > 1
);

ALTER TABLE "applications" ADD CONSTRAINT "applications_preferredProgram_fkey" FOREIGN KEY ("preferredProgram") REFERENCES "university_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "partner_applications" ADD CONSTRAINT "partner_applications_programId_fkey" FOREIGN KEY ("programId") REFERENCES "university_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "application_process_templates" ADD CONSTRAINT "application_process_templates_programId_fkey" FOREIGN KEY ("programId") REFERENCES "university_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. Seed the standard faculty taxonomy -------------------------------------

INSERT INTO "faculties" ("id", "slug", "nameEn", "nameRu", "nameUz", "iconKey", "sortOrder", "createdAt", "updatedAt")
VALUES
    (gen_random_uuid()::TEXT, 'engineering-technology',   'Engineering & Technology',            'Инженерия и технологии',            'Muhandislik va texnologiyalar',      'cog',              10, NOW(), NOW()),
    (gen_random_uuid()::TEXT, 'computer-science-it',      'Computer Science & IT',               'Компьютерные науки и ИТ',           'Kompyuter fanlari va AT',            'cpu',              20, NOW(), NOW()),
    (gen_random_uuid()::TEXT, 'business-management',      'Business & Management',               'Бизнес и менеджмент',               'Biznes va menejment',                'briefcase',        30, NOW(), NOW()),
    (gen_random_uuid()::TEXT, 'economics-finance',        'Economics & Finance',                 'Экономика и финансы',               'Iqtisodiyot va moliya',              'trending-up',      40, NOW(), NOW()),
    (gen_random_uuid()::TEXT, 'medicine-health',          'Medicine & Health Sciences',          'Медицина и здравоохранение',        'Tibbiyot va sogʻliqni saqlash',      'stethoscope',      50, NOW(), NOW()),
    (gen_random_uuid()::TEXT, 'natural-sciences',         'Natural Sciences',                    'Естественные науки',                'Tabiiy fanlar',                      'flask-conical',    60, NOW(), NOW()),
    (gen_random_uuid()::TEXT, 'mathematics-statistics',   'Mathematics & Statistics',            'Математика и статистика',           'Matematika va statistika',           'sigma',            70, NOW(), NOW()),
    (gen_random_uuid()::TEXT, 'social-sciences',          'Social Sciences',                     'Социальные науки',                  'Ijtimoiy fanlar',                    'users',            80, NOW(), NOW()),
    (gen_random_uuid()::TEXT, 'arts-humanities',          'Arts & Humanities',                   'Искусство и гуманитарные науки',    'Sanʼat va gumanitar fanlar',         'palette',          90, NOW(), NOW()),
    (gen_random_uuid()::TEXT, 'law-political-science',    'Law & Political Science',             'Право и политология',               'Huquq va siyosatshunoslik',          'scale',           100, NOW(), NOW()),
    (gen_random_uuid()::TEXT, 'education',                'Education & Teaching',                'Образование и педагогика',          'Taʼlim va pedagogika',               'graduation-cap',  110, NOW(), NOW()),
    (gen_random_uuid()::TEXT, 'architecture-design',      'Architecture & Design',               'Архитектура и дизайн',              'Arxitektura va dizayn',              'drafting-compass',120, NOW(), NOW()),
    (gen_random_uuid()::TEXT, 'agriculture-environment',  'Agriculture & Environmental Sciences','Сельское хозяйство и экология',     'Qishloq xoʻjaligi va ekologiya',     'leaf',            130, NOW(), NOW()),
    (gen_random_uuid()::TEXT, 'aviation-transport',       'Aviation, Transport & Logistics',     'Авиация, транспорт и логистика',    'Aviatsiya, transport va logistika',  'plane',           140, NOW(), NOW()),
    (gen_random_uuid()::TEXT, 'media-communication',      'Media & Communication',               'Медиа и коммуникации',              'Media va kommunikatsiya',            'radio',           150, NOW(), NOW()),
    (gen_random_uuid()::TEXT, 'hospitality-tourism',      'Hospitality & Tourism',               'Гостеприимство и туризм',           'Mehmondoʻstlik va turizm',           'concierge-bell',  160, NOW(), NOW()),
    (gen_random_uuid()::TEXT, 'other',                    'Other',                               'Другое',                            'Boshqa',                             'shapes',          999, NOW(), NOW())
ON CONFLICT ("slug") DO NOTHING;

-- Keyword assignment. Rules run most-specific first and only ever fill a NULL,
-- so an earlier rule always wins. Anything left over lands in "Other" for an
-- admin to reclassify.

UPDATE "university_programs" up SET "facultyId" = f."id" FROM "faculties" f
WHERE f."slug" = 'hospitality-tourism' AND up."facultyId" IS NULL AND up."title" ILIKE ANY (ARRAY[
    '%tourism%','%hospitality%','%hotel%','%culinar%','%gastronom%','%travel%','%event management%']);

UPDATE "university_programs" up SET "facultyId" = f."id" FROM "faculties" f
WHERE f."slug" = 'aviation-transport' AND up."facultyId" IS NULL AND up."title" ILIKE ANY (ARRAY[
    '%aviation%','%aeronaut%','%aerospace%','%pilot%','%logistic%','%transport%','%maritime%','%railway%','%supply chain%']);

UPDATE "university_programs" up SET "facultyId" = f."id" FROM "faculties" f
WHERE f."slug" = 'medicine-health' AND up."facultyId" IS NULL AND up."title" ILIKE ANY (ARRAY[
    '%medicin%','%medical%','%nursing%','%dentist%','%dental%','%pharmac%','%health%','%physiotherap%',
    '%veterinar%','%midwif%','%biomedical%','%nutrition%','%radiolog%','%surgery%','%anatom%','%optometry%','%psychiatr%']);

UPDATE "university_programs" up SET "facultyId" = f."id" FROM "faculties" f
WHERE f."slug" = 'architecture-design' AND up."facultyId" IS NULL AND up."title" ILIKE ANY (ARRAY[
    '%architect%','%urban plan%','%interior design%','%landscape%']);

UPDATE "university_programs" up SET "facultyId" = f."id" FROM "faculties" f
WHERE f."slug" = 'computer-science-it' AND up."facultyId" IS NULL AND up."title" ILIKE ANY (ARRAY[
    '%comput%','%software%','%informat%','%artificial intelligence%','%data scien%','%data analy%','%cyber%',
    '%information system%','%information technolog%','%machine learning%','%game develop%','%web develop%','%network%']);

UPDATE "university_programs" up SET "facultyId" = f."id" FROM "faculties" f
WHERE f."slug" = 'engineering-technology' AND up."facultyId" IS NULL AND up."title" ILIKE ANY (ARRAY[
    '%engineer%','%mechatronic%','%robotic%','%adaptronic%','%technolog%','%construction%','%energy%',
    '%petroleum%','%mining%','%materials%','%automotive%','%electric%','%electronic%','%telecommunication%','%manufactur%','%mechanic%']);

UPDATE "university_programs" up SET "facultyId" = f."id" FROM "faculties" f
WHERE f."slug" = 'law-political-science' AND up."facultyId" IS NULL AND up."title" ILIKE ANY (ARRAY[
    '%law%','%legal%','%jurisprud%','%political%','%politics%','%international relations%','%diplomac%',
    '%governance%','%public administration%','%statecraft%','%geopolitic%']);

UPDATE "university_programs" up SET "facultyId" = f."id" FROM "faculties" f
WHERE f."slug" = 'education' AND up."facultyId" IS NULL AND up."title" ILIKE ANY (ARRAY[
    '%education%','%teaching%','%pedagog%','%teacher%','%curriculum%','%early childhood%']);

UPDATE "university_programs" up SET "facultyId" = f."id" FROM "faculties" f
WHERE f."slug" = 'agriculture-environment' AND up."facultyId" IS NULL AND up."title" ILIKE ANY (ARRAY[
    '%agricultur%','%agro%','%food scien%','%forestry%','%horticultur%','%environment%','%sustainab%','%climate%','%fisher%']);

UPDATE "university_programs" up SET "facultyId" = f."id" FROM "faculties" f
WHERE f."slug" = 'media-communication' AND up."facultyId" IS NULL AND up."title" ILIKE ANY (ARRAY[
    '%journalis%','%media%','%communication%','%public relations%','%advertis%','%broadcast%']);

UPDATE "university_programs" up SET "facultyId" = f."id" FROM "faculties" f
WHERE f."slug" = 'social-sciences' AND up."facultyId" IS NULL AND up."title" ILIKE ANY (ARRAY[
    '%psycholog%','%sociolog%','%anthropolog%','%social work%','%social scien%','%criminolog%',
    '%demograph%','%development studies%','%gender%']);

UPDATE "university_programs" up SET "facultyId" = f."id" FROM "faculties" f
WHERE f."slug" = 'business-management' AND up."facultyId" IS NULL AND up."title" ILIKE ANY (ARRAY[
    '%business%','%management%','%marketing%','%entrepreneur%','%administration%','%mba%','%human resource%','%commerce%','%retail%']);

UPDATE "university_programs" up SET "facultyId" = f."id" FROM "faculties" f
WHERE f."slug" = 'economics-finance' AND up."facultyId" IS NULL AND up."title" ILIKE ANY (ARRAY[
    '%econom%','%financ%','%accounting%','%banking%','%actuarial%','%audit%','%insurance%','%taxation%']);

UPDATE "university_programs" up SET "facultyId" = f."id" FROM "faculties" f
WHERE f."slug" = 'mathematics-statistics' AND up."facultyId" IS NULL AND up."title" ILIKE ANY (ARRAY[
    '%mathematic%','%statistic%','%applied math%']);

UPDATE "university_programs" up SET "facultyId" = f."id" FROM "faculties" f
WHERE f."slug" = 'natural-sciences' AND up."facultyId" IS NULL AND up."title" ILIKE ANY (ARRAY[
    '%physic%','%chemi%','%biolog%','%biotech%','%geolog%','%astronom%','%neuroscience%','%genetic%','%microbio%','%ecolog%','%science%']);

UPDATE "university_programs" up SET "facultyId" = f."id" FROM "faculties" f
WHERE f."slug" = 'arts-humanities' AND up."facultyId" IS NULL AND up."title" ILIKE ANY (ARRAY[
    '%art%','%histor%','%philosoph%','%literatur%','%linguistic%','%language%','%music%','%theat%','%film%',
    '%cultur%','%religio%','%archae%','%translation%','%humanit%','%studies%','%design%','%fashion%','%animation%']);

UPDATE "university_programs" up SET "facultyId" = f."id" FROM "faculties" f
WHERE f."slug" = 'other' AND up."facultyId" IS NULL;

-- 4. Retire the catalog link and generate public slugs ----------------------

DROP INDEX IF EXISTS "university_programs_universityId_programId_studyLevel_key";
DROP INDEX IF EXISTS "university_programs_programId_idx";
ALTER TABLE "university_programs" DROP CONSTRAINT IF EXISTS "university_programs_programId_fkey";
ALTER TABLE "university_programs" DROP COLUMN IF EXISTS "programId";

-- Slug = kebab-cased title + a short id suffix, which keeps it readable and
-- collision-free even for the ~19 duplicate titles within a single university.
UPDATE "university_programs"
SET "slug" = COALESCE(
        NULLIF(TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER("title"), '[^a-z0-9]+', '-', 'g')), ''),
        'program'
    ) || '-' || SUBSTR("id", 1, 8);

CREATE UNIQUE INDEX "university_programs_slug_key" ON "university_programs"("slug");
CREATE INDEX "university_programs_title_idx" ON "university_programs"("title");
