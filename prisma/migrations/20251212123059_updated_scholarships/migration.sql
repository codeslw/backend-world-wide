-- AlterTable
ALTER TABLE "scholarships" ADD COLUMN     "amount" BIGINT,
ADD COLUMN     "amountCurrency" TEXT DEFAULT 'USD';
