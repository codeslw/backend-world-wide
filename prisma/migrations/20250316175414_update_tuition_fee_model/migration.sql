/*
  Warnings:

  - You are about to drop the column `amount` on the `TuitionFee` table. All the data in the column will be lost.
  - You are about to drop the column `period` on the `TuitionFee` table. All the data in the column will be lost.
  - Added the required column `maxAmount` to the `TuitionFee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `minAmount` to the `TuitionFee` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TuitionFee" DROP COLUMN "amount",
DROP COLUMN "period",
ADD COLUMN     "maxAmount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "minAmount" DOUBLE PRECISION NOT NULL;
