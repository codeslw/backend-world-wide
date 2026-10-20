-- CreateTable
CREATE TABLE "partner_telegram_links" (
    "phone" TEXT NOT NULL,
    "linked" BOOLEAN NOT NULL,
    "linkedAt" TIMESTAMP(3),
    "streamSeq" BIGINT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_telegram_links_pkey" PRIMARY KEY ("phone")
);
