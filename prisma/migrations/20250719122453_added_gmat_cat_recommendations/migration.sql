-- CreateEnum
CREATE TYPE "StandardizedTestType" AS ENUM ('GMAT', 'CAT', 'GRE');

-- AlterTable
ALTER TABLE "university_requirements" ADD COLUMN     "minCatScore" INTEGER,
ADD COLUMN     "minGmatScore" INTEGER,
ADD COLUMN     "requiredRecommendationLetters" INTEGER DEFAULT 0;

-- CreateTable
CREATE TABLE "standardized_tests" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "testType" "StandardizedTestType" NOT NULL,
    "score" INTEGER NOT NULL,
    "certificateUrl" TEXT,
    "dateOfIssue" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "standardized_tests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "standardized_tests_profileId_idx" ON "standardized_tests"("profileId");

-- AddForeignKey
ALTER TABLE "standardized_tests" ADD CONSTRAINT "standardized_tests_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
