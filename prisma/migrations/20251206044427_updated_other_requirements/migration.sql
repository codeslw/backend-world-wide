/*
  Warnings:

  - The `otherRequirements` column on the `university_requirements` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "university_requirements" DROP COLUMN "otherRequirements",
ADD COLUMN     "otherRequirements" TEXT[] DEFAULT ARRAY[]::TEXT[];
