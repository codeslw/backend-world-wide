/*
  Warnings:

  - You are about to alter the column `amount` on the `scholarships` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Decimal(12,2)`.

*/
-- DropForeignKey
ALTER TABLE "public"."scholarships" DROP CONSTRAINT "scholarships_programId_fkey";

-- AlterTable
ALTER TABLE "scholarships" ADD COLUMN     "isAutoApplied" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "percentage" INTEGER,
ADD COLUMN     "percentageInfo" TEXT,
ALTER COLUMN "programId" DROP NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "amountCurrency" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "universities_name_idx" ON "universities"("name");

-- AddForeignKey
ALTER TABLE "scholarships" ADD CONSTRAINT "scholarships_programId_fkey" FOREIGN KEY ("programId") REFERENCES "university_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
