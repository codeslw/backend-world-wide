-- CreateEnum
CREATE TYPE "ScholarshipType" AS ENUM ('MERIT', 'ENTRANCE', 'ATHLETIC', 'COMMUNITY', 'OTHER');

-- DropIndex
DROP INDEX "public"."scholarships_universityId_programId_key";

-- AlterTable
ALTER TABLE "scholarships" ADD COLUMN     "deadline" TIMESTAMP(3),
ADD COLUMN     "eligibleNationalities" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "minGpa" DOUBLE PRECISION,
ADD COLUMN     "studyLevels" "StudyLevel"[] DEFAULT ARRAY[]::"StudyLevel"[],
ADD COLUMN     "type" "ScholarshipType" NOT NULL DEFAULT 'OTHER';
