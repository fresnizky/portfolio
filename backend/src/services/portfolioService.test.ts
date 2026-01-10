import { describe, it, expect, vi, beforeEach } from 'vitest'
import { portfolioService } from './portfolioService'
import { prisma } from '@/config/database'
import type { Asset, Holding } from '@prisma/client'

// Mock the database
vi.mock('@/config/database', () => ({
  prisma: {
    holding: {
      findMany: vi.fn(),
    },
  },
}))

// Helper to create mock Prisma Decimal that works with Number()
const createMockDecimal = (value: number) => ({
  toNumber: () => value,
  valueOf: () => value,
  toString: () => String(value),
})

// Type for holding with asset included for portfolio summary
type HoldingWithAssetForSummary = Holding & {
  asset: {
    id: string
    ticker: string
    name: string
    category: string
    targetPercentage: ReturnType<typeof createMockDecimal> | null
    currentPrice: ReturnType<typeof createMockDecimal> | null
    priceUpdatedAt: Date | null
  }
}

const createMockHoldingWithAsset = (
  quantity: number,
  assetOverrides: {
    id?: string
    ticker?: string
    name?: string
    category?: string
    targetPercentage?: number | null
    currentPrice?: number | null
    priceUpdatedAt?: Date | null
  } = {}
): HoldingWithAssetForSummary => ({
  id: `holding-${assetOverrides.id ?? 'default'}`,
  quantity: createMockDecimal(quantity) as unknown as Holding['quantity'],
  userId: 'user-123',
  assetId: assetOverrides.id ?? 'asset-123',
  createdAt: new Date(),
  updatedAt: new Date(),
  asset: {
    id: assetOverrides.id ?? 'asset-123',
    ticker: assetOverrides.ticker ?? 'VOO',
    name: assetOverrides.name ?? 'Vanguard S&P 500 ETF',
    category: assetOverrides.category ?? 'ETF',
    targetPercentage:
      assetOverrides.targetPercentage !== undefined
        ? assetOverrides.targetPercentage !== null
          ? createMockDecimal(assetOverrides.targetPercentage)
          : null
        : createMockDecimal(50),
    currentPrice:
      assetOverrides.currentPrice !== undefined
        ? assetOverrides.currentPrice !== null
          ? createMockDecimal(assetOverrides.currentPrice)
          : null
        : createMockDecimal(450.75),
    priceUpdatedAt: assetOverrides.priceUpdatedAt ?? new Date('2026-01-09T15:30:00.000Z'),
  },
})

const userId = 'user-123'

describe('portfolioService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getSummary', () => {
    it('should return empty portfolio when user has no holdings', async () => {
      vi.mocked(prisma.holding.findMany).mockResolvedValue([])

      const result = await portfolioService.getSummary(userId)

      expect(result).toEqual({
        totalValue: '0.00',
        positions: [],
      })
    })

    it('should calculate value = quantity × currentPrice correctly', async () => {
      const mockHoldings = [
        createMockHoldingWithAsset(10, {
          id: 'asset-1',
          ticker: 'VOO',
          currentPrice: 450.75,
        }),
      ]

      vi.mocked(prisma.holding.findMany).mockResolvedValue(mockHoldings)

      const result = await portfolioService.getSummary(userId)

      // 10 × 450.75 = 4507.50
      expect(result.positions[0].value).toBe('4507.50')
    })

    it('should return value = 0 when currentPrice is null', async () => {
      const mockHoldings = [
        createMockHoldingWithAsset(10, {
          id: 'asset-1',
          ticker: 'CASH',
          currentPrice: null,
          priceUpdatedAt: null,
        }),
      ]

      vi.mocked(prisma.holding.findMany).mockResolvedValue(mockHoldings)

      const result = await portfolioService.getSummary(userId)

      expect(result.positions[0].value).toBe('0.00')
      expect(result.positions[0].currentPrice).toBeNull()
    })

    it('should calculate totalValue as sum of all position values', async () => {
      const mockHoldings = [
        createMockHoldingWithAsset(10, {
          id: 'asset-1',
          ticker: 'VOO',
          currentPrice: 450.75,
        }),
        createMockHoldingWithAsset(50, {
          id: 'asset-2',
          ticker: 'GLD',
          name: 'SPDR Gold Trust',
          currentPrice: 85.30,
        }),
        createMockHoldingWithAsset(0.03, {
          id: 'asset-3',
          ticker: 'BTC',
          name: 'Bitcoin',
          category: 'CRYPTO',
          currentPrice: 42000.00,
        }),
      ]

      vi.mocked(prisma.holding.findMany).mockResolvedValue(mockHoldings)

      const result = await portfolioService.getSummary(userId)

      // VOO: 10 × 450.75 = 4507.50
      // GLD: 50 × 85.30 = 4265.00
      // BTC: 0.03 × 42000 = 1260.00
      // Total: 4507.50 + 4265.00 + 1260.00 = 10032.50
      expect(result.totalValue).toBe('10032.50')
    })

    it('should include all asset details in positions', async () => {
      const priceUpdatedAt = new Date('2026-01-09T15:30:00.000Z')
      const mockHoldings = [
        createMockHoldingWithAsset(10.5, {
          id: 'asset-1',
          ticker: 'VOO',
          name: 'Vanguard S&P 500 ETF',
          category: 'ETF',
          targetPercentage: 60,
          currentPrice: 450.75,
          priceUpdatedAt,
        }),
      ]

      vi.mocked(prisma.holding.findMany).mockResolvedValue(mockHoldings)

      const result = await portfolioService.getSummary(userId)

      expect(result.positions[0]).toEqual({
        assetId: 'asset-1',
        ticker: 'VOO',
        name: 'Vanguard S&P 500 ETF',
        category: 'ETF',
        quantity: '10.5',
        currentPrice: '450.75',
        value: '4732.88',
        targetPercentage: '60.00',
        priceUpdatedAt,
      })
    })

    it('should include priceUpdatedAt timestamp', async () => {
      const priceUpdatedAt = new Date('2026-01-09T15:30:00.000Z')
      const mockHoldings = [
        createMockHoldingWithAsset(10, {
          id: 'asset-1',
          priceUpdatedAt,
        }),
      ]

      vi.mocked(prisma.holding.findMany).mockResolvedValue(mockHoldings)

      const result = await portfolioService.getSummary(userId)

      expect(result.positions[0].priceUpdatedAt).toEqual(priceUpdatedAt)
    })

    it('should handle null targetPercentage', async () => {
      const mockHoldings = [
        createMockHoldingWithAsset(10, {
          id: 'asset-1',
          ticker: 'VOO',
          targetPercentage: null,
          currentPrice: 100,
        }),
      ]

      vi.mocked(prisma.holding.findMany).mockResolvedValue(mockHoldings)

      const result = await portfolioService.getSummary(userId)

      expect(result.positions[0].targetPercentage).toBeNull()
    })

    it('should round values to 2 decimal places', async () => {
      // 10.333 × 33.333 = 344.429489 → should round to 344.43
      const mockHoldings = [
        createMockHoldingWithAsset(10.333, {
          id: 'asset-1',
          ticker: 'TEST',
          currentPrice: 33.333,
        }),
      ]

      vi.mocked(prisma.holding.findMany).mockResolvedValue(mockHoldings)

      const result = await portfolioService.getSummary(userId)

      // Math.round(10.333 * 33.333 * 100) / 100 = 344.43
      expect(result.positions[0].value).toBe('344.43')
    })

    it('should format quantity as string', async () => {
      const mockHoldings = [
        createMockHoldingWithAsset(0.00012345, {
          id: 'asset-1',
          ticker: 'BTC',
          category: 'CRYPTO',
          currentPrice: 42000,
        }),
      ]

      vi.mocked(prisma.holding.findMany).mockResolvedValue(mockHoldings)

      const result = await portfolioService.getSummary(userId)

      expect(result.positions[0].quantity).toBe('0.00012345')
    })

    it('should call prisma with correct parameters', async () => {
      vi.mocked(prisma.holding.findMany).mockResolvedValue([])

      await portfolioService.getSummary(userId)

      expect(prisma.holding.findMany).toHaveBeenCalledWith({
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
    })

    it('should order positions by ticker alphabetically', async () => {
      const mockHoldings = [
        createMockHoldingWithAsset(10, { id: 'asset-1', ticker: 'ZZZ' }),
        createMockHoldingWithAsset(10, { id: 'asset-2', ticker: 'AAA' }),
        createMockHoldingWithAsset(10, { id: 'asset-3', ticker: 'MMM' }),
      ]

      vi.mocked(prisma.holding.findMany).mockResolvedValue(mockHoldings)

      await portfolioService.getSummary(userId)

      expect(prisma.holding.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { asset: { ticker: 'asc' } },
        })
      )
    })

    it('should handle mixed positions with and without prices', async () => {
      const mockHoldings = [
        createMockHoldingWithAsset(10, {
          id: 'asset-1',
          ticker: 'VOO',
          currentPrice: 450.75,
        }),
        createMockHoldingWithAsset(1000, {
          id: 'asset-2',
          ticker: 'CASH',
          currentPrice: null,
          priceUpdatedAt: null,
        }),
      ]

      vi.mocked(prisma.holding.findMany).mockResolvedValue(mockHoldings)

      const result = await portfolioService.getSummary(userId)

      expect(result.positions).toHaveLength(2)
      expect(result.positions[0].value).toBe('4507.50')
      expect(result.positions[1].value).toBe('0.00')
      // Total should only include priced position
      expect(result.totalValue).toBe('4507.50')
    })
  })
})
