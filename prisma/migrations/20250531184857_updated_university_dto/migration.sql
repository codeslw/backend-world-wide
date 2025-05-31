/*
  Warnings:

  - You are about to drop the column `nameEn` on the `universities` table. All the data in the column will be lost.
  - You are about to drop the column `nameRu` on the `universities` table. All the data in the column will be lost.
  - You are about to drop the column `nameUz` on the `universities` table. All the data in the column will be lost.
  - Added the required column `name` to the `universities` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "universities" DROP COLUMN "nameEn",
DROP COLUMN "nameRu",
DROP COLUMN "nameUz",
ADD COLUMN     "name" TEXT NOT NULL,
ALTER COLUMN "established" DROP NOT NULL,
ALTER COLUMN "descriptionUz" DROP NOT NULL,
ALTER COLUMN "descriptionRu" DROP NOT NULL,
ALTER COLUMN "descriptionEn" DROP NOT NULL,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "phone" DROP NOT NULL;
