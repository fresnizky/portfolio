import { prisma } from '@/config/database'
import { Errors } from '@/lib/errors'
import type { CreateAssetInput, UpdateAssetInput } from '@/validations/asset'

export const assetService = {
  /**
   * Create a new asset for a user
   * @param userId - The ID of the user creating the asset
   * @param data - Asset data (ticker, name, category)
   * @returns The created asset
   * @throws ValidationError if ticker already exists for this user
   */
  async create(userId: string, data: CreateAssetInput) {
    // Check for duplicate ticker for this user
    const existing = await prisma.asset.findFirst({
      where: { userId, ticker: data.ticker },
    })
    if (existing) {
      throw Errors.validation('Asset with this ticker already exists', { ticker: data.ticker })
    }

    return prisma.asset.create({
      data: { ...data, userId },
    })
  },

  /**
   * List all assets for a user with optional pagination
   * @param userId - The ID of the user
   * @param options - Optional pagination params (limit, offset)
   * @returns Object with assets array and total count
   */
  async list(userId: string, options?: { limit?: number; offset?: number }) {
    const { limit, offset } = options ?? {}
    
    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        ...(limit !== undefined && { take: limit }),
        ...(offset !== undefined && { skip: offset }),
      }),
      prisma.asset.count({ where: { userId } }),
    ])

    return { assets, total }
  },

  /**
   * Get a single asset by ID with ownership verification
   * @param userId - The ID of the user (for ownership check)
   * @param id - The asset ID
   * @returns The asset if found and owned by user
   * @throws NotFoundError if asset doesn't exist or belongs to another user
   */
  async getById(userId: string, id: string) {
    const asset = await prisma.asset.findFirst({
      where: { id, userId },
    })
    if (!asset) {
      throw Errors.notFound('Asset')
    }
    return asset
  },

  /**
   * Update an existing asset with ownership verification
   * @param userId - The ID of the user (for ownership check)
   * @param id - The asset ID to update
   * @param data - Partial asset data to update
   * @returns The updated asset
   * @throws NotFoundError if asset doesn't exist or belongs to another user
   * @throws ValidationError if updating ticker to one that already exists
   */
  async update(userId: string, id: string, data: UpdateAssetInput) {
    await this.getById(userId, id) // Verify ownership

    // If updating ticker, check for duplicates
    if (data.ticker) {
      const existing = await prisma.asset.findFirst({
        where: { userId, ticker: data.ticker, NOT: { id } },
      })
      if (existing) {
        throw Errors.validation('Asset with this ticker already exists', { ticker: data.ticker })
      }
    }

    return prisma.asset.update({
      where: { id },
      data,
    })
  },

  /**
   * Delete an asset with ownership verification
   * @param userId - The ID of the user (for ownership check)
   * @param id - The asset ID to delete
   * @returns The deleted asset
   * @throws NotFoundError if asset doesn't exist or belongs to another user
   */
  async delete(userId: string, id: string) {
    await this.getById(userId, id) // Verify ownership
    return prisma.asset.delete({ where: { id } })
  },

  /**
   * Validate that targets sum to 100%
   * @param userId - The user's ID
   * @param pendingUpdates - Optional map of assetId -> new targetPercentage to apply
   * @returns Validation result with current sum and difference from 100%
   */
  async validateTargetsSum(
    userId: string,
    pendingUpdates?: Map<string, number>
  ): Promise<{ valid: boolean; sum: number; difference: number }> {
    const { assets } = await this.list(userId)

    let sum = 0
    for (const asset of assets) {
      const newTarget = pendingUpdates?.get(asset.id)
      // Prisma Decimal has toNumber() method, but also works with Number()
      const currentTarget = typeof asset.targetPercentage.toNumber === 'function'
        ? asset.targetPercentage.toNumber()
        : Number(asset.targetPercentage)
      const targetValue = newTarget !== undefined ? newTarget : currentTarget
      sum += targetValue
    }

    // Round to avoid floating point issues
    sum = Math.round(sum * 100) / 100
    const difference = Math.round((sum - 100) * 100) / 100

    return {
      valid: sum === 100,
      sum,
      difference,
    }
  },
}
