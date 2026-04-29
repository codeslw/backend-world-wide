/*
  Warnings:

  - You are about to drop the column `studyLanguage` on the `university_programs` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "university_programs_studyLanguage_idx";

-- AlterTable
ALTER TABLE "university_programs" DROP COLUMN "studyLanguage",
ADD COLUMN     "studyLanguageId" TEXT;

-- CreateTable
CREATE TABLE "study_languages" (
    "id" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL,
    "nameUz" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_languages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "university_programs_studyLanguageId_idx" ON "university_programs"("studyLanguageId");

-- AddForeignKey
ALTER TABLE "university_programs" ADD CONSTRAINT "university_programs_studyLanguageId_fkey" FOREIGN KEY ("studyLanguageId") REFERENCES "study_languages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
