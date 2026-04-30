-- AlterTable
ALTER TABLE "Country" ADD COLUMN     "workingDuringStudiesAllowed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "workingHoursBachelor" TEXT,
ADD COLUMN     "workingHoursMaster" TEXT,
ADD COLUMN     "workingPlacesAllowed" TEXT[] DEFAULT ARRAY[]::TEXT[];
