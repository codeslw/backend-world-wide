-- AlterTable
ALTER TABLE "partner_students" ADD COLUMN     "additionalNotes" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "emergencyName" TEXT,
ADD COLUMN     "emergencyPhone" TEXT,
ADD COLUMN     "emergencyRelation" TEXT,
ADD COLUMN     "financialSupport" TEXT,
ADD COLUMN     "graduated" BOOLEAN,
ADD COLUMN     "howHeard" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "schools" JSONB;
