-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StudyLevel" ADD VALUE 'LANGUAGE_COURSE';
ALTER TYPE "StudyLevel" ADD VALUE 'FOUNDATION';

-- AlterTable
ALTER TABLE "universities" ADD COLUMN     "additionalPhotoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "intakes" (
    "id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intakes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "university_program_intakes" (
    "id" TEXT NOT NULL,
    "universityProgramId" TEXT NOT NULL,
    "intakeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "university_program_intakes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "university_program_intakes_universityProgramId_idx" ON "university_program_intakes"("universityProgramId");

-- CreateIndex
CREATE INDEX "university_program_intakes_intakeId_idx" ON "university_program_intakes"("intakeId");

-- CreateIndex
CREATE UNIQUE INDEX "university_program_intakes_universityProgramId_intakeId_key" ON "university_program_intakes"("universityProgramId", "intakeId");

-- AddForeignKey
ALTER TABLE "university_program_intakes" ADD CONSTRAINT "university_program_intakes_universityProgramId_fkey" FOREIGN KEY ("universityProgramId") REFERENCES "university_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "university_program_intakes" ADD CONSTRAINT "university_program_intakes_intakeId_fkey" FOREIGN KEY ("intakeId") REFERENCES "intakes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
