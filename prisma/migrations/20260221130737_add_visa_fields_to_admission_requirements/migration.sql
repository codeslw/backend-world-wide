-- AlterTable
ALTER TABLE "admission_requirements" ADD COLUMN     "bankStatement" DOUBLE PRECISION,
ADD COLUMN     "insuranceFee" DOUBLE PRECISION,
ADD COLUMN     "otherExpenses" TEXT[],
ADD COLUMN     "visaFee" DOUBLE PRECISION,
ADD COLUMN     "visaFeeCurrency" TEXT,
ADD COLUMN     "visaRequiredDocuments" TEXT;
