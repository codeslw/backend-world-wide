/*
  Warnings:

  - You are about to drop the column `passportNumber` on the `profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "passportNumber";

-- AlterTable
ALTER TABLE "universities" ALTER COLUMN "website" DROP NOT NULL,
ALTER COLUMN "ranking" DROP NOT NULL,
ALTER COLUMN "studentsCount" DROP NOT NULL,
ALTER COLUMN "acceptanceRate" DROP NOT NULL,
ALTER COLUMN "avgApplicationFee" DROP NOT NULL;
