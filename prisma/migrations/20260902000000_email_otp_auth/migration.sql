-- Adds email-OTP authentication support: signup email verification and
-- forgot-password reset.
--
-- users.isEmailVerified defaults to false for new rows, but every account that
-- already existed before this migration is backfilled to true — those users
-- registered under the old flow and must not be locked out of login by a
-- verification step they were never offered.

-- CreateEnum
CREATE TYPE "EmailOtpPurpose" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "isEmailVerified" BOOLEAN NOT NULL DEFAULT false;

-- Grandfather existing accounts so the new gate only applies to new signups.
UPDATE "users" SET "isEmailVerified" = true;

-- CreateTable
CREATE TABLE "email_otps" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "purpose" "EmailOtpPurpose" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_otps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_otps_email_purpose_idx" ON "email_otps"("email", "purpose");

-- CreateIndex
CREATE INDEX "email_otps_expiresAt_idx" ON "email_otps"("expiresAt");
