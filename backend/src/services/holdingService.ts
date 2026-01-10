import { prisma } from '@/config/database'
import { Errors } from '@/lib/errors'

export const holdingService = {
  /**
   * Get all holdings for a user with asset details
   * @param userId - The ID of the user
   * @returns Array of holdings with asset information
   */
  async getHoldings(userId: string) {
    return prisma.holding.findMany({
      where: { userId },
      include: {
        asset: {
          select: {
            id: true,
            ticker: true,
            name: true,
            category: true,
          },
        },
      },
      orderBy: { asset: { ticker: 'asc' } },
    })
  },

  /**
   * Create or update a holding for an asset
   * Uses upsert to handle both create and update in a single operation
   * @param userId - The ID of the user
   * @param assetId - The ID of the asset
   * @param quantity - The quantity to set
   * @returns The created or updated holding with asset details
   * @throws NotFoundError if asset doesn't exist
   * @throws ForbiddenError if asset belongs to another user
   */
  async createOrUpdateHolding(userId: string, assetId: string, quantity: number) {
    // Verify asset exists
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
    })

    if (!asset) {
      throw Errors.notFound('Asset')
    }

    // Verify asset belongs to user
    if (asset.userId !== userId) {
      throw Errors.forbidden()
    }

    // Upsert holding
    return prisma.holding.upsert({
      where: { assetId },
      create: {
        userId,
        assetId,
        quantity,
      },
      update: {
        quantity,
      },
      include: {
        asset: {
          select: {
            id: true,
            ticker: true,
            name: true,
            category: true,
          },
        },
      },
    })
  },

  /**
   * Check if a holding exists for an asset
   * @param assetId - The asset ID to check
   * @returns true if holding exists, false otherwise
   */
  async holdingExists(assetId: string): Promise<boolean> {
    const holding = await prisma.holding.findUnique({
      where: { assetId },
      select: { id: true },
    })
    return holding !== null
  },

  /**
   * Create or update multiple holdings atomically with optional prices
   * @param userId - The user's ID
   * @param holdings - Array of { assetId, quantity, price? } where price is in dollars
   * @returns Array of created/updated holdings
   * @throws NotFoundError if any asset doesn't exist
   * @throws ForbiddenError if any asset belongs to another user
   */
  async batchCreateOrUpdate(
    userId: string,
    holdings: Array<{ assetId: string; quantity: number; price?: number }>
  ) {
    // 1. Verify all assets exist and belong to user
    const assetIds = holdings.map(h => h.assetId)
    const assets = await prisma.asset.findMany({
      where: { id: { in: assetIds } },
      select: { id: true, userId: true },
    })

    if (assets.length !== assetIds.length) {
      const foundIds = new Set(assets.map(a => a.id))
      const missingIds = assetIds.filter(id => !foundIds.has(id))
      throw Errors.notFound(`Assets not found: ${missingIds.join(', ')}`)
    }

    const unauthorizedAssets = assets.filter(a => a.userId !== userId)
    if (unauthorizedAssets.length > 0) {
      throw Errors.forbidden()
    }

    // 2. Build transaction operations
    const now = new Date()
    const operations: ReturnType<typeof prisma.holding.upsert | typeof prisma.asset.update>[] = []

    for (const { assetId, quantity, price } of holdings) {
      // Upsert holding
      operations.push(
        prisma.holding.upsert({
          where: { assetId },
          create: { userId, assetId, quantity },
          update: { quantity },
        })
      )

      // Update asset price if provided
      if (price !== undefined) {
        const priceCents = BigInt(Math.round(price * 100))
        operations.push(
          prisma.asset.update({
            where: { id: assetId },
            data: {
              currentPriceCents: priceCents,
              priceUpdatedAt: now,
            },
          })
        )
      }
    }

    // 3. Execute all operations atomically
    await prisma.$transaction(operations)

    // 4. Fetch and return the holdings with asset details
    return prisma.holding.findMany({
      where: { assetId: { in: assetIds } },
      include: {
        asset: {
          select: {
            id: true,
            ticker: true,
            name: true,
            category: true,
            currentPriceCents: true,
          },
        },
      },
    })
  },
}
