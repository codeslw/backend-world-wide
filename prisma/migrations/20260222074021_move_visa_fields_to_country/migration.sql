/*
  Warnings:

  - You are about to drop the column `bankStatement` on the `admission_requirements` table. All the data in the column will be lost.
  - You are about to drop the column `insuranceFee` on the `admission_requirements` table. All the data in the column will be lost.
  - You are about to drop the column `otherExpenses` on the `admission_requirements` table. All the data in the column will be lost.
  - You are about to drop the column `visaFee` on the `admission_requirements` table. All the data in the column will be lost.
  - You are about to drop the column `visaFeeCurrency` on the `admission_requirements` table. All the data in the column will be lost.
  - You are about to drop the column `visaRequiredDocuments` on the `admission_requirements` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Country" ADD COLUMN     "bankStatement" DOUBLE PRECISION,
ADD COLUMN     "insuranceFee" DOUBLE PRECISION,
ADD COLUMN     "otherExpenses" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "visaFee" DOUBLE PRECISION,
ADD COLUMN     "visaFeeCurrency" TEXT,
ADD COLUMN     "visaRequiredDocuments" TEXT;

-- AlterTable
ALTER TABLE "admission_requirements" DROP COLUMN "bankStatement",
DROP COLUMN "insuranceFee",
DROP COLUMN "otherExpenses",
DROP COLUMN "visaFee",
DROP COLUMN "visaFeeCurrency",
DROP COLUMN "visaRequiredDocuments";
