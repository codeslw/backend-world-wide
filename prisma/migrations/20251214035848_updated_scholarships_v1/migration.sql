/*
  Warnings:

  - You are about to drop the column `amount` on the `scholarships` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "scholarships" DROP COLUMN "amount",
ADD COLUMN     "amountFrom" DECIMAL(12,2),
ADD COLUMN     "amountInfo" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "amountTo" DECIMAL(12,2);
