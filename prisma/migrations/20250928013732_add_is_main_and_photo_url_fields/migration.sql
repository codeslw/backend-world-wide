-- AlterTable
ALTER TABLE "Country" ADD COLUMN     "isMain" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "photoUrl" TEXT;

-- AlterTable
ALTER TABLE "universities" ADD COLUMN     "isMain" BOOLEAN NOT NULL DEFAULT false;
