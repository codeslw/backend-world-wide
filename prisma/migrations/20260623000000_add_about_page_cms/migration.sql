-- About page CMS: admin-managed "Our Story" content.

-- CreateTable
CREATE TABLE "about_page" (
    "id" TEXT NOT NULL,
    "heroTitleUz" TEXT,
    "heroTitleRu" TEXT,
    "heroTitleEn" TEXT,
    "heroSubtitleUz" TEXT,
    "heroSubtitleRu" TEXT,
    "heroSubtitleEn" TEXT,
    "heroImageUrl" TEXT,
    "introHeadingUz" TEXT,
    "introHeadingRu" TEXT,
    "introHeadingEn" TEXT,
    "introBodyUz" TEXT,
    "introBodyRu" TEXT,
    "introBodyEn" TEXT,
    "operatorStatementUz" TEXT,
    "operatorStatementRu" TEXT,
    "operatorStatementEn" TEXT,
    "foundedYear" INTEGER DEFAULT 2020,
    "platformLaunch" TEXT DEFAULT '2026-01',
    "founderHeadingUz" TEXT,
    "founderHeadingRu" TEXT,
    "founderHeadingEn" TEXT,
    "milestonesHeadingUz" TEXT,
    "milestonesHeadingRu" TEXT,
    "milestonesHeadingEn" TEXT,
    "teamHeadingUz" TEXT,
    "teamHeadingRu" TEXT,
    "teamHeadingEn" TEXT,
    "certificatesHeadingUz" TEXT,
    "certificatesHeadingRu" TEXT,
    "certificatesHeadingEn" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "about_page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "about_founders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roleUz" TEXT,
    "roleRu" TEXT,
    "roleEn" TEXT,
    "bioUz" TEXT,
    "bioRu" TEXT,
    "bioEn" TEXT,
    "photoUrl" TEXT,
    "linkedinUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "about_founders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "about_milestones" (
    "id" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "titleUz" TEXT,
    "titleRu" TEXT,
    "titleEn" TEXT,
    "descriptionUz" TEXT,
    "descriptionRu" TEXT,
    "descriptionEn" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "about_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "about_team_members" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "positionUz" TEXT,
    "positionRu" TEXT,
    "positionEn" TEXT,
    "roleUz" TEXT,
    "roleRu" TEXT,
    "roleEn" TEXT,
    "groupUz" TEXT,
    "groupRu" TEXT,
    "groupEn" TEXT,
    "photoUrl" TEXT,
    "linkedinUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "about_team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "about_certificates" (
    "id" TEXT NOT NULL,
    "titleUz" TEXT,
    "titleRu" TEXT,
    "titleEn" TEXT,
    "issuerUz" TEXT,
    "issuerRu" TEXT,
    "issuerEn" TEXT,
    "imageUrl" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "about_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "about_founders_sortOrder_idx" ON "about_founders"("sortOrder");

-- CreateIndex
CREATE INDEX "about_milestones_sortOrder_idx" ON "about_milestones"("sortOrder");

-- CreateIndex
CREATE INDEX "about_team_members_sortOrder_idx" ON "about_team_members"("sortOrder");

-- CreateIndex
CREATE INDEX "about_certificates_isFeatured_idx" ON "about_certificates"("isFeatured");

-- CreateIndex
CREATE INDEX "about_certificates_sortOrder_idx" ON "about_certificates"("sortOrder");
