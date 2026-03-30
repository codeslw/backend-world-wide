-- AlterTable
ALTER TABLE "scholarships" ADD COLUMN     "isVisible" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "universities" ADD COLUMN     "youtubeVideoUrl" TEXT;
