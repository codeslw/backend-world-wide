/*
  Warnings:

  - You are about to drop the column `name` on the `agency_services` table. All the data in the column will be lost.
  - Added the required column `nameEn` to the `agency_services` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nameRu` to the `agency_services` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nameUz` to the `agency_services` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "agency_services" DROP COLUMN "name",
ADD COLUMN     "nameEn" TEXT NOT NULL,
ADD COLUMN     "nameRu" TEXT NOT NULL,
ADD COLUMN     "nameUz" TEXT NOT NULL;
