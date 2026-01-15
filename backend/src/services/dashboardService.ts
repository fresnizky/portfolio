import { portfolioService } from './portfolioService'
import { settingsService } from './settingsService'
import { Currency } from '@prisma/client'
import type {
  DashboardResponse,
  DashboardPosition,
  DashboardAlert,
  DashboardThresholds,
} from '@/validations/dashboard'

export interface DashboardOptions {
  thresholds?: Partial<DashboardThresholds>
  displayCurrency?: Currency
}

export const dashboardService = {
  async getDashboard(
    userId: string,
    options?: DashboardOptions
  ): Promise<DashboardResponse> {
    const { thresholds, displayCurrency = 'USD' } = options ?? {}

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
    // Reuse existing portfolioService for base data with displayCurrency
    const summary = await portfolioService.getSummary(userId, displayCurrency)

    const totalValue = parseFloat(summary.totalValue)
    const alerts: DashboardAlert[] = []
    const now = new Date()

    // Add stale exchange rate alert if applicable
    if (summary.exchangeRate?.isStale) {
      alerts.push({
        type: 'stale_price',
        assetId: 'exchange-rate',
        ticker: 'USD/ARS',
        message: 'Exchange rate may be outdated',
        severity: 'warning',
      })
    }

    // Enrich positions with calculated fields
    const positions: DashboardPosition[] = summary.positions.map(pos => {
      const hasPriceSet = pos.priceStatus === 'set'
      const value = hasPriceSet && pos.value !== null ? parseFloat(pos.value) : 0
      const target = pos.targetPercentage !== null ? parseFloat(pos.targetPercentage) : 0

      // Calculate actual percentage of portfolio (only if price is set)
      const actualPercentage = hasPriceSet && totalValue > 0 ? (value / totalValue) * 100 : null

      // Calculate deviation from target (only if price is set and has target)
      const deviation = hasPriceSet && actualPercentage !== null ? actualPercentage - target : null

      // Handle price-related alerts based on price status
      if (hasPriceSet) {
        // Check for stale price alert (only for positions with price)
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

        // Check for rebalance alert (only for positions with target AND price set)
        // AC says "deviates more than", so use > not >=
        if (pos.targetPercentage !== null && deviation !== null && Math.abs(deviation) > effectiveThresholds.deviationPct) {
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
      } else {
        // Price is missing - generate missing_price alert
        alerts.push({
          type: 'missing_price',
          assetId: pos.assetId,
          ticker: pos.ticker,
          message: `Set price for ${pos.ticker}`,
          severity: 'info',
        })
      }

      return {
        assetId: pos.assetId,
        ticker: pos.ticker,
        name: pos.name,
        category: pos.category,
        quantity: pos.quantity,
        currentPrice: pos.currentPrice,
        originalValue: pos.originalValue,
        originalCurrency: pos.originalCurrency,
        value: pos.value,
        displayCurrency: pos.displayCurrency,
        targetPercentage: pos.targetPercentage,
        actualPercentage: actualPercentage !== null ? actualPercentage.toFixed(2) : null,
        deviation: deviation !== null ? deviation.toFixed(2) : null,
        priceStatus: pos.priceStatus,
        priceUpdatedAt: pos.priceUpdatedAt,
        decimalPlaces: pos.decimalPlaces,
      }
    })

    return {
      totalValue: summary.totalValue,
      displayCurrency: summary.displayCurrency,
      exchangeRate: summary.exchangeRate,
      positions,
      alerts,
      ...(summary.excludedCount && { excludedCount: summary.excludedCount }),
    }
  },
}
