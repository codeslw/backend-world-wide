-- Email OTP is reserved for password reset; signup needs no verification.
-- New accounts are verified at creation and the login gate is gone, so mark
-- every remaining unverified row verified and flip the column default.

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "isEmailVerified" SET DEFAULT true;

UPDATE "users" SET "isEmailVerified" = true WHERE "isEmailVerified" = false;
