-- AlterTable
ALTER TABLE "User" ADD COLUMN     "priceAlertDays" INTEGER NOT NULL DEFAULT 7,
ADD COLUMN     "rebalanceThreshold" DECIMAL(65,30) NOT NULL DEFAULT 5.0;
