-- Migration: Decimal Precision Support
-- Converts *Cents BigInt fields to Decimal(18,8) for high-precision asset support
-- Adds decimalPlaces field to Asset for per-asset decimal configuration

-- Step 1: Add decimalPlaces column to Asset with default value
ALTER TABLE "Asset" ADD COLUMN "decimalPlaces" INTEGER NOT NULL DEFAULT 2;

-- Step 2: Set decimalPlaces based on existing asset categories
UPDATE "Asset" SET "decimalPlaces" = 8 WHERE "category" = 'CRYPTO';
UPDATE "Asset" SET "decimalPlaces" = 6 WHERE "category" = 'FCI';
-- ETF and CASH keep default 2

-- Step 3: Convert Asset.currentPriceCents to currentPrice Decimal
-- First add new column, then migrate data, then drop old column
ALTER TABLE "Asset" ADD COLUMN "currentPrice" DECIMAL(18, 8);
UPDATE "Asset" SET "currentPrice" = "currentPriceCents"::DECIMAL / 100 WHERE "currentPriceCents" IS NOT NULL;
ALTER TABLE "Asset" DROP COLUMN "currentPriceCents";

-- Step 4: Convert Transaction fields
-- 4a: priceCents -> price
ALTER TABLE "Transaction" ADD COLUMN "price" DECIMAL(18, 8);
UPDATE "Transaction" SET "price" = "priceCents"::DECIMAL / 100;
ALTER TABLE "Transaction" ALTER COLUMN "price" SET NOT NULL;
ALTER TABLE "Transaction" DROP COLUMN "priceCents";

-- 4b: commissionCents -> commission
ALTER TABLE "Transaction" ADD COLUMN "commission" DECIMAL(18, 8) NOT NULL DEFAULT 0;
UPDATE "Transaction" SET "commission" = "commissionCents"::DECIMAL / 100;
ALTER TABLE "Transaction" DROP COLUMN "commissionCents";

-- 4c: totalCents -> total
ALTER TABLE "Transaction" ADD COLUMN "total" DECIMAL(18, 8);
UPDATE "Transaction" SET "total" = "totalCents"::DECIMAL / 100;
ALTER TABLE "Transaction" ALTER COLUMN "total" SET NOT NULL;
ALTER TABLE "Transaction" DROP COLUMN "totalCents";

-- Step 5: Convert PortfolioSnapshot.totalValueCents -> totalValue
ALTER TABLE "PortfolioSnapshot" ADD COLUMN "totalValue" DECIMAL(18, 8);
UPDATE "PortfolioSnapshot" SET "totalValue" = "totalValueCents"::DECIMAL / 100;
ALTER TABLE "PortfolioSnapshot" ALTER COLUMN "totalValue" SET NOT NULL;
ALTER TABLE "PortfolioSnapshot" DROP COLUMN "totalValueCents";

-- Step 6: Convert SnapshotAsset fields
-- 6a: priceCents -> price
ALTER TABLE "SnapshotAsset" ADD COLUMN "price" DECIMAL(18, 8);
UPDATE "SnapshotAsset" SET "price" = "priceCents"::DECIMAL / 100;
ALTER TABLE "SnapshotAsset" ALTER COLUMN "price" SET NOT NULL;
ALTER TABLE "SnapshotAsset" DROP COLUMN "priceCents";

-- 6b: valueCents -> value
ALTER TABLE "SnapshotAsset" ADD COLUMN "value" DECIMAL(18, 8);
UPDATE "SnapshotAsset" SET "value" = "valueCents"::DECIMAL / 100;
ALTER TABLE "SnapshotAsset" ALTER COLUMN "value" SET NOT NULL;
ALTER TABLE "SnapshotAsset" DROP COLUMN "valueCents";
