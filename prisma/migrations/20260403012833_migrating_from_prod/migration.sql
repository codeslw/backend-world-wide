-- CreateIndex
CREATE INDEX "Message_chatId_createdAt_idx" ON "Message"("chatId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_chatId_readByClient_idx" ON "Message"("chatId", "readByClient");

-- CreateIndex
CREATE INDEX "Message_chatId_readByAdmin_idx" ON "Message"("chatId", "readByAdmin");

-- CreateIndex
CREATE INDEX "applications_profileId_applicationStatus_idx" ON "applications"("profileId", "applicationStatus");

-- CreateIndex
CREATE INDEX "applications_preferredUniversity_idx" ON "applications"("preferredUniversity");

-- CreateIndex
CREATE INDEX "applications_preferredProgram_idx" ON "applications"("preferredProgram");

-- CreateIndex
CREATE INDEX "applications_createdAt_idx" ON "applications"("createdAt");

-- CreateIndex
CREATE INDEX "profiles_createdAt_idx" ON "profiles"("createdAt");
