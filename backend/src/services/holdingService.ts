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
   * @returns Object with the holding and whether it was created or updated
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

    // Check if holding already exists to determine if this is create or update
    const existingHolding = await prisma.holding.findUnique({
      where: { assetId },
    })

    // Upsert holding
    const holding = await prisma.holding.upsert({
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

    return {
      holding,
      isNew: !existingHolding,
    }
  },
}
