import { prisma } from '@/config/database'
import { Currency } from '@prisma/client'
import { exchangeRateService } from './exchangeRateService'

export interface ExchangeRateInfo {
  usdToArs: number
  fetchedAt: string
  isStale: boolean
}

export const portfolioService = {
  /**
   * Get portfolio summary with valuation
   * Returns positions (assets with holdings) and total portfolio value
   * Supports multi-currency conversion to a display currency
   * @param userId - The ID of the user
   * @param displayCurrency - Currency to display values in (default: USD)
   * @returns Portfolio summary with positions and totalValue in display currency
   */
  async getSummary(userId: string, displayCurrency: Currency = 'USD') {
    // Get all holdings with asset details
    const holdings = await prisma.holding.findMany({
      where: { userId },
      include: {
        asset: {
          select: {
            id: true,
            ticker: true,
            name: true,
            category: true,
            currency: true,
            targetPercentage: true,
            currentPrice: true,
            priceUpdatedAt: true,
          },
        },
      },
      orderBy: { asset: { ticker: 'asc' } },
    })

    // Check if we have mixed currencies
    const hasMixedCurrencies = holdings.some(
      h => h.asset.currency !== displayCurrency
    )

    // Only fetch exchange rate if we have mixed currencies
    let exchangeRateInfo: ExchangeRateInfo | null = null
    if (hasMixedCurrencies) {
      try {
        const { rate, fetchedAt, isStale } = await exchangeRateService.getRate('USD', 'ARS')
        exchangeRateInfo = { usdToArs: rate, fetchedAt: fetchedAt.toISOString(), isStale }
      } catch {
        // If exchange rate fails and we have mixed currencies, we can't convert
        // Return values in original currencies with a warning
        exchangeRateInfo = null
      }
    }

    // Calculate positions with values
    const positions = await Promise.all(
      holdings.map(async holding => {
        const quantity = holding.quantity.toNumber()
        const currentPrice = holding.asset.currentPrice?.toNumber() ?? null
        const assetCurrency = holding.asset.currency

        // value = quantity × currentPrice (or 0 if price not set)
        const originalValue =
          currentPrice !== null
            ? Math.round(quantity * currentPrice * 100) / 100
            : 0

        // Convert to display currency if needed
        let displayValue = originalValue
        if (assetCurrency !== displayCurrency && exchangeRateInfo && originalValue > 0) {
          const { converted } = await exchangeRateService.convert(
            originalValue,
            assetCurrency,
            displayCurrency
          )
          displayValue = Math.round(converted * 100) / 100
        }

        return {
          assetId: holding.asset.id,
          ticker: holding.asset.ticker,
          name: holding.asset.name,
          category: holding.asset.category,
          quantity: holding.quantity.toString(),
          currentPrice: currentPrice !== null ? currentPrice.toFixed(2) : null,
          originalValue: originalValue.toFixed(2),
          originalCurrency: assetCurrency,
          value: displayValue.toFixed(2),
          displayCurrency,
          targetPercentage: holding.asset.targetPercentage
            ? Number(holding.asset.targetPercentage).toFixed(2)
            : null,
          priceUpdatedAt: holding.asset.priceUpdatedAt,
        }
      })
    )

    // Calculate total portfolio value in display currency
    const totalValue = positions.reduce(
      (sum, pos) => sum + parseFloat(pos.value),
      0
    )

    return {
      totalValue: totalValue.toFixed(2),
      displayCurrency,
      exchangeRate: exchangeRateInfo,
      positions,
    }
  },
}
