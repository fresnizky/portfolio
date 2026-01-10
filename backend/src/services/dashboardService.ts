import { portfolioService } from './portfolioService'
import { settingsService } from './settingsService'
import type {
  DashboardResponse,
  DashboardPosition,
  DashboardAlert,
  DashboardThresholds,
} from '@/validations/dashboard'

export const dashboardService = {
  async getDashboard(
    userId: string,
    thresholds?: Partial<DashboardThresholds>
  ): Promise<DashboardResponse> {
    // If thresholds not provided, fetch from user settings
    let effectiveThresholds: DashboardThresholds
    if (thresholds?.deviationPct !== undefined && thresholds?.staleDays !== undefined) {
      effectiveThresholds = thresholds as DashboardThresholds
    } else {
      const settings = await settingsService.getSettings(userId)
      effectiveThresholds = {
        deviationPct: thresholds?.deviationPct ?? parseFloat(settings.rebalanceThreshold),
        staleDays: thresholds?.staleDays ?? settings.priceAlertDays,
      }
    }
    // Reuse existing portfolioService for base data
    const summary = await portfolioService.getSummary(userId)

    const totalValue = parseFloat(summary.totalValue)
    const alerts: DashboardAlert[] = []
    const now = new Date()

    // Enrich positions with calculated fields
    const positions: DashboardPosition[] = summary.positions.map(pos => {
      const value = parseFloat(pos.value)
      const target = pos.targetPercentage !== null ? parseFloat(pos.targetPercentage) : 0

      // Calculate actual percentage of portfolio
      const actualPercentage = totalValue > 0 ? (value / totalValue) * 100 : 0

      // Calculate deviation from target
      const deviation = actualPercentage - target

      // Check for stale price alert
      if (pos.priceUpdatedAt) {
        const daysSinceUpdate = Math.floor(
          (now.getTime() - new Date(pos.priceUpdatedAt).getTime()) / (1000 * 60 * 60 * 24)
        )
        if (daysSinceUpdate >= effectiveThresholds.staleDays) {
          alerts.push({
            type: 'stale_price',
            assetId: pos.assetId,
            ticker: pos.ticker,
            message: `${pos.ticker} price is ${daysSinceUpdate} days old`,
            severity: 'warning',
            data: { daysOld: daysSinceUpdate },
          })
        }
      } else if (pos.currentPrice !== null) {
        // Price exists but no timestamp - treat as stale
        alerts.push({
          type: 'stale_price',
          assetId: pos.assetId,
          ticker: pos.ticker,
          message: `${pos.ticker} price has no update date`,
          severity: 'warning',
        })
      }

      // Check for rebalance alert (only for positions with target)
      // AC says "deviates more than", so use > not >=
      if (pos.targetPercentage !== null && Math.abs(deviation) > effectiveThresholds.deviationPct) {
        const direction = deviation > 0 ? 'overweight' : 'underweight'
        alerts.push({
          type: 'rebalance_needed',
          assetId: pos.assetId,
          ticker: pos.ticker,
          message: `${pos.ticker} is ${Math.abs(deviation).toFixed(1)}% ${direction}`,
          severity: 'warning',
          data: {
            deviation: deviation.toFixed(2),
            direction,
          },
        })
      }

      return {
        assetId: pos.assetId,
        ticker: pos.ticker,
        name: pos.name,
        category: pos.category,
        quantity: pos.quantity,
        currentPrice: pos.currentPrice,
        value: pos.value,
        targetPercentage: pos.targetPercentage,
        actualPercentage: actualPercentage.toFixed(2),
        deviation: deviation.toFixed(2),
        priceUpdatedAt: pos.priceUpdatedAt,
      }
    })

    return {
      totalValue: summary.totalValue,
      positions,
      alerts,
    }
  },
}
