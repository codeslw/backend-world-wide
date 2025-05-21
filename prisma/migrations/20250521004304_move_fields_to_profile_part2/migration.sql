/*
  Warnings:

  - You are about to drop the column `currentEducationLevel` on the `applications` table. All the data in the column will be lost.
  - You are about to drop the column `currentInstitutionName` on the `applications` table. All the data in the column will be lost.
  - You are about to drop the column `cvUrl` on the `applications` table. All the data in the column will be lost.
  - You are about to drop the column `graduationYear` on the `applications` table. All the data in the column will be lost.
  - You are about to drop the column `languageCertificateUrl` on the `applications` table. All the data in the column will be lost.
  - You are about to drop the column `languageScore` on the `applications` table. All the data in the column will be lost.
  - You are about to drop the column `languageTest` on the `applications` table. All the data in the column will be lost.
  - You are about to drop the column `motivationLetterUrl` on the `applications` table. All the data in the column will be lost.
  - You are about to drop the column `recommendationLetterUrls` on the `applications` table. All the data in the column will be lost.
  - You are about to drop the column `transcriptUrl` on the `applications` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "applications" DROP COLUMN "currentEducationLevel",
DROP COLUMN "currentInstitutionName",
DROP COLUMN "cvUrl",
DROP COLUMN "graduationYear",
DROP COLUMN "languageCertificateUrl",
DROP COLUMN "languageScore",
DROP COLUMN "languageTest",
DROP COLUMN "motivationLetterUrl",
DROP COLUMN "recommendationLetterUrls",
DROP COLUMN "transcriptUrl";

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "currentEducationLevel" TEXT,
ADD COLUMN     "currentInstitutionName" TEXT,
ADD COLUMN     "cvUrl" TEXT,
ADD COLUMN     "graduationYear" INTEGER,
ADD COLUMN     "languageCertificateUrl" TEXT,
ADD COLUMN     "languageScore" TEXT,
ADD COLUMN     "languageTest" "LanguageTest",
ADD COLUMN     "motivationLetterUrl" TEXT,
ADD COLUMN     "recommendationLetterUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "transcriptUrl" TEXT;
