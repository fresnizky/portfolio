import { prisma } from '@/config/database'

export const portfolioService = {
  /**
   * Get portfolio summary with valuation
   * Returns positions (assets with holdings) and total portfolio value
   * @param userId - The ID of the user
   * @returns Portfolio summary with positions and totalValue
   */
  async getSummary(userId: string) {
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
            targetPercentage: true,
            currentPrice: true,
            priceUpdatedAt: true,
          },
        },
      },
      orderBy: { asset: { ticker: 'asc' } },
    })

    // Calculate positions with values
    const positions = holdings.map(holding => {
      const quantity = Number(holding.quantity)
      const currentPrice = holding.asset.currentPrice
        ? Number(holding.asset.currentPrice)
        : null

      // value = quantity × currentPrice (or 0 if price not set)
      const value =
        currentPrice !== null
          ? Math.round(quantity * currentPrice * 100) / 100
          : 0

      return {
        assetId: holding.asset.id,
        ticker: holding.asset.ticker,
        name: holding.asset.name,
        category: holding.asset.category,
        quantity: holding.quantity.toString(),
        currentPrice: currentPrice !== null ? currentPrice.toFixed(2) : null,
        value: value.toFixed(2),
        targetPercentage: holding.asset.targetPercentage
          ? Number(holding.asset.targetPercentage).toFixed(2)
          : null,
        priceUpdatedAt: holding.asset.priceUpdatedAt,
      }
    })

    // Calculate total portfolio value
    const totalValue = positions.reduce(
      (sum, pos) => sum + parseFloat(pos.value),
      0
    )

    return {
      totalValue: totalValue.toFixed(2),
      positions,
    }
  },
}
