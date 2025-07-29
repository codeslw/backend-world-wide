/*
  Warnings:

  - You are about to drop the column `currentEducationLevel` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `currentInstitutionName` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `graduationYear` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `languageCertificateUrl` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `languageScore` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `languageTest` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `transcriptUrl` on the `profiles` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "DegreeType" AS ENUM ('HIGH_SCHOOL', 'BACHELOR', 'MASTER', 'PHD');

-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "currentEducationLevel",
DROP COLUMN "currentInstitutionName",
DROP COLUMN "graduationYear",
DROP COLUMN "languageCertificateUrl",
DROP COLUMN "languageScore",
DROP COLUMN "languageTest",
DROP COLUMN "transcriptUrl";

-- CreateTable
CREATE TABLE "university_requirements" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "minIeltsScore" DOUBLE PRECISION,
    "minToeflScore" INTEGER,
    "minDuolingoScore" INTEGER,
    "requiredDegree" "DegreeType",
    "minGpa" DOUBLE PRECISION,
    "otherRequirements" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "university_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_history" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "degree" "DegreeType" NOT NULL,
    "institution" TEXT NOT NULL,
    "graduationYear" INTEGER NOT NULL,
    "gpa" DOUBLE PRECISION,
    "transcriptUrl" TEXT,
    "diplomaUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "language_certificates" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "testType" "LanguageTest" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "certificateUrl" TEXT NOT NULL,
    "dateOfIssue" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "language_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "university_requirements_universityId_key" ON "university_requirements"("universityId");

-- CreateIndex
CREATE INDEX "education_history_profileId_idx" ON "education_history"("profileId");

-- CreateIndex
CREATE INDEX "language_certificates_profileId_idx" ON "language_certificates"("profileId");

-- AddForeignKey
ALTER TABLE "university_requirements" ADD CONSTRAINT "university_requirements_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "education_history" ADD CONSTRAINT "education_history_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "language_certificates" ADD CONSTRAINT "language_certificates_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
