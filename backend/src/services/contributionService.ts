import { prisma } from '@/config/database'
import { Errors } from '@/lib/errors'
import type { ContributionSuggestion, ContributionAllocation } from '@/validations/contribution'

// How aggressively to adjust allocations based on deviations (0-1)
// 0.5 = moderate correction, not extreme
const ADJUSTMENT_FACTOR = 0.5

// Threshold for considering an asset underweight/overweight (in percentage points)
const DEVIATION_THRESHOLD = 1

export const contributionService = {
  /**
   * Calculate contribution allocation suggestion based on targets and current deviations
   * @param userId - The user ID
   * @param amount - The contribution amount
   * @returns Contribution suggestion with allocations per asset
   */
  async getSuggestion(userId: string, amount: number): Promise<ContributionSuggestion> {
    // 1. Get user's assets with holdings
    const assets = await prisma.asset.findMany({
      where: { userId },
      include: { holding: true },
      orderBy: { ticker: 'asc' },
    })

    // 2. Validate: must have assets configured (AC #4)
    if (assets.length === 0) {
      throw Errors.validation('No assets configured. Add assets before requesting contribution suggestions.')
    }

    // 3. Validate: targets must sum to 100% (AC #5)
    const targetSum = assets.reduce((sum, a) => sum + Number(a.targetPercentage), 0)
    if (Math.abs(targetSum - 100) > 0.01) {
      throw Errors.validation('Targets must sum to 100%', { currentSum: targetSum.toFixed(2) })
    }

    // 4. Calculate current portfolio state
    let totalValue = 0
    const assetValues: Map<string, number> = new Map()

    for (const asset of assets) {
      const currentPrice = asset.currentPrice !== null ? Number(asset.currentPrice) : null
      const quantity = asset.holding ? Number(asset.holding.quantity) : 0

      if (currentPrice !== null && quantity > 0) {
        const value = quantity * currentPrice
        assetValues.set(asset.id, value)
        totalValue += value
      } else {
        assetValues.set(asset.id, 0)
      }
    }

    // 5. Calculate allocations with deviation adjustment
    const allocations: ContributionAllocation[] = []

    // First pass: calculate base allocations and deviations
    interface DeviationInfo {
      assetId: string
      deviation: number
      baseAlloc: number
      target: number
    }
    const deviations: DeviationInfo[] = []

    for (const asset of assets) {
      const target = Number(asset.targetPercentage)
      const baseAlloc = (target / 100) * amount

      const value = assetValues.get(asset.id) ?? 0
      const actual = totalValue > 0 ? (value / totalValue) * 100 : 0
      const deviation = actual - target

      deviations.push({ assetId: asset.id, deviation, baseAlloc, target })
    }

    // Second pass: calculate adjusted allocations
    let totalAdjusted = 0
    const rawAllocations: Array<{
      asset: typeof assets[0]
      target: number
      actual: number | null
      deviation: number | null
      baseAlloc: number
      adjustedAlloc: number
      adjustmentReason: 'underweight' | 'overweight' | null
    }> = []

    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i]
      const { deviation, baseAlloc, target } = deviations[i]

      const value = assetValues.get(asset.id) ?? 0
      const actual = totalValue > 0 ? (value / totalValue) * 100 : null

      // Adjust allocation based on deviation
      // Underweight (negative deviation) → positive adjustment (give more)
      // Overweight (positive deviation) → negative adjustment (give less)
      const adjustment = -deviation * ADJUSTMENT_FACTOR * (amount / 100)
      const adjustedAlloc = Math.max(0, baseAlloc + adjustment)

      // Determine adjustment reason
      let adjustmentReason: 'underweight' | 'overweight' | null = null
      if (actual !== null) {
        if (deviation < -DEVIATION_THRESHOLD) adjustmentReason = 'underweight'
        else if (deviation > DEVIATION_THRESHOLD) adjustmentReason = 'overweight'
      }

      totalAdjusted += adjustedAlloc

      rawAllocations.push({
        asset,
        target,
        actual,
        deviation: actual !== null ? deviation : null,
        baseAlloc,
        adjustedAlloc,
        adjustmentReason,
      })
    }

    // 6. Normalize to ensure total equals input amount exactly
    const ratio = totalAdjusted > 0 ? amount / totalAdjusted : 1

    for (const raw of rawAllocations) {
      const normalizedAdjusted = raw.adjustedAlloc * ratio

      allocations.push({
        assetId: raw.asset.id,
        ticker: raw.asset.ticker,
        name: raw.asset.name,
        targetPercentage: raw.target.toFixed(2),
        actualPercentage: raw.actual !== null ? raw.actual.toFixed(2) : null,
        deviation: raw.deviation !== null ? raw.deviation.toFixed(2) : null,
        baseAllocation: raw.baseAlloc.toFixed(2),
        adjustedAllocation: normalizedAdjusted.toFixed(2),
        adjustmentReason: raw.adjustmentReason,
      })
    }

    // 7. Build summary
    const summary = {
      totalAdjusted: amount.toFixed(2),
      underweightCount: allocations.filter(a => a.adjustmentReason === 'underweight').length,
      overweightCount: allocations.filter(a => a.adjustmentReason === 'overweight').length,
      balancedCount: allocations.filter(a => a.adjustmentReason === null).length,
    }

    return {
      amount: amount.toFixed(2),
      displayCurrency: 'USD',
      allocations,
      summary,
    }
  },
}
