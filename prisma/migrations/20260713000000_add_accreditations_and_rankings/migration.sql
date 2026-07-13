-- CreateTable
CREATE TABLE "accreditations" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "descriptionUz" TEXT,
    "descriptionRu" TEXT,
    "descriptionEn" TEXT,
    "imageUrl" TEXT,
    "establishedYear" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accreditations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranking_organizations" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "descriptionUz" TEXT,
    "descriptionRu" TEXT,
    "descriptionEn" TEXT,
    "imageUrl" TEXT,
    "establishedYear" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ranking_organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "university_accreditations" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "accreditationId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "university_accreditations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "university_rankings" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "rankingOrganizationId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "score" DOUBLE PRECISION,
    "category" TEXT,
    "year" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "university_rankings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "accreditations_sortOrder_idx" ON "accreditations"("sortOrder");

-- CreateIndex
CREATE INDEX "ranking_organizations_sortOrder_idx" ON "ranking_organizations"("sortOrder");

-- CreateIndex
CREATE INDEX "university_accreditations_universityId_idx" ON "university_accreditations"("universityId");

-- CreateIndex
CREATE INDEX "university_accreditations_accreditationId_idx" ON "university_accreditations"("accreditationId");

-- CreateIndex
CREATE UNIQUE INDEX "university_accreditations_universityId_accreditationId_key" ON "university_accreditations"("universityId", "accreditationId");

-- CreateIndex
CREATE INDEX "university_rankings_universityId_idx" ON "university_rankings"("universityId");

-- CreateIndex
CREATE INDEX "university_rankings_rankingOrganizationId_idx" ON "university_rankings"("rankingOrganizationId");

-- CreateIndex
CREATE UNIQUE INDEX "university_rankings_universityId_rankingOrganizationId_cate_key" ON "university_rankings"("universityId", "rankingOrganizationId", "category");

-- AddForeignKey
ALTER TABLE "university_accreditations" ADD CONSTRAINT "university_accreditations_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "university_accreditations" ADD CONSTRAINT "university_accreditations_accreditationId_fkey" FOREIGN KEY ("accreditationId") REFERENCES "accreditations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "university_rankings" ADD CONSTRAINT "university_rankings_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "university_rankings" ADD CONSTRAINT "university_rankings_rankingOrganizationId_fkey" FOREIGN KEY ("rankingOrganizationId") REFERENCES "ranking_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
