/*
  Warnings:

  - You are about to drop the column `currency` on the `scholarships` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `scholarships` table. All the data in the column will be lost.
  - You are about to drop the column `eligibility` on the `scholarships` table. All the data in the column will be lost.
  - You are about to drop the column `institutionName` on the `scholarships` table. All the data in the column will be lost.
  - You are about to drop the column `levels` on the `scholarships` table. All the data in the column will be lost.
  - You are about to drop the column `renewalConditions` on the `scholarships` table. All the data in the column will be lost.
  - Added the required column `eligibilityCriteria` to the `scholarships` table without a default value. This is not possible if the table is not empty.
  - Added the required column `overview` to the `scholarships` table without a default value. This is not possible if the table is not empty.
  - Made the column `amount` on table `scholarships` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "_ScholarshipToUniversityProgram" ADD CONSTRAINT "_ScholarshipToUniversityProgram_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "public"."_ScholarshipToUniversityProgram_AB_unique";

-- AlterTable: Add new columns with defaults first
ALTER TABLE "scholarships" 
ADD COLUMN "overview" TEXT,
ADD COLUMN "eligibilityCriteria" TEXT,
ADD COLUMN "howItWorks" TEXT,
ADD COLUMN "importantNotes" TEXT,
ADD COLUMN "nationalities" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "programLevels" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "scholarshipValue" TEXT;

-- Migrate existing data
UPDATE "scholarships" 
SET 
  "overview" = COALESCE("description", 'No overview provided'),
  "eligibilityCriteria" = COALESCE(
    CASE 
      WHEN "eligibility" IS NOT NULL THEN "eligibility"::text 
      ELSE 'No eligibility criteria specified' 
    END,
    'No eligibility criteria specified'
  ),
  "amount" = COALESCE("amount", 'Amount not specified');

-- Now make required columns NOT NULL
ALTER TABLE "scholarships" 
ALTER COLUMN "overview" SET NOT NULL,
ALTER COLUMN "eligibilityCriteria" SET NOT NULL,
ALTER COLUMN "amount" SET NOT NULL;

-- Drop old columns
ALTER TABLE "scholarships" 
DROP COLUMN "currency",
DROP COLUMN "description",
DROP COLUMN "eligibility",
DROP COLUMN "institutionName",
DROP COLUMN "levels",
DROP COLUMN "renewalConditions";
