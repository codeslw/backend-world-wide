ALTER TABLE "university_programs"
DROP COLUMN IF EXISTS "tuitionPerYear",
DROP COLUMN IF EXISTS "tuitionPerSemester",
DROP COLUMN IF EXISTS "totalProgramFee",
ADD COLUMN "tuitionFeeType" TEXT NOT NULL DEFAULT 'tuition_per_year';
