/*
  Warnings:

  - You are about to drop the column `countryId` on the `cities` table. All the data in the column will be lost.
  - The primary key for the `countries` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `countries` table. All the data in the column will be lost.
  - You are about to drop the column `countryId` on the `universities` table. All the data in the column will be lost.
  - Added the required column `countryCode` to the `cities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `countryCode` to the `universities` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "cities" DROP CONSTRAINT "cities_countryId_fkey";

-- DropForeignKey
ALTER TABLE "universities" DROP CONSTRAINT "universities_countryId_fkey";

-- AlterTable
ALTER TABLE "cities" DROP COLUMN "countryId",
ADD COLUMN     "countryCode" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "countries" DROP CONSTRAINT "countries_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "countries_pkey" PRIMARY KEY ("code");

-- AlterTable
ALTER TABLE "universities" DROP COLUMN "countryId",
ADD COLUMN     "countryCode" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "cities" ADD CONSTRAINT "cities_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "countries"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "universities" ADD CONSTRAINT "universities_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "countries"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
