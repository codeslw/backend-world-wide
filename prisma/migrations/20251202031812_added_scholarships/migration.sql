-- AlterTable
ALTER TABLE "universities" ADD COLUMN     "hasScholarship" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "scholarshipRequirements" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "scholarships" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "universityId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scholarships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scholarships_universityId_idx" ON "scholarships"("universityId");

-- CreateIndex
CREATE INDEX "scholarships_programId_idx" ON "scholarships"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "scholarships_universityId_programId_key" ON "scholarships"("universityId", "programId");

-- AddForeignKey
ALTER TABLE "scholarships" ADD CONSTRAINT "scholarships_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scholarships" ADD CONSTRAINT "scholarships_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
