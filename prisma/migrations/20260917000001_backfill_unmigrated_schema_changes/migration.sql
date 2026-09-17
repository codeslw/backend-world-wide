-- Backfill schema changes that were committed to prisma/schema.prisma
-- without a migration:
--   1. University.canApplyWithoutLanguageCert (+ index), added in 9c3071e.
--      Its absence crashes every universities listing in production:
--      `The column universities.canApplyWithoutLanguageCert does not exist`.
--   2. OurService / OurServicesPage tables, added in f7372dd.
--
-- The IF NOT EXISTS guards make this safe on databases where part of the
-- schema was synced with `prisma db push` instead of `migrate deploy`.

-- AlterTable
ALTER TABLE "universities" ADD COLUMN IF NOT EXISTS "canApplyWithoutLanguageCert" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "universities_canApplyWithoutLanguageCert_idx" ON "universities"("canApplyWithoutLanguageCert");

-- CreateTable
CREATE TABLE IF NOT EXISTS "our_services" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "titleUz" TEXT NOT NULL,
    "titleRu" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "shortDescUz" TEXT,
    "shortDescRu" TEXT,
    "shortDescEn" TEXT,
    "fullDescUz" TEXT,
    "fullDescRu" TEXT,
    "fullDescEn" TEXT,
    "iconName" TEXT,
    "badgeUz" TEXT,
    "badgeRu" TEXT,
    "badgeEn" TEXT,
    "featuresUz" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "featuresRu" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "featuresEn" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "actionTextUz" TEXT,
    "actionTextRu" TEXT,
    "actionTextEn" TEXT,
    "actionUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "our_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "our_services_page" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "heroTitleUz" TEXT,
    "heroTitleRu" TEXT,
    "heroTitleEn" TEXT,
    "heroSubtitleUz" TEXT,
    "heroSubtitleRu" TEXT,
    "heroSubtitleEn" TEXT,
    "bannerTitleUz" TEXT,
    "bannerTitleRu" TEXT,
    "bannerTitleEn" TEXT,
    "bannerSubtitleUz" TEXT,
    "bannerSubtitleRu" TEXT,
    "bannerSubtitleEn" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "our_services_page_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "our_services_slug_key" ON "our_services"("slug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "our_services_sortOrder_idx" ON "our_services"("sortOrder");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "our_services_isActive_idx" ON "our_services"("isActive");
