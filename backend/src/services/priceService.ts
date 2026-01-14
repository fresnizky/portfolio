import { prisma } from '@/config/database'
import { AppError, Errors } from '@/lib/errors'
import { Prisma } from '@prisma/client'
import type { UpdatePriceInput, BatchUpdatePricesInput } from '@/validations/price'

export const priceService = {
  /**
   * Update price for a single asset
   * Verifies asset ownership before updating
   * @param userId - The ID of the user
   * @param assetId - The ID of the asset
   * @param data - The price update data (price in decimal format)
   * @returns The updated asset
   * @throws NotFoundError if asset doesn't exist or belongs to another user
   */
  async updatePrice(userId: string, assetId: string, data: UpdatePriceInput) {
    // Verify asset exists and belongs to user
    const asset = await prisma.asset.findFirst({
      where: { id: assetId, userId },
    })

    if (!asset) {
      throw Errors.notFound('Asset')
    }

    // Update price with current timestamp
    const updated = await prisma.asset.update({
      where: { id: assetId },
      data: {
        currentPrice: new Prisma.Decimal(data.price),
        priceUpdatedAt: new Date(),
      },
      select: {
        id: true,
        ticker: true,
        name: true,
        currentPrice: true,
        priceUpdatedAt: true,
      },
    })

    return {
      id: updated.id,
      ticker: updated.ticker,
      name: updated.name,
      currentPrice: updated.currentPrice?.toString() ?? null,
      priceUpdatedAt: updated.priceUpdatedAt,
    }
  },

  /**
   * Batch update prices for multiple assets
   * Uses transaction for atomic operation
   * @param userId - The ID of the user
   * @param data - The batch price update data (prices in decimal format)
   * @returns Object with count and updated assets
   * @throws NotFoundError if any asset doesn't exist or belongs to another user
   */
  async batchUpdatePrices(userId: string, data: BatchUpdatePricesInput) {
    const { prices } = data
    const assetIds = prices.map(p => p.assetId)

    // Verify all assets exist and belong to user
    const assets = await prisma.asset.findMany({
      where: {
        id: { in: assetIds },
        userId,
      },
      select: { id: true },
    })

    if (assets.length !== prices.length) {
      const foundIds = assets.map(a => a.id)
      const notFound = assetIds.filter(id => !foundIds.includes(id))
      throw new AppError(404, 'NOT_FOUND', 'One or more assets not found', { notFound })
    }

    // Update all prices atomically
    const timestamp = new Date()
    const updates = await prisma.$transaction(
      prices.map(({ assetId, price }) =>
        prisma.asset.update({
          where: { id: assetId },
          data: {
            currentPrice: new Prisma.Decimal(price),
            priceUpdatedAt: timestamp,
          },
          select: {
            id: true,
            ticker: true,
            currentPrice: true,
            priceUpdatedAt: true,
          },
        })
      )
    )

    return {
      updated: updates.length,
      assets: updates.map(a => ({
        id: a.id,
        ticker: a.ticker,
        currentPrice: a.currentPrice?.toString() ?? null,
        priceUpdatedAt: a.priceUpdatedAt,
      })),
    }
  },
}
