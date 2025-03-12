/*
  Warnings:

  - You are about to drop the column `description` on the `programs` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `programs` table. All the data in the column will be lost.
  - Added the required column `titleRu` to the `programs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `titleUz` to the `programs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "programs" DROP COLUMN "description",
DROP COLUMN "title",
ADD COLUMN     "descriptionEn" TEXT,
ADD COLUMN     "descriptionRu" TEXT,
ADD COLUMN     "descriptionUz" TEXT,
ADD COLUMN     "titleEn" TEXT,
ADD COLUMN     "titleRu" TEXT NOT NULL,
ADD COLUMN     "titleUz" TEXT NOT NULL;
