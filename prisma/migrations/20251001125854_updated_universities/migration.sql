/*
  Warnings:

  - A unique constraint covering the columns `[universityId,programId,studyLevel]` on the table `university_programs` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "StudyLevel" AS ENUM ('BACHELOR', 'MASTER', 'PHD');

-- DropIndex
DROP INDEX "university_programs_universityId_programId_key";

-- AlterTable
ALTER TABLE "universities" ADD COLUMN     "applicationFeeCurrency" TEXT;

-- AlterTable
ALTER TABLE "university_programs" ADD COLUMN     "studyLevel" "StudyLevel" NOT NULL DEFAULT 'BACHELOR';

-- CreateIndex
CREATE UNIQUE INDEX "university_programs_universityId_programId_studyLevel_key" ON "university_programs"("universityId", "programId", "studyLevel");
