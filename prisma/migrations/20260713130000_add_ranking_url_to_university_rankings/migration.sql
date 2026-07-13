-- Add an optional source URL to each university ranking entry.
ALTER TABLE "university_rankings" ADD COLUMN "rankingUrl" TEXT;
