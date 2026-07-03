-- CreateTable
CREATE TABLE "exchange_rate_snapshots" (
    "id" TEXT NOT NULL,
    "baseCode" TEXT NOT NULL DEFAULT 'USD',
    "rates" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextUpdateAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_rate_snapshots_pkey" PRIMARY KEY ("id")
);
