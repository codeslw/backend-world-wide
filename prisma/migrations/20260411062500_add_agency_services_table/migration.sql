-- CreateTable
CREATE TABLE "agency_services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "basic" JSONB,
    "standard" JSONB,
    "premium" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agency_services_pkey" PRIMARY KEY ("id")
);

-- AlterTable: add agencyServiceId column to universities if it doesn't exist
ALTER TABLE "universities" ADD COLUMN IF NOT EXISTS "agencyServiceId" TEXT;

-- AddForeignKey
ALTER TABLE "universities" ADD CONSTRAINT "universities_agencyServiceId_fkey" FOREIGN KEY ("agencyServiceId") REFERENCES "agency_services"("id") ON DELETE SET NULL ON UPDATE CASCADE;
