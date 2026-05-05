-- AlterTable
ALTER TABLE "Country" ADD COLUMN     "isVisaRequired" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "universities" ADD COLUMN     "isAdmissionFeeRefundable" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "university_programs" ADD COLUMN     "scholarshipAppliedTutionFee" DOUBLE PRECISION;
