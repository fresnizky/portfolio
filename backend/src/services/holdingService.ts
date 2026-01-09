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
}
