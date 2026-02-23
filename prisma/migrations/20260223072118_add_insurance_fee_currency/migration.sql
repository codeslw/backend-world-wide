-- AlterTable
ALTER TABLE "Country" ADD COLUMN     "insuranceFeeCurrency" TEXT,
ADD COLUMN     "isInsuranceFeeRefundable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isVisaFeeRefundable" BOOLEAN NOT NULL DEFAULT false;
