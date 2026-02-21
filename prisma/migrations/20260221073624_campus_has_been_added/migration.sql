-- CreateEnum
CREATE TYPE "CampusStatus" AS ENUM ('ACTIVE', 'UNDER_CONSTRUCTION', 'CLOSED');

-- CreateTable
CREATE TABLE "campuses" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "name" TEXT NOT NULL,
    "code" TEXT,
    "establishedDate" TIMESTAMP(3),
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "boundaries" JSONB,
    "timezone" TEXT,
    "totalArea" DOUBLE PRECISION,
    "buildingCount" INTEGER,
    "facilityTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "parkingCapacity" INTEGER,
    "director" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "operatingHours" TEXT,
    "status" "CampusStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CampusToUniversityProgram" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CampusToUniversityProgram_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "campuses_universityId_idx" ON "campuses"("universityId");

-- CreateIndex
CREATE INDEX "_CampusToUniversityProgram_B_index" ON "_CampusToUniversityProgram"("B");

-- AddForeignKey
ALTER TABLE "campuses" ADD CONSTRAINT "campuses_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CampusToUniversityProgram" ADD CONSTRAINT "_CampusToUniversityProgram_A_fkey" FOREIGN KEY ("A") REFERENCES "campuses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CampusToUniversityProgram" ADD CONSTRAINT "_CampusToUniversityProgram_B_fkey" FOREIGN KEY ("B") REFERENCES "university_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

