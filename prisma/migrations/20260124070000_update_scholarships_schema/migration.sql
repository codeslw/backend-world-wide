-- DropForeignKey (if exists from old schema)
ALTER TABLE "scholarships" DROP CONSTRAINT IF EXISTS "scholarships_programId_fkey";

-- DropIndex (if exists from old schema)
DROP INDEX IF EXISTS "scholarships_programId_idx";
DROP INDEX IF EXISTS "scholarships_universityId_programId_key";

-- AlterTable: Transform scholarships to new schema
-- First, add new columns
ALTER TABLE "scholarships" 
ADD COLUMN IF NOT EXISTS "title" TEXT,
ADD COLUMN IF NOT EXISTS "institutionName" TEXT,
ADD COLUMN IF NOT EXISTS "sourceUrl" TEXT,
ADD COLUMN IF NOT EXISTS "amount" TEXT,
ADD COLUMN IF NOT EXISTS "currency" TEXT,
ADD COLUMN IF NOT EXISTS "isAutoApplied" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "levels" JSONB,
ADD COLUMN IF NOT EXISTS "renewalConditions" JSONB,
ADD COLUMN IF NOT EXISTS "eligibility" JSONB,
ADD COLUMN IF NOT EXISTS "lastUpdated" TIMESTAMP(3);

-- Migrate data from old columns to new columns (if old columns exist)
UPDATE "scholarships" 
SET "title" = COALESCE("title", name),
    "institutionName" = COALESCE("institutionName", ''),
    "lastUpdated" = COALESCE("lastUpdated", "updatedAt", NOW())
WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scholarships' AND column_name = 'name');

-- Set default values for new required columns if they are null
UPDATE "scholarships" 
SET "title" = COALESCE("title", 'Untitled Scholarship'),
    "institutionName" = COALESCE("institutionName", 'Unknown Institution'),
    "lastUpdated" = COALESCE("lastUpdated", NOW());

-- Make title NOT NULL after data migration
ALTER TABLE "scholarships" ALTER COLUMN "title" SET NOT NULL;
ALTER TABLE "scholarships" ALTER COLUMN "institutionName" SET NOT NULL;
ALTER TABLE "scholarships" ALTER COLUMN "lastUpdated" SET NOT NULL;

-- Drop old columns (if they exist)
ALTER TABLE "scholarships" 
DROP COLUMN IF EXISTS "name",
DROP COLUMN IF EXISTS "requirements",
DROP COLUMN IF EXISTS "programId",
DROP COLUMN IF EXISTS "updatedAt",
DROP COLUMN IF EXISTS "amountCurrency",
DROP COLUMN IF EXISTS "amountFrom",
DROP COLUMN IF EXISTS "amountTo",
DROP COLUMN IF EXISTS "amountInfo",
DROP COLUMN IF EXISTS "percentage",
DROP COLUMN IF EXISTS "percentageInfo",
DROP COLUMN IF EXISTS "deadline",
DROP COLUMN IF EXISTS "eligibleNationalities",
DROP COLUMN IF EXISTS "minGpa",
DROP COLUMN IF EXISTS "studyLevels",
DROP COLUMN IF EXISTS "type";

-- CreateTable: Junction table for many-to-many relationship between Scholarship and UniversityProgram
CREATE TABLE IF NOT EXISTS "_ScholarshipToUniversityProgram" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ScholarshipToUniversityProgram_A_fkey" FOREIGN KEY ("A") REFERENCES "scholarships"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ScholarshipToUniversityProgram_B_fkey" FOREIGN KEY ("B") REFERENCES "university_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex for junction table
CREATE UNIQUE INDEX IF NOT EXISTS "_ScholarshipToUniversityProgram_AB_unique" ON "_ScholarshipToUniversityProgram"("A", "B");
CREATE INDEX IF NOT EXISTS "_ScholarshipToUniversityProgram_B_index" ON "_ScholarshipToUniversityProgram"("B");
