-- AlterTable
ALTER TABLE "universities" ADD COLUMN "isRecommended" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "universities_isRecommended_idx" ON "universities"("isRecommended");
