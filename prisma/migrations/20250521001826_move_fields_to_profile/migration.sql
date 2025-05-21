/*
  Warnings:

  - You are about to drop the column `address` on the `applications` table. All the data in the column will be lost.
  - You are about to drop the column `dateOfBirth` on the `applications` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `applications` table. All the data in the column will be lost.
  - You are about to drop the column `middleName` on the `applications` table. All the data in the column will be lost.
  - You are about to drop the column `nationality` on the `applications` table. All the data in the column will be lost.
  - You are about to drop the column `passportCopyUrl` on the `applications` table. All the data in the column will be lost.
  - You are about to drop the column `passportExpiryDate` on the `applications` table. All the data in the column will be lost.
  - You are about to drop the column `passportNumber` on the `applications` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "applications" DROP COLUMN "address",
DROP COLUMN "dateOfBirth",
DROP COLUMN "gender",
DROP COLUMN "middleName",
DROP COLUMN "nationality",
DROP COLUMN "passportCopyUrl",
DROP COLUMN "passportExpiryDate",
DROP COLUMN "passportNumber";

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "address" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "middleName" TEXT,
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "passportCopyUrl" TEXT,
ADD COLUMN     "passportExpiryDate" TIMESTAMP(3),
ADD COLUMN     "passportNumber" TEXT;
