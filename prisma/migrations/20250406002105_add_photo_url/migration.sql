/*
  Warnings:

  - Added the required column `code` to the `countries` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "countries" ADD COLUMN     "code" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "universities" ADD COLUMN     "photoUrl" TEXT;
