-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showOnHomepage" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "reviews_isFeatured_idx" ON "reviews"("isFeatured");

-- CreateIndex
CREATE INDEX "reviews_showOnHomepage_idx" ON "reviews"("showOnHomepage");
