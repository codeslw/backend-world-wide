/*
  Warnings:

  - The values [OTHER] on the enum `Gender` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `University` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ProgramToUniversity` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Gender_new" AS ENUM ('MALE', 'FEMALE');
ALTER TABLE "applications" ALTER COLUMN "gender" TYPE "Gender_new" USING ("gender"::text::"Gender_new");
ALTER TYPE "Gender" RENAME TO "Gender_old";
ALTER TYPE "Gender_new" RENAME TO "Gender";
DROP TYPE "Gender_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "University" DROP CONSTRAINT "University_cityId_fkey";

-- DropForeignKey
ALTER TABLE "University" DROP CONSTRAINT "University_countryCode_fkey";

-- DropForeignKey
ALTER TABLE "_ProgramToUniversity" DROP CONSTRAINT "_ProgramToUniversity_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProgramToUniversity" DROP CONSTRAINT "_ProgramToUniversity_B_fkey";

-- DropTable
DROP TABLE "University";

-- DropTable
DROP TABLE "_ProgramToUniversity";

-- CreateTable
CREATE TABLE "universities" (
    "id" TEXT NOT NULL,
    "nameUz" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "established" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "descriptionUz" TEXT NOT NULL,
    "descriptionRu" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "winterIntakeDeadline" TIMESTAMP(3),
    "autumnIntakeDeadline" TIMESTAMP(3),
    "ranking" INTEGER NOT NULL,
    "studentsCount" INTEGER NOT NULL,
    "acceptanceRate" DOUBLE PRECISION NOT NULL,
    "avgApplicationFee" DOUBLE PRECISION NOT NULL,
    "photoUrl" TEXT,
    "cityId" TEXT NOT NULL,
    "countryCode" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "universities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "university_programs" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "tuitionFee" DOUBLE PRECISION NOT NULL,
    "tuitionFeeCurrency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "university_programs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "university_programs_universityId_idx" ON "university_programs"("universityId");

-- CreateIndex
CREATE INDEX "university_programs_programId_idx" ON "university_programs"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "university_programs_universityId_programId_key" ON "university_programs"("universityId", "programId");

-- AddForeignKey
ALTER TABLE "universities" ADD CONSTRAINT "universities_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "universities" ADD CONSTRAINT "universities_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "Country"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "university_programs" ADD CONSTRAINT "university_programs_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "university_programs" ADD CONSTRAINT "university_programs_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
