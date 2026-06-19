-- Partner audit log: immutable activity trail of partner actions.

-- CreateEnum
CREATE TYPE "PartnerAuditAction" AS ENUM (
  'LOGIN',
  'STUDENT_CREATED',
  'STUDENT_UPDATED',
  'STUDENT_DELETED',
  'DOCUMENT_UPLOADED',
  'DOCUMENT_DELETED',
  'APPLICATION_CREATED',
  'APPLICATION_UPDATED',
  'APPLICATION_DELETED',
  'APPLICATION_STATUS_CHANGED',
  'MEMBER_INVITED',
  'MEMBER_REMOVED',
  'MEMBER_PERMISSIONS_UPDATED',
  'COMPANY_UPDATED',
  'ACCESS_ENABLED',
  'ACCESS_DISABLED'
);

-- CreateTable
CREATE TABLE "partner_audit_logs" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "action" "PartnerAuditAction" NOT NULL,
  "actorId" TEXT,
  "actorRole" "Role",
  "actorName" TEXT,
  "organizationId" TEXT,
  "targetType" TEXT,
  "targetId" TEXT,
  "targetLabel" TEXT,
  "metadata" JSONB,
  "ipAddress" TEXT,

  CONSTRAINT "partner_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "partner_audit_logs_organizationId_createdAt_idx" ON "partner_audit_logs"("organizationId", "createdAt");
CREATE INDEX "partner_audit_logs_actorId_createdAt_idx" ON "partner_audit_logs"("actorId", "createdAt");
CREATE INDEX "partner_audit_logs_action_idx" ON "partner_audit_logs"("action");
CREATE INDEX "partner_audit_logs_createdAt_idx" ON "partner_audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "partner_audit_logs" ADD CONSTRAINT "partner_audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "partner_audit_logs" ADD CONSTRAINT "partner_audit_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "partner_organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
