-- AlterTable: Add partnerApplicationId to Chat
ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "partnerApplicationId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Chat_partnerApplicationId_idx" ON "Chat"("partnerApplicationId");
