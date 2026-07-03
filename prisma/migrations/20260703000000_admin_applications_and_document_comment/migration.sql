-- AlterTable: record which admin (if any) created a partner application on the partner's behalf
ALTER TABLE "partner_applications" ADD COLUMN "createdByAdminId" TEXT;

-- AlterTable: optional free-text comment attached to an application document
ALTER TABLE "application_documents" ADD COLUMN "comment" TEXT;

-- CreateIndex
CREATE INDEX "partner_applications_createdByAdminId_idx" ON "partner_applications"("createdByAdminId");

-- AddForeignKey
ALTER TABLE "partner_applications" ADD CONSTRAINT "partner_applications_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
