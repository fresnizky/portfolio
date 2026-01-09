-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "currentPrice" DECIMAL(18,2),
ADD COLUMN     "priceUpdatedAt" TIMESTAMP(3);
