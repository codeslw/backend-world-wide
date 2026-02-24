/*
  Warnings:

  - You are about to drop the column `logo` on the `university_programs` table. All the data in the column will be lost.
  - You are about to drop the `university_requirements` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."university_requirements" DROP CONSTRAINT "university_requirements_universityId_fkey";

-- AlterTable
ALTER TABLE "university_programs" DROP COLUMN "logo";

-- DropTable
DROP TABLE "public"."university_requirements";
