-- CreateEnum
CREATE TYPE "ReviewType" AS ENUM ('STUDENT_SUCCESS_VISA', 'STUDENT_TESTIMONIAL', 'UNIVERSITY_OFFER');

-- AlterTable
ALTER TABLE "reviews"
ADD COLUMN "type" "ReviewType" NOT NULL DEFAULT 'STUDENT_TESTIMONIAL',
ADD COLUMN "imageUrl" TEXT,
ADD COLUMN "country" TEXT,
ADD COLUMN "destinationCountry" TEXT,
ADD COLUMN "degree" TEXT,
ADD COLUMN "university" TEXT,
ADD COLUMN "ranking" TEXT,
ADD COLUMN "scholarshipAmount" TEXT,
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "reviews" ALTER COLUMN "rating" SET DEFAULT 5;

-- CreateIndex
CREATE INDEX "reviews_type_idx" ON "reviews"("type");

-- CreateIndex
CREATE INDEX "reviews_sortOrder_idx" ON "reviews"("sortOrder");
