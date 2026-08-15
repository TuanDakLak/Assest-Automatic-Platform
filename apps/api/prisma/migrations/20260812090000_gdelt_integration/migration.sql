-- AlterTable: seed keywords used to query the GDELT DOC 2.0 API
ALTER TABLE "Category" ADD COLUMN "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable: cached GDELT metrics per keyword
CREATE TABLE "GdeltSnapshot" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "searchVolume" INTEGER NOT NULL DEFAULT 0,
    "trendScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "marketScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "competitionScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "articleCount" INTEGER NOT NULL DEFAULT 0,
    "distinctDomains" INTEGER NOT NULL DEFAULT 0,
    "raw" JSONB,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GdeltSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GdeltSnapshot_keyword_key" ON "GdeltSnapshot"("keyword");

-- CreateIndex
CREATE INDEX "GdeltSnapshot_fetchedAt_idx" ON "GdeltSnapshot"("fetchedAt");
