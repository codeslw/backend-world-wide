-- CreateIndex
CREATE INDEX "partner_members_organizationId_idx" ON "partner_members"("organizationId");

-- CreateIndex
CREATE INDEX "partner_permissions_memberId_idx" ON "partner_permissions"("memberId");
