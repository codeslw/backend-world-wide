-- Additive migration: per-application documents + chat link to user-submitted applications.
-- NOTE: Hand-curated to be purely additive. The `prisma migrate diff` output also
-- proposed dropping the pg_trgm GIN indexes (idx_*_trgm) because those are raw-SQL
-- indexes Prisma cannot represent in schema.prisma; those DROPs are intentionally
-- omitted here to preserve full-text search. No existing columns are dropped.

-- CreateEnum
CREATE TYPE "ApplicationDocumentKind" AS ENUM ('STUDENT_DOC', 'REQUIREMENT', 'OFFER_LETTER', 'ADMIN_DOC', 'OTHER');

-- CreateEnum
CREATE TYPE "ApplicationDocumentStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED');

-- AlterTable: link chats to user-submitted applications
ALTER TABLE "Chat" ADD COLUMN "applicationId" TEXT;

-- CreateTable: normalized per-application documents
CREATE TABLE "application_documents" (
    "id" TEXT NOT NULL,
    "partnerApplicationId" TEXT,
    "applicationId" TEXT,
    "documentTypeId" TEXT,
    "name" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "kind" "ApplicationDocumentKind" NOT NULL DEFAULT 'OTHER',
    "status" "ApplicationDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "uploadedById" TEXT,
    "uploadedByRole" "Role",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "application_documents_partnerApplicationId_idx" ON "application_documents"("partnerApplicationId");

-- CreateIndex
CREATE INDEX "application_documents_applicationId_idx" ON "application_documents"("applicationId");

-- CreateIndex
CREATE INDEX "application_documents_documentTypeId_idx" ON "application_documents"("documentTypeId");

-- CreateIndex
CREATE INDEX "application_documents_kind_idx" ON "application_documents"("kind");

-- CreateIndex
CREATE INDEX "application_documents_status_idx" ON "application_documents"("status");

-- CreateIndex
CREATE INDEX "Chat_applicationId_idx" ON "Chat"("applicationId");

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_documents" ADD CONSTRAINT "application_documents_partnerApplicationId_fkey" FOREIGN KEY ("partnerApplicationId") REFERENCES "partner_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_documents" ADD CONSTRAINT "application_documents_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_documents" ADD CONSTRAINT "application_documents_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "application_document_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_documents" ADD CONSTRAINT "application_documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
