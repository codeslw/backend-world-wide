-- AlterTable: Add registrationCertificateUrl to partner_organizations
ALTER TABLE "partner_organizations" ADD COLUMN IF NOT EXISTS "registrationCertificateUrl" TEXT;
