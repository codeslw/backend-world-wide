-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "IntakeSeason" AS ENUM ('FALL', 'SPRING', 'SUMMER');

-- CreateEnum
CREATE TYPE "LanguageTest" AS ENUM ('IELTS', 'TOEFL', 'DUOLINGO', 'NONE');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "middleName" TEXT,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" "Gender",
    "nationality" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "passportNumber" TEXT NOT NULL,
    "passportExpiryDate" TIMESTAMP(3) NOT NULL,
    "passportCopyUrl" TEXT NOT NULL,
    "currentEducationLevel" TEXT NOT NULL,
    "currentInstitutionName" TEXT,
    "graduationYear" INTEGER,
    "transcriptUrl" TEXT,
    "languageTest" "LanguageTest",
    "languageScore" TEXT,
    "languageCertificateUrl" TEXT,
    "preferredCountry" TEXT NOT NULL,
    "preferredUniversity" TEXT NOT NULL,
    "preferredProgram" TEXT NOT NULL,
    "intakeSeason" "IntakeSeason" NOT NULL,
    "intakeYear" INTEGER NOT NULL,
    "motivationLetterUrl" TEXT,
    "recommendationLetterUrls" TEXT[],
    "cvUrl" TEXT,
    "applicationStatus" "ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "applications_profileId_idx" ON "applications"("profileId");

-- CreateIndex
CREATE INDEX "applications_applicationStatus_idx" ON "applications"("applicationStatus");

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
