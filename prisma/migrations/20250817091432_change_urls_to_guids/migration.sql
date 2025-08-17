/*
  Warnings:

  - You are about to drop the column `diplomaUrl` on the `education_history` table. All the data in the column will be lost.
  - You are about to drop the column `transcriptUrl` on the `education_history` table. All the data in the column will be lost.
  - You are about to drop the column `certificateUrl` on the `language_certificates` table. All the data in the column will be lost.
  - You are about to drop the column `cvUrl` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `motivationLetterUrl` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `passportCopyUrl` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `recommendationLetterUrls` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `certificateUrl` on the `standardized_tests` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "education_history" DROP COLUMN "diplomaUrl",
DROP COLUMN "transcriptUrl",
ADD COLUMN     "diplomaGuid" TEXT,
ADD COLUMN     "transcriptGuid" TEXT;

-- AlterTable
ALTER TABLE "language_certificates" DROP COLUMN "certificateUrl",
ADD COLUMN     "certificateGuid" TEXT;

-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "cvUrl",
DROP COLUMN "motivationLetterUrl",
DROP COLUMN "passportCopyUrl",
DROP COLUMN "recommendationLetterUrls",
ADD COLUMN     "cvGuid" TEXT,
ADD COLUMN     "motivationLetterGuid" TEXT,
ADD COLUMN     "passportCopyGuid" TEXT,
ADD COLUMN     "recommendationLetterGuids" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "standardized_tests" DROP COLUMN "certificateUrl",
ADD COLUMN     "certificateGuid" TEXT;
