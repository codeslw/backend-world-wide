/*
  Warnings:

  - You are about to drop the column `basic` on the `agency_services` table. All the data in the column will be lost.
  - You are about to drop the column `premium` on the `agency_services` table. All the data in the column will be lost.
  - You are about to drop the column `standard` on the `agency_services` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'OTHER');

-- AlterTable
ALTER TABLE "agency_services" DROP COLUMN "basic",
DROP COLUMN "premium",
DROP COLUMN "standard",
ADD COLUMN     "tariffs" JSONB DEFAULT '[]';

-- CreateTable
CREATE TABLE "partner_students" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "firstLanguage" TEXT,
    "countryOfCitizenship" TEXT NOT NULL,
    "passportNumber" TEXT,
    "passportPlaceOfBirth" TEXT,
    "passportExpiryDate" TIMESTAMP(3) NOT NULL,
    "maritalStatus" "MaritalStatus" NOT NULL,
    "gender" "Gender" NOT NULL,
    "streetAddress" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "provinceState" TEXT NOT NULL,
    "postalZipCode" TEXT,
    "countryOfEducation" TEXT NOT NULL,
    "highestLevelOfEducation" TEXT NOT NULL,
    "gradingScheme" TEXT,
    "gradeScaleOutOf" TEXT,
    "gradeAverage" TEXT,
    "certificates" JSONB,
    "testScores" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_students_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "partner_students_partnerId_idx" ON "partner_students"("partnerId");

-- AddForeignKey
ALTER TABLE "partner_students" ADD CONSTRAINT "partner_students_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
