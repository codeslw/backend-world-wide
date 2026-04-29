/*
  Warnings:

  - You are about to drop the column `email` on the `mini_applications` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "mini_applications_email_idx";

-- AlterTable
ALTER TABLE "campuses" ADD COLUMN     "videoUrl" TEXT;

-- AlterTable
ALTER TABLE "mini_applications" DROP COLUMN "email";

-- AlterTable
ALTER TABLE "scholarships" ADD COLUMN     "videoUrl" TEXT;
