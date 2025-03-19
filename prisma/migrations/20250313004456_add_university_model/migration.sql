-- CreateEnum
CREATE TYPE "UniversityType" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateTable
CREATE TABLE "University" (
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
    "tuitionFeeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "University_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TuitionFee" (
    "id" SERIAL NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TuitionFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProgramToUniversity" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProgramToUniversity_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "University_tuitionFeeId_key" ON "University"("tuitionFeeId");

-- CreateIndex
CREATE INDEX "_ProgramToUniversity_B_index" ON "_ProgramToUniversity"("B");

-- AddForeignKey
ALTER TABLE "University" ADD CONSTRAINT "University_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "University" ADD CONSTRAINT "University_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "University" ADD CONSTRAINT "University_tuitionFeeId_fkey" FOREIGN KEY ("tuitionFeeId") REFERENCES "TuitionFee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProgramToUniversity" ADD CONSTRAINT "_ProgramToUniversity_A_fkey" FOREIGN KEY ("A") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProgramToUniversity" ADD CONSTRAINT "_ProgramToUniversity_B_fkey" FOREIGN KEY ("B") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;
