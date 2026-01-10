import { prisma } from '@/config/database'
import { Errors } from '@/lib/errors'
import type { CreateAssetInput, UpdateAssetInput } from '@/validations/asset'

/** Target percentages maximum allowed sum (100%) */
const TARGET_SUM_MAX = 100

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
   * @throws ValidationError if updating targetPercentage and sum would exceed 100%
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

    // If updating targetPercentage, validate sum would not exceed 100%
    if (data.targetPercentage !== undefined) {
      const pendingUpdates = new Map([[id, data.targetPercentage]])
      const validation = await this.validateTargetsSum(userId, pendingUpdates)
      if (!validation.valid) {
        throw Errors.validation(
          `Targets cannot exceed 100%. Current sum: ${validation.sum}%`,
          { sum: validation.sum, difference: validation.difference }
        )
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
   * Validate that targets do not exceed 100%
   * @param userId - The user's ID
   * @param pendingUpdates - Optional map of assetId -> new targetPercentage to apply
   * @returns Promise<{valid: boolean, sum: number, difference: number}> - Validation result
   *   - valid: true if sum is <= 100%
   *   - sum: calculated sum of all targets (rounded to 2 decimals)
   *   - difference: how far from 100% (positive = over, negative = under)
   */
  async validateTargetsSum(
    userId: string,
    pendingUpdates?: Map<string, number>
  ): Promise<{ valid: boolean; sum: number; difference: number }> {
    const { assets } = await this.list(userId)

    let sum = 0
    for (const asset of assets) {
      const newTarget = pendingUpdates?.get(asset.id)
      // Prisma Decimal works with Number() conversion
      const currentTarget = Number(asset.targetPercentage)
      const targetValue = newTarget !== undefined ? newTarget : currentTarget
      sum += targetValue
    }

    // Round to avoid floating point issues
    sum = Math.round(sum * 100) / 100
    const difference = Math.round((sum - TARGET_SUM_MAX) * 100) / 100

    return {
      valid: sum <= TARGET_SUM_MAX,
      sum,
      difference,
    }
  },

  /**
   * Create multiple assets atomically
   * @param userId - The user's ID
   * @param assets - Array of asset data to create
   * @returns Promise<Asset[]> - Array of created assets
   * @throws {AppError} ValidationError (400) if any ticker is duplicate
   */
  async batchCreate(
    userId: string,
    assets: Array<{ ticker: string; name: string; category: string }>
  ) {
    // 1. Check for duplicate tickers within the batch
    const tickers = assets.map(a => a.ticker)
    const uniqueTickers = new Set(tickers)
    if (uniqueTickers.size !== tickers.length) {
      const duplicates = tickers.filter((t, i) => tickers.indexOf(t) !== i)
      throw Errors.validation('Duplicate tickers in batch', { duplicates: [...new Set(duplicates)] })
    }

    // 2. Check for existing tickers for this user
    const existingAssets = await prisma.asset.findMany({
      where: { userId, ticker: { in: tickers } },
      select: { ticker: true },
    })

    if (existingAssets.length > 0) {
      const existingTickers = existingAssets.map(a => a.ticker)
      throw Errors.validation('Assets with these tickers already exist', { tickers: existingTickers })
    }

    // 3. Create all assets atomically
    const createdAssets = await prisma.$transaction(
      assets.map(asset =>
        prisma.asset.create({
          data: { ...asset, userId },
        })
      )
    )

    return createdAssets
  },

  /**
   * Update targets for multiple assets atomically
   * @param userId - The user's ID
   * @param updates - Array of { assetId, targetPercentage } updates to apply
   * @returns Promise<Asset[]> - Array of updated assets in same order as input
   * @throws {AppError} NotFoundError (404) if any assetId doesn't belong to user
   * @throws {AppError} ValidationError (400) if sum of all targets exceeds 100%
   */
  async batchUpdateTargets(
    userId: string,
    updates: Array<{ assetId: string; targetPercentage: number }>
  ) {
    // 1. Verify all assets belong to user
    const assetIds = updates.map(u => u.assetId)
    const userAssets = await prisma.asset.findMany({
      where: { userId, id: { in: assetIds } },
      select: { id: true },
    })

    if (userAssets.length !== assetIds.length) {
      const foundIds = new Set(userAssets.map(a => a.id))
      const missingIds = assetIds.filter(id => !foundIds.has(id))
      throw Errors.notFound(`Assets not found: ${missingIds.join(', ')}`)
    }

    // 2. Build pending updates map
    const pendingUpdates = new Map(
      updates.map(u => [u.assetId, u.targetPercentage])
    )

    // 3. Validate sum would not exceed 100%
    const validation = await this.validateTargetsSum(userId, pendingUpdates)
    if (!validation.valid) {
      throw Errors.validation(
        `Targets cannot exceed 100%. Current sum: ${validation.sum}%`,
        { sum: validation.sum, difference: validation.difference }
      )
    }

    // 4. Atomic update using transaction
    const updatedAssets = await prisma.$transaction(
      updates.map(({ assetId, targetPercentage }) =>
        prisma.asset.update({
          where: { id: assetId },
          data: { targetPercentage },
        })
      )
    )

    return updatedAssets
  },

  /**
   * Update targets for multiple assets atomically (strict mode - requires exactly 100%)
   * Used during onboarding to ensure all targets are fully allocated
   * @param userId - The user's ID
   * @param updates - Array of { assetId, targetPercentage } updates to apply
   * @returns Promise<Asset[]> - Array of updated assets in same order as input
   * @throws {AppError} NotFoundError (404) if any assetId doesn't belong to user
   * @throws {AppError} ValidationError (400) if sum does not equal exactly 100%
   */
  async batchUpdateTargetsStrict(
    userId: string,
    updates: Array<{ assetId: string; targetPercentage: number }>
  ) {
    // 1. Verify all assets belong to user
    const assetIds = updates.map(u => u.assetId)
    const userAssets = await prisma.asset.findMany({
      where: { userId, id: { in: assetIds } },
      select: { id: true },
    })

    if (userAssets.length !== assetIds.length) {
      const foundIds = new Set(userAssets.map(a => a.id))
      const missingIds = assetIds.filter(id => !foundIds.has(id))
      throw Errors.notFound(`Assets not found: ${missingIds.join(', ')}`)
    }

    // 2. Calculate sum of new targets
    const sum = updates.reduce((acc, u) => acc + u.targetPercentage, 0)
    const roundedSum = Math.round(sum * 100) / 100

    // 3. Validate sum equals exactly 100%
    if (Math.abs(roundedSum - 100) > 0.01) {
      throw Errors.validation(
        `Targets must sum to 100%`,
        { sum: roundedSum }
      )
    }

    // 4. Atomic update using transaction
    const updatedAssets = await prisma.$transaction(
      updates.map(({ assetId, targetPercentage }) =>
        prisma.asset.update({
          where: { id: assetId },
          data: { targetPercentage },
        })
      )
    )

    return updatedAssets
  },
}
