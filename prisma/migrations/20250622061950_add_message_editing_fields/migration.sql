/*
  Warnings:

  - You are about to drop the `_MessageReads` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_MessageReads" DROP CONSTRAINT "_MessageReads_A_fkey";

-- DropForeignKey
ALTER TABLE "_MessageReads" DROP CONSTRAINT "_MessageReads_B_fkey";

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "editedAt" TIMESTAMP(3),
ADD COLUMN     "isEdited" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "readByAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "readByClient" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "_MessageReads";
