-- AlterEnum
ALTER TYPE "DegreeType" ADD VALUE 'OTHER';

-- AlterTable
ALTER TABLE "program_admission_requirements" ADD COLUMN "minEducationLevelNote" TEXT;
