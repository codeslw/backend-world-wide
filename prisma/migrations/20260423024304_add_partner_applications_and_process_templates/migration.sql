-- CreateEnum
CREATE TYPE "PartnerApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'DOCUMENTS_REQUIRED', 'CONDITIONAL_OFFER', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'ENROLLED');

-- AlterEnum
ALTER TYPE "IntakeSeason" ADD VALUE 'WINTER';

-- CreateTable
CREATE TABLE "application_process_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "programId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_process_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_process_steps" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "statusKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_process_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_document_types" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "fileTypes" TEXT[] DEFAULT ARRAY['pdf']::TEXT[],
    "maxSizeMb" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_document_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_applications" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "partnerStudentId" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "intakeSeason" "IntakeSeason" NOT NULL,
    "intakeYear" INTEGER NOT NULL,
    "status" "PartnerApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "rejectionReason" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "englishProficiency" TEXT,
    "gpa" TEXT,
    "prerequisites" TEXT,
    "notes" TEXT,
    "adminNotes" TEXT,
    "assignedTo" TEXT,
    "backupPrograms" JSONB DEFAULT '[]',
    "documents" JSONB DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "application_process_templates_programId_key" ON "application_process_templates"("programId");

-- CreateIndex
CREATE INDEX "application_process_templates_isDefault_idx" ON "application_process_templates"("isDefault");

-- CreateIndex
CREATE INDEX "application_process_steps_templateId_idx" ON "application_process_steps"("templateId");

-- CreateIndex
CREATE INDEX "application_document_types_stepId_idx" ON "application_document_types"("stepId");

-- CreateIndex
CREATE INDEX "partner_applications_partnerId_idx" ON "partner_applications"("partnerId");

-- CreateIndex
CREATE INDEX "partner_applications_partnerStudentId_idx" ON "partner_applications"("partnerStudentId");

-- CreateIndex
CREATE INDEX "partner_applications_status_idx" ON "partner_applications"("status");

-- CreateIndex
CREATE INDEX "partner_applications_universityId_idx" ON "partner_applications"("universityId");

-- CreateIndex
CREATE INDEX "partner_applications_programId_idx" ON "partner_applications"("programId");

-- CreateIndex
CREATE INDEX "partner_applications_createdAt_idx" ON "partner_applications"("createdAt");

-- AddForeignKey
ALTER TABLE "application_process_templates" ADD CONSTRAINT "application_process_templates_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_process_steps" ADD CONSTRAINT "application_process_steps_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "application_process_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_document_types" ADD CONSTRAINT "application_document_types_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "application_process_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_applications" ADD CONSTRAINT "partner_applications_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_applications" ADD CONSTRAINT "partner_applications_partnerStudentId_fkey" FOREIGN KEY ("partnerStudentId") REFERENCES "partner_students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_applications" ADD CONSTRAINT "partner_applications_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_applications" ADD CONSTRAINT "partner_applications_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
