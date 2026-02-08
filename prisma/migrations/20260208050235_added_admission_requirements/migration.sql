-- CreateTable
CREATE TABLE "admission_requirements" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "programLevel" "StudyLevel" NOT NULL,
    "minEducationLevel" TEXT NOT NULL,
    "minGpa" TEXT NOT NULL,
    "languageRequirements" JSONB NOT NULL,
    "notes" TEXT[],
    "entryRequirements" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admission_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admission_requirements_universityId_programLevel_key" ON "admission_requirements"("universityId", "programLevel");

-- AddForeignKey
ALTER TABLE "admission_requirements" ADD CONSTRAINT "admission_requirements_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
