-- CreateTable
CREATE TABLE "AiRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "feature" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptHash" TEXT,
    "status" TEXT NOT NULL,
    "costUnits" INTEGER NOT NULL DEFAULT 0,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "totalTokens" INTEGER,
    "providerMetadata" JSONB,
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiUsageSummary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "monthKey" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "costUnits" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiUsageSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedAsset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptHash" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneratedAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockAsset" (
    "id" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbUrl" TEXT,
    "alt" TEXT,
    "category" TEXT NOT NULL,
    "tags" TEXT[] NOT NULL DEFAULT '{}',
    "orientation" TEXT NOT NULL,
    "colorHints" TEXT[] NOT NULL DEFAULT '{}',
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "license" TEXT NOT NULL,
    "licenseUrl" TEXT NOT NULL,
    "attribution" TEXT,
    "attributionRequired" BOOLEAN NOT NULL DEFAULT false,
    "commercialUse" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiRequest_userId_createdAt_idx" ON "AiRequest"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AiRequest_feature_createdAt_idx" ON "AiRequest"("feature", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AiUsageSummary_userId_monthKey_feature_key" ON "AiUsageSummary"("userId", "monthKey", "feature");

-- CreateIndex
CREATE INDEX "AiUsageSummary_userId_monthKey_idx" ON "AiUsageSummary"("userId", "monthKey");

-- CreateIndex
CREATE INDEX "GeneratedAsset_userId_createdAt_idx" ON "GeneratedAsset"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "GeneratedAsset_feature_createdAt_idx" ON "GeneratedAsset"("feature", "createdAt");

-- CreateIndex
CREATE INDEX "StockAsset_mediaType_category_idx" ON "StockAsset"("mediaType", "category");

-- CreateIndex
CREATE INDEX "StockAsset_source_idx" ON "StockAsset"("source");

-- CreateIndex
CREATE INDEX "StockAsset_license_idx" ON "StockAsset"("license");

-- AddForeignKey
ALTER TABLE "AiRequest" ADD CONSTRAINT "AiRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiUsageSummary" ADD CONSTRAINT "AiUsageSummary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedAsset" ADD CONSTRAINT "GeneratedAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
