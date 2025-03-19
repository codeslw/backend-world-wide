/*
  Warnings:

  - Added the required column `photoUrl` to the `University` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "University" ADD COLUMN     "photoUrl" TEXT NOT NULL;
