/*
  Warnings:

  - You are about to drop the `TuitionFee` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `University` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "University" DROP CONSTRAINT "University_cityId_fkey";

-- DropForeignKey
ALTER TABLE "University" DROP CONSTRAINT "University_countryId_fkey";

-- DropForeignKey
ALTER TABLE "University" DROP CONSTRAINT "University_tuitionFeeId_fkey";

-- DropForeignKey
ALTER TABLE "_ProgramToUniversity" DROP CONSTRAINT "_ProgramToUniversity_B_fkey";

-- DropTable
DROP TABLE "TuitionFee";

-- DropTable
DROP TABLE "University";

-- CreateTable
CREATE TABLE "universities" (
    "id" TEXT NOT NULL,
    "nameUz" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "established" INTEGER NOT NULL,
    "type" "UniversityType" NOT NULL,
    "avgApplicationFee" DOUBLE PRECISION NOT NULL,
    "countryId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "descriptionUz" TEXT NOT NULL,
    "descriptionRu" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "winterIntakeDeadline" TIMESTAMP(3),
    "autumnIntakeDeadline" TIMESTAMP(3),
    "ranking" INTEGER NOT NULL,
    "studentsCount" INTEGER NOT NULL,
    "acceptanceRate" DOUBLE PRECISION NOT NULL,
    "website" TEXT NOT NULL,
    "tuitionFeeMin" DOUBLE PRECISION NOT NULL,
    "tuitionFeeMax" DOUBLE PRECISION NOT NULL,
    "tuitionFeeCurrency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "universities_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "universities" ADD CONSTRAINT "universities_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "universities" ADD CONSTRAINT "universities_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProgramToUniversity" ADD CONSTRAINT "_ProgramToUniversity_B_fkey" FOREIGN KEY ("B") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
