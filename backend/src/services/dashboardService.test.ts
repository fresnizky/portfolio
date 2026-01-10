import { describe, it, expect, vi, beforeEach } from 'vitest'
import { dashboardService } from './dashboardService'
import { portfolioService } from './portfolioService'

// Mock portfolioService
vi.mock('./portfolioService', () => ({
  portfolioService: {
    getSummary: vi.fn(),
  },
}))

const userId = 'user-123'

// Helper to create mock position
// Use !== undefined checks to allow explicit null values
const createMockPosition = (overrides: {
  assetId?: string
  ticker?: string
  name?: string
  category?: string
  quantity?: string
  currentPrice?: string | null
  value?: string
  targetPercentage?: string | null
  priceUpdatedAt?: Date | null
} = {}) => ({
  assetId: overrides.assetId !== undefined ? overrides.assetId : 'asset-1',
  ticker: overrides.ticker !== undefined ? overrides.ticker : 'VOO',
  name: overrides.name !== undefined ? overrides.name : 'Vanguard S&P 500 ETF',
  category: overrides.category !== undefined ? overrides.category : 'ETF',
  quantity: overrides.quantity !== undefined ? overrides.quantity : '10',
  currentPrice: overrides.currentPrice !== undefined ? overrides.currentPrice : '450.75',
  value: overrides.value !== undefined ? overrides.value : '4507.50',
  targetPercentage: overrides.targetPercentage !== undefined ? overrides.targetPercentage : '60.00',
  priceUpdatedAt: overrides.priceUpdatedAt !== undefined ? overrides.priceUpdatedAt : new Date('2026-01-09T15:30:00.000Z'),
})

describe('dashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: freeze time to 2026-01-10
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-10T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('getDashboard', () => {
    it('should calculate actualPercentage correctly', async () => {
      vi.mocked(portfolioService.getSummary).mockResolvedValue({
        totalValue: '10000.00',
        positions: [
          createMockPosition({
            assetId: 'asset-1',
            ticker: 'VOO',
            value: '6000.00',
            targetPercentage: '60.00',
          }),
          createMockPosition({
            assetId: 'asset-2',
            ticker: 'GLD',
            value: '4000.00',
            targetPercentage: '40.00',
          }),
        ],
      })

      const result = await dashboardService.getDashboard(userId)

      // VOO: 6000 / 10000 * 100 = 60%
      expect(result.positions[0].actualPercentage).toBe('60.00')
      // GLD: 4000 / 10000 * 100 = 40%
      expect(result.positions[1].actualPercentage).toBe('40.00')
    })

    it('should calculate deviation correctly', async () => {
      vi.mocked(portfolioService.getSummary).mockResolvedValue({
        totalValue: '10000.00',
        positions: [
          createMockPosition({
            assetId: 'asset-1',
            ticker: 'VOO',
            value: '5500.00', // 55% actual
            targetPercentage: '60.00', // 60% target
          }),
          createMockPosition({
            assetId: 'asset-2',
            ticker: 'BTC',
            value: '4500.00', // 45% actual
            targetPercentage: '40.00', // 40% target
          }),
        ],
      })

      const result = await dashboardService.getDashboard(userId)

      // VOO: 55 - 60 = -5
      expect(result.positions[0].deviation).toBe('-5.00')
      // BTC: 45 - 40 = +5
      expect(result.positions[1].deviation).toBe('5.00')
    })

    it('should generate stale_price alert when price > 7 days old', async () => {
      const oldDate = new Date('2026-01-01T10:00:00.000Z') // 9 days ago

      vi.mocked(portfolioService.getSummary).mockResolvedValue({
        totalValue: '10000.00',
        positions: [
          createMockPosition({
            assetId: 'asset-1',
            ticker: 'VOO',
            value: '10000.00',
            targetPercentage: '100.00',
            priceUpdatedAt: oldDate,
          }),
        ],
      })

      const result = await dashboardService.getDashboard(userId)

      expect(result.alerts).toHaveLength(1)
      expect(result.alerts[0]).toEqual({
        type: 'stale_price',
        assetId: 'asset-1',
        ticker: 'VOO',
        message: 'VOO price is 9 days old',
        severity: 'warning',
        data: { daysOld: 9 },
      })
    })

    it('should NOT generate stale_price alert when price is recent', async () => {
      const recentDate = new Date('2026-01-08T10:00:00.000Z') // 2 days ago

      vi.mocked(portfolioService.getSummary).mockResolvedValue({
        totalValue: '10000.00',
        positions: [
          createMockPosition({
            assetId: 'asset-1',
            ticker: 'VOO',
            value: '10000.00',
            targetPercentage: '100.00',
            priceUpdatedAt: recentDate,
          }),
        ],
      })

      const result = await dashboardService.getDashboard(userId)

      const staleAlerts = result.alerts.filter(a => a.type === 'stale_price')
      expect(staleAlerts).toHaveLength(0)
    })

    it('should generate rebalance_needed alert when deviation > 5%', async () => {
      vi.mocked(portfolioService.getSummary).mockResolvedValue({
        totalValue: '10000.00',
        positions: [
          createMockPosition({
            assetId: 'asset-1',
            ticker: 'VOO',
            value: '5400.00', // 54% actual
            targetPercentage: '60.00', // 60% target → -6% deviation
          }),
          createMockPosition({
            assetId: 'asset-2',
            ticker: 'BTC',
            value: '4600.00', // 46% actual
            targetPercentage: '40.00', // 40% target → +6% deviation
          }),
        ],
      })

      const result = await dashboardService.getDashboard(userId)

      const rebalanceAlerts = result.alerts.filter(a => a.type === 'rebalance_needed')
      expect(rebalanceAlerts).toHaveLength(2)

      // VOO underweight
      expect(rebalanceAlerts[0]).toEqual({
        type: 'rebalance_needed',
        assetId: 'asset-1',
        ticker: 'VOO',
        message: 'VOO is 6.0% underweight',
        severity: 'warning',
        data: { deviation: '-6.00', direction: 'underweight' },
      })

      // BTC overweight
      expect(rebalanceAlerts[1]).toEqual({
        type: 'rebalance_needed',
        assetId: 'asset-2',
        ticker: 'BTC',
        message: 'BTC is 6.0% overweight',
        severity: 'warning',
        data: { deviation: '6.00', direction: 'overweight' },
      })
    })

    it('should NOT generate rebalance alert when deviation = threshold exactly', async () => {
      vi.mocked(portfolioService.getSummary).mockResolvedValue({
        totalValue: '10000.00',
        positions: [
          createMockPosition({
            assetId: 'asset-1',
            ticker: 'VOO',
            value: '5500.00', // 55% actual
            targetPercentage: '60.00', // 60% target → exactly -5% deviation
          }),
        ],
      })

      const result = await dashboardService.getDashboard(userId)

      // Exactly 5% deviation should NOT trigger (AC says "more than")
      const rebalanceAlerts = result.alerts.filter(a => a.type === 'rebalance_needed')
      expect(rebalanceAlerts).toHaveLength(0)
    })

    it('should NOT generate rebalance alert when deviation < threshold', async () => {
      vi.mocked(portfolioService.getSummary).mockResolvedValue({
        totalValue: '10000.00',
        positions: [
          createMockPosition({
            assetId: 'asset-1',
            ticker: 'VOO',
            value: '5800.00', // 58% actual
            targetPercentage: '60.00', // 60% target → -2% deviation (below 5%)
          }),
          createMockPosition({
            assetId: 'asset-2',
            ticker: 'BTC',
            value: '4200.00', // 42% actual
            targetPercentage: '40.00', // 40% target → +2% deviation (below 5%)
          }),
        ],
      })

      const result = await dashboardService.getDashboard(userId)

      const rebalanceAlerts = result.alerts.filter(a => a.type === 'rebalance_needed')
      expect(rebalanceAlerts).toHaveLength(0)
    })

    it('should handle empty portfolio (totalValue = 0)', async () => {
      vi.mocked(portfolioService.getSummary).mockResolvedValue({
        totalValue: '0.00',
        positions: [],
      })

      const result = await dashboardService.getDashboard(userId)

      expect(result).toEqual({
        totalValue: '0.00',
        positions: [],
        alerts: [],
      })
    })

    it('should handle positions with zero value (actualPercentage = 0)', async () => {
      vi.mocked(portfolioService.getSummary).mockResolvedValue({
        totalValue: '10000.00',
        positions: [
          createMockPosition({
            assetId: 'asset-1',
            ticker: 'VOO',
            value: '10000.00',
            targetPercentage: '60.00',
          }),
          createMockPosition({
            assetId: 'asset-2',
            ticker: 'CASH',
            value: '0.00',
            currentPrice: null,
            targetPercentage: '40.00',
            priceUpdatedAt: null,
          }),
        ],
      })

      const result = await dashboardService.getDashboard(userId)

      // VOO: 10000 / 10000 = 100%
      expect(result.positions[0].actualPercentage).toBe('100.00')
      expect(result.positions[0].deviation).toBe('40.00') // 100 - 60
      // CASH: 0 / 10000 = 0%
      expect(result.positions[1].actualPercentage).toBe('0.00')
      expect(result.positions[1].deviation).toBe('-40.00') // 0 - 40
    })

    it('should handle assets with null targetPercentage', async () => {
      vi.mocked(portfolioService.getSummary).mockResolvedValue({
        totalValue: '10000.00',
        positions: [
          createMockPosition({
            assetId: 'asset-1',
            ticker: 'VOO',
            value: '10000.00',
            targetPercentage: null,
          }),
        ],
      })

      const result = await dashboardService.getDashboard(userId)

      expect(result.positions[0].actualPercentage).toBe('100.00')
      expect(result.positions[0].deviation).toBe('100.00') // 100 - 0 (null treated as 0)

      // Should NOT generate rebalance alert for null target
      const rebalanceAlerts = result.alerts.filter(a => a.type === 'rebalance_needed')
      expect(rebalanceAlerts).toHaveLength(0)
    })

    it('should respect custom thresholds', async () => {
      const oldDate = new Date('2026-01-07T10:00:00.000Z') // 3 days ago

      vi.mocked(portfolioService.getSummary).mockResolvedValue({
        totalValue: '10000.00',
        positions: [
          createMockPosition({
            assetId: 'asset-1',
            ticker: 'VOO',
            value: '5700.00', // 57% actual, -3% deviation
            targetPercentage: '60.00',
            priceUpdatedAt: oldDate,
          }),
        ],
      })

      // Use lower thresholds: 2% deviation, 2 days stale
      const result = await dashboardService.getDashboard(userId, {
        deviationPct: 2,
        staleDays: 2,
      })

      // Should trigger both alerts with custom thresholds
      expect(result.alerts).toHaveLength(2)

      const staleAlert = result.alerts.find(a => a.type === 'stale_price')
      expect(staleAlert).toBeDefined()
      expect(staleAlert?.data?.daysOld).toBe(3)

      const rebalanceAlert = result.alerts.find(a => a.type === 'rebalance_needed')
      expect(rebalanceAlert).toBeDefined()
    })

    it('should handle price with no timestamp (treat as stale)', async () => {
      vi.mocked(portfolioService.getSummary).mockResolvedValue({
        totalValue: '10000.00',
        positions: [
          createMockPosition({
            assetId: 'asset-1',
            ticker: 'VOO',
            value: '10000.00',
            currentPrice: '450.75',
            targetPercentage: '100.00',
            priceUpdatedAt: null,
          }),
        ],
      })

      const result = await dashboardService.getDashboard(userId)

      const staleAlert = result.alerts.find(a => a.type === 'stale_price')
      expect(staleAlert).toBeDefined()
      expect(staleAlert?.message).toContain('no update date')
    })

    it('should NOT generate stale alert for asset with null price', async () => {
      vi.mocked(portfolioService.getSummary).mockResolvedValue({
        totalValue: '0.00',
        positions: [
          createMockPosition({
            assetId: 'asset-1',
            ticker: 'CASH',
            value: '0.00',
            currentPrice: null,
            targetPercentage: '100.00',
            priceUpdatedAt: null,
          }),
        ],
      })

      const result = await dashboardService.getDashboard(userId)

      const staleAlerts = result.alerts.filter(a => a.type === 'stale_price')
      expect(staleAlerts).toHaveLength(0)
    })

    it('should return totalValue from portfolioService', async () => {
      vi.mocked(portfolioService.getSummary).mockResolvedValue({
        totalValue: '12345.67',
        positions: [],
      })

      const result = await dashboardService.getDashboard(userId)

      expect(result.totalValue).toBe('12345.67')
    })

    it('should call portfolioService.getSummary with correct userId', async () => {
      vi.mocked(portfolioService.getSummary).mockResolvedValue({
        totalValue: '0.00',
        positions: [],
      })

      await dashboardService.getDashboard('user-456')

      expect(portfolioService.getSummary).toHaveBeenCalledWith('user-456')
      expect(portfolioService.getSummary).toHaveBeenCalledTimes(1)
    })

    it('should use default thresholds when not provided', async () => {
      // Price 6 days old (below 7 day default)
      const sixDaysAgo = new Date('2026-01-04T10:00:00.000Z')

      vi.mocked(portfolioService.getSummary).mockResolvedValue({
        totalValue: '10000.00',
        positions: [
          createMockPosition({
            assetId: 'asset-1',
            ticker: 'VOO',
            value: '5600.00', // 56% actual, -4% deviation (below 5% default)
            targetPercentage: '60.00',
            priceUpdatedAt: sixDaysAgo,
          }),
        ],
      })

      const result = await dashboardService.getDashboard(userId)

      // Neither alert should trigger with defaults
      expect(result.alerts).toHaveLength(0)
    })
  })
})
