-- Add season + startMonth to intakes.
-- Columns are added nullable first, backfilled from the legacy free-text `month`
-- value where possible, then made NOT NULL. Existing rows (if any) keep working;
-- new rows are always populated by IntakesService.

-- 1) Add nullable columns.
ALTER TABLE "intakes" ADD COLUMN "season" "IntakeSeason";
ALTER TABLE "intakes" ADD COLUMN "startMonth" INTEGER;

-- 2) Backfill startMonth from the legacy `month` text (accepts full month names
--    OR season names that were stored there historically). Fallback: 9 (Sept).
UPDATE "intakes" SET "startMonth" = CASE UPPER(TRIM("month"))
    WHEN 'JANUARY' THEN 1
    WHEN 'FEBRUARY' THEN 2
    WHEN 'MARCH' THEN 3
    WHEN 'APRIL' THEN 4
    WHEN 'MAY' THEN 5
    WHEN 'JUNE' THEN 6
    WHEN 'JULY' THEN 7
    WHEN 'AUGUST' THEN 8
    WHEN 'SEPTEMBER' THEN 9
    WHEN 'OCTOBER' THEN 10
    WHEN 'NOVEMBER' THEN 11
    WHEN 'DECEMBER' THEN 12
    -- season names that may have lived in `month`
    WHEN 'SPRING' THEN 3
    WHEN 'SUMMER' THEN 6
    WHEN 'FALL' THEN 9
    WHEN 'AUTUMN' THEN 9
    WHEN 'WINTER' THEN 12
    ELSE 9
  END
  WHERE "startMonth" IS NULL;

-- 3) Backfill season: from a season name if `month` held one, else derive from
--    the backfilled startMonth (Dec/Jan/Feb->WINTER, Mar-May->SPRING,
--    Jun-Aug->SUMMER, Sep-Nov->FALL). Fallback: FALL.
UPDATE "intakes" SET "season" = CASE
    WHEN UPPER(TRIM("month")) IN ('SPRING') THEN 'SPRING'::"IntakeSeason"
    WHEN UPPER(TRIM("month")) IN ('SUMMER') THEN 'SUMMER'::"IntakeSeason"
    WHEN UPPER(TRIM("month")) IN ('FALL','AUTUMN') THEN 'FALL'::"IntakeSeason"
    WHEN UPPER(TRIM("month")) IN ('WINTER') THEN 'WINTER'::"IntakeSeason"
    WHEN "startMonth" IN (12, 1, 2) THEN 'WINTER'::"IntakeSeason"
    WHEN "startMonth" IN (3, 4, 5) THEN 'SPRING'::"IntakeSeason"
    WHEN "startMonth" IN (6, 7, 8) THEN 'SUMMER'::"IntakeSeason"
    WHEN "startMonth" IN (9, 10, 11) THEN 'FALL'::"IntakeSeason"
    ELSE 'FALL'::"IntakeSeason"
  END
  WHERE "season" IS NULL;

-- 4) Normalize the legacy `month` text to the canonical month name matching
--    startMonth, so display is consistent going forward.
UPDATE "intakes" SET "month" = CASE "startMonth"
    WHEN 1 THEN 'JANUARY'
    WHEN 2 THEN 'FEBRUARY'
    WHEN 3 THEN 'MARCH'
    WHEN 4 THEN 'APRIL'
    WHEN 5 THEN 'MAY'
    WHEN 6 THEN 'JUNE'
    WHEN 7 THEN 'JULY'
    WHEN 8 THEN 'AUGUST'
    WHEN 9 THEN 'SEPTEMBER'
    WHEN 10 THEN 'OCTOBER'
    WHEN 11 THEN 'NOVEMBER'
    WHEN 12 THEN 'DECEMBER'
    ELSE "month"
  END;

-- 5) Enforce NOT NULL now that all rows are populated.
ALTER TABLE "intakes" ALTER COLUMN "season" SET NOT NULL;
ALTER TABLE "intakes" ALTER COLUMN "startMonth" SET NOT NULL;

-- 6) Deduplicate any rows that would collide on the new unique key before
--    creating it: keep the earliest-created row per (season, startMonth, year),
--    repoint its program links, and drop the duplicates.
WITH ranked AS (
  SELECT "id",
         ROW_NUMBER() OVER (
           PARTITION BY "season", "startMonth", "year"
           ORDER BY "createdAt" ASC, "id" ASC
         ) AS rn,
         FIRST_VALUE("id") OVER (
           PARTITION BY "season", "startMonth", "year"
           ORDER BY "createdAt" ASC, "id" ASC
         ) AS keeper_id
  FROM "intakes"
)
UPDATE "university_program_intakes" upi
SET "intakeId" = r.keeper_id
FROM ranked r
WHERE upi."intakeId" = r."id" AND r.rn > 1;

-- Remove any now-duplicate program links (same program+keeper) created above.
DELETE FROM "university_program_intakes" a
USING "university_program_intakes" b
WHERE a."ctid" < b."ctid"
  AND a."universityProgramId" = b."universityProgramId"
  AND a."intakeId" = b."intakeId";

WITH ranked AS (
  SELECT "id",
         ROW_NUMBER() OVER (
           PARTITION BY "season", "startMonth", "year"
           ORDER BY "createdAt" ASC, "id" ASC
         ) AS rn
  FROM "intakes"
)
DELETE FROM "intakes" i USING ranked r WHERE i."id" = r."id" AND r.rn > 1;

-- 7) Create the unique index.
CREATE UNIQUE INDEX "intakes_season_startMonth_year_key" ON "intakes"("season", "startMonth", "year");
