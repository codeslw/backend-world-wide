-- Collapse the localized program title (titleEn/titleRu/titleUz) into a single
-- non-localized `title` column.

-- 1. Add the new column as nullable so we can backfill existing rows.
ALTER TABLE "programs" ADD COLUMN "title" TEXT;

-- 2. Backfill, preferring Russian, then English, then Uzbek (matching the
--    read-time fallback order used previously by the app).
UPDATE "programs"
SET "title" = COALESCE(
  NULLIF("titleRu", ''),
  NULLIF("titleEn", ''),
  NULLIF("titleUz", ''),
  ''
);

-- 3. Enforce NOT NULL now that every row has a value.
ALTER TABLE "programs" ALTER COLUMN "title" SET NOT NULL;

-- 4. Drop the old localized columns.
ALTER TABLE "programs" DROP COLUMN "titleEn";
ALTER TABLE "programs" DROP COLUMN "titleRu";
ALTER TABLE "programs" DROP COLUMN "titleUz";
