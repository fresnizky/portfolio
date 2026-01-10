-- CreateTable
CREATE TABLE "PortfolioSnapshot" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalValueCents" BIGINT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SnapshotAsset" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DECIMAL(18,8) NOT NULL,
    "priceCents" BIGINT NOT NULL,
    "valueCents" BIGINT NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "SnapshotAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PortfolioSnapshot_userId_idx" ON "PortfolioSnapshot"("userId");

-- CreateIndex
CREATE INDEX "PortfolioSnapshot_date_idx" ON "PortfolioSnapshot"("date");

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioSnapshot_userId_date_key" ON "PortfolioSnapshot"("userId", "date");

-- CreateIndex
CREATE INDEX "SnapshotAsset_snapshotId_idx" ON "SnapshotAsset"("snapshotId");

-- CreateIndex
CREATE UNIQUE INDEX "SnapshotAsset_snapshotId_assetId_key" ON "SnapshotAsset"("snapshotId", "assetId");

-- AddForeignKey
ALTER TABLE "PortfolioSnapshot" ADD CONSTRAINT "PortfolioSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SnapshotAsset" ADD CONSTRAINT "SnapshotAsset_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "PortfolioSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
