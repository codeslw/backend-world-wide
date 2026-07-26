-- Introduces the University -> Faculty -> Department -> UniversityProgram
-- hierarchy and the machine-readable per-program admission requirements.
--
-- This migration is pure DDL. The companion migration
-- 20260726001000_backfill_program_hierarchy does the data work (backfilling
-- university_programs.title, seeding faculties, repointing application FKs and
-- finally dropping university_programs."programId").

-- CreateEnum
CREATE TYPE "StudyMode" AS ENUM ('FULL_TIME', 'PART_TIME', 'ONLINE', 'HYBRID');

-- CreateEnum
CREATE TYPE "LanguageTestType" AS ENUM ('IELTS', 'TOEFL_IBT', 'TOEFL_PBT', 'DUOLINGO', 'PTE', 'CAMBRIDGE', 'TOEIC');

-- CreateEnum
CREATE TYPE "RequirementStatus" AS ENUM ('REQUIRED', 'OPTIONAL', 'NOT_REQUIRED');

-- CreateEnum
CREATE TYPE "DocumentRequirementKind" AS ENUM ('PASSPORT', 'TRANSCRIPT', 'DIPLOMA', 'RECOMMENDATION_LETTER', 'MOTIVATION_LETTER', 'CV', 'PORTFOLIO', 'RESEARCH_PROPOSAL', 'FINANCIAL_PROOF', 'MEDICAL_CERTIFICATE', 'PHOTO', 'ENGLISH_CERTIFICATE', 'STANDARDIZED_TEST_SCORE', 'INTERVIEW', 'OTHER');

-- AlterEnum: the profile-level test enum gains the two entrance exams that
-- program requirements need to express.
ALTER TYPE "StandardizedTestType" ADD VALUE IF NOT EXISTS 'SAT';
ALTER TYPE "StandardizedTestType" ADD VALUE IF NOT EXISTS 'ACT';

-- CreateTable
CREATE TABLE "faculties" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL,
    "nameUz" TEXT NOT NULL,
    "descriptionEn" TEXT,
    "descriptionRu" TEXT,
    "descriptionUz" TEXT,
    "iconKey" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faculties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL,
    "nameUz" TEXT NOT NULL,
    "descriptionEn" TEXT,
    "descriptionRu" TEXT,
    "descriptionUz" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "faculties_slug_key" ON "faculties"("slug");
CREATE INDEX "faculties_sortOrder_idx" ON "faculties"("sortOrder");
CREATE INDEX "faculties_isActive_idx" ON "faculties"("isActive");
CREATE UNIQUE INDEX "departments_facultyId_slug_key" ON "departments"("facultyId", "slug");
CREATE INDEX "departments_facultyId_idx" ON "departments"("facultyId");
CREATE INDEX "departments_sortOrder_idx" ON "departments"("sortOrder");

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: a university program now owns its identity and content.
-- "title" is added nullable here and made NOT NULL by the backfill migration.
ALTER TABLE "university_programs"
    ADD COLUMN "title" TEXT,
    ADD COLUMN "slug" TEXT,
    ADD COLUMN "facultyId" TEXT,
    ADD COLUMN "departmentId" TEXT,
    ADD COLUMN "descriptionEn" TEXT,
    ADD COLUMN "descriptionRu" TEXT,
    ADD COLUMN "descriptionUz" TEXT,
    ADD COLUMN "careerOutcomesEn" TEXT,
    ADD COLUMN "careerOutcomesRu" TEXT,
    ADD COLUMN "careerOutcomesUz" TEXT,
    ADD COLUMN "curriculumEn" TEXT,
    ADD COLUMN "curriculumRu" TEXT,
    ADD COLUMN "curriculumUz" TEXT,
    ADD COLUMN "credits" INTEGER,
    ADD COLUMN "studyMode" "StudyMode" NOT NULL DEFAULT 'FULL_TIME',
    ADD COLUMN "applicationFee" DOUBLE PRECISION,
    ADD COLUMN "applicationFeeCurrency" TEXT,
    ADD COLUMN "isApplicationFeeRefundable" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "additionalExpenses" JSONB NOT NULL DEFAULT '[]',
    ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "university_programs_facultyId_idx" ON "university_programs"("facultyId");
CREATE INDEX "university_programs_departmentId_idx" ON "university_programs"("departmentId");
CREATE INDEX "university_programs_isActive_idx" ON "university_programs"("isActive");

-- AddForeignKey
ALTER TABLE "university_programs" ADD CONSTRAINT "university_programs_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculties"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "university_programs" ADD CONSTRAINT "university_programs_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "program_admission_requirements" (
    "id" TEXT NOT NULL,
    "universityProgramId" TEXT NOT NULL,
    "minEducationLevel" "DegreeType",
    "minGpa" DOUBLE PRECISION,
    "gpaScale" DOUBLE PRECISION DEFAULT 4,
    "requiredSubjects" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "minWorkExperienceYears" INTEGER,
    "minAge" INTEGER,
    "maxAge" INTEGER,
    "requiresInterview" BOOLEAN NOT NULL DEFAULT false,
    "requiresPortfolio" BOOLEAN NOT NULL DEFAULT false,
    "englishRequirementWaivable" BOOLEAN NOT NULL DEFAULT false,
    "englishWaiverNoteEn" TEXT,
    "englishWaiverNoteRu" TEXT,
    "englishWaiverNoteUz" TEXT,
    "additionalNotesEn" TEXT,
    "additionalNotesRu" TEXT,
    "additionalNotesUz" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_admission_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_language_test_requirements" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "test" "LanguageTestType" NOT NULL,
    "minTotal" DOUBLE PRECISION,
    "minListening" DOUBLE PRECISION,
    "minReading" DOUBLE PRECISION,
    "minWriting" DOUBLE PRECISION,
    "minSpeaking" DOUBLE PRECISION,

    CONSTRAINT "program_language_test_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_standardized_test_requirements" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "test" "StandardizedTestType" NOT NULL,
    "minScore" DOUBLE PRECISION,
    "status" "RequirementStatus" NOT NULL DEFAULT 'REQUIRED',

    CONSTRAINT "program_standardized_test_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_document_requirements" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "kind" "DocumentRequirementKind" NOT NULL,
    "status" "RequirementStatus" NOT NULL DEFAULT 'REQUIRED',
    "quantity" INTEGER,
    "labelEn" TEXT,
    "labelRu" TEXT,
    "labelUz" TEXT,
    "notesEn" TEXT,
    "notesRu" TEXT,
    "notesUz" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "program_document_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "program_admission_requirements_universityProgramId_key" ON "program_admission_requirements"("universityProgramId");
CREATE UNIQUE INDEX "program_language_test_requirements_requirementId_test_key" ON "program_language_test_requirements"("requirementId", "test");
CREATE INDEX "program_language_test_requirements_test_idx" ON "program_language_test_requirements"("test");
CREATE UNIQUE INDEX "program_standardized_test_requirements_requirementId_test_key" ON "program_standardized_test_requirements"("requirementId", "test");
CREATE INDEX "program_document_requirements_requirementId_idx" ON "program_document_requirements"("requirementId");

-- AddForeignKey
ALTER TABLE "program_admission_requirements" ADD CONSTRAINT "program_admission_requirements_universityProgramId_fkey" FOREIGN KEY ("universityProgramId") REFERENCES "university_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "program_language_test_requirements" ADD CONSTRAINT "program_language_test_requirements_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "program_admission_requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "program_standardized_test_requirements" ADD CONSTRAINT "program_standardized_test_requirements_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "program_admission_requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "program_document_requirements" ADD CONSTRAINT "program_document_requirements_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "program_admission_requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
