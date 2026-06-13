-- Add isFullScholarship to scholarships table
ALTER TABLE "scholarships" ADD COLUMN "isFullScholarship" BOOLEAN NOT NULL DEFAULT false;

-- Add hasFullScholarship to universities table
ALTER TABLE "universities" ADD COLUMN "hasFullScholarship" BOOLEAN NOT NULL DEFAULT false;

-- Add additionalExpenses to universities table (stored as JSONB array of {label, amount} objects)
ALTER TABLE "universities" ADD COLUMN "additionalExpenses" JSONB NOT NULL DEFAULT '[]';
