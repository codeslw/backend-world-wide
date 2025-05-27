/*
  Warnings:

  - You are about to drop the column `universityId` on the `mini_applications` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "mini_applications" DROP CONSTRAINT "mini_applications_universityId_fkey";

-- DropIndex
DROP INDEX "mini_applications_universityId_idx";

-- AlterTable
ALTER TABLE "mini_applications" DROP COLUMN "universityId";
