-- CreateEnum
CREATE TYPE "MiniApplicationStatus" AS ENUM ('NEW', 'CONTACTED', 'CLOSED');

-- AlterTable
ALTER TABLE "mini_applications" ADD COLUMN     "status" "MiniApplicationStatus" NOT NULL DEFAULT 'NEW';

-- CreateIndex
CREATE INDEX "mini_applications_status_idx" ON "mini_applications"("status");
