/*
  Warnings:

  - You are about to drop the column `currentPrice` on the `Asset` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Asset" DROP COLUMN "currentPrice",
ADD COLUMN     "currentPriceCents" BIGINT;
