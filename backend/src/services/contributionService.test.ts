import { describe, it, expect, vi, beforeEach } from 'vitest'
import { contributionService } from './contributionService'
import { prisma } from '@/config/database'
import { AppError } from '@/lib/errors'
import type { Asset, Holding } from '@prisma/client'

// Mock the database
vi.mock('@/config/database', () => ({
  prisma: {
    asset: {
      findMany: vi.fn(),
    },
  },
}))

// Helper to create mock Prisma Decimal
const createMockDecimal = (value: number) => ({
  toNumber: () => value,
  valueOf: () => value,
  toString: () => String(value),
})

// Reusable mock asset factory with holding
const createMockAssetWithHolding = (overrides: {
  id?: string
  ticker?: string
  name?: string
  targetPercentage?: number
  currentPrice?: number | null
  quantity?: number
}) => ({
  id: overrides.id ?? 'asset-123',
  ticker: overrides.ticker ?? 'VOO',
  name: overrides.name ?? 'Vanguard S&P 500 ETF',
  category: 'ETF',
  targetPercentage: createMockDecimal(overrides.targetPercentage ?? 0),
  currentPrice: overrides.currentPrice !== undefined
    ? overrides.currentPrice !== null ? createMockDecimal(overrides.currentPrice) : null
    : createMockDecimal(100),
  priceUpdatedAt: new Date(),
  userId: 'user-123',
  currency: 'USD',
  decimalPlaces: 2,
  createdAt: new Date(),
  updatedAt: new Date(),
  holding: overrides.quantity !== undefined ? {
    id: `holding-${overrides.id ?? 'asset-123'}`,
    quantity: createMockDecimal(overrides.quantity),
    userId: 'user-123',
    assetId: overrides.id ?? 'asset-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  } : null,
})

const userId = 'user-123'

describe('contributionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getSuggestion', () => {
    describe('base allocation calculation (AC #1)', () => {
      it('calculates base allocation from targets with 3 assets', async () => {
        const mockAssets = [
          createMockAssetWithHolding({ id: 'a1', ticker: 'VOO', targetPercentage: 60, currentPrice: 450, quantity: 10 }),
          createMockAssetWithHolding({ id: 'a2', ticker: 'GLD', targetPercentage: 20, currentPrice: 180, quantity: 10 }),
          createMockAssetWithHolding({ id: 'a3', ticker: 'BTC', targetPercentage: 20, currentPrice: 50000, quantity: 0.1 }),
        ]

        vi.mocked(prisma.asset.findMany).mockResolvedValue(mockAssets as unknown as Asset[])

        const result = await contributionService.getSuggestion(userId, 1000)

        expect(result.amount).toBe('1000.00')
        expect(result.allocations).toHaveLength(3)

        // Base allocations: 60% of 1000 = 600, 20% = 200, 20% = 200
        const voo = result.allocations.find(a => a.ticker === 'VOO')
        const gld = result.allocations.find(a => a.ticker === 'GLD')
        const btc = result.allocations.find(a => a.ticker === 'BTC')

        expect(parseFloat(voo!.baseAllocation)).toBe(600)
        expect(parseFloat(gld!.baseAllocation)).toBe(200)
        expect(parseFloat(btc!.baseAllocation)).toBe(200)
      })

      it('returns suggestion with displayCurrency USD', async () => {
        const mockAssets = [
          createMockAssetWithHolding({ id: 'a1', ticker: 'VOO', targetPercentage: 100, currentPrice: 450, quantity: 10 }),
        ]

        vi.mocked(prisma.asset.findMany).mockResolvedValue(mockAssets as unknown as Asset[])

        const result = await contributionService.getSuggestion(userId, 1000)

        expect(result.displayCurrency).toBe('USD')
      })

      it('returns allocations sorted by ticker', async () => {
        // Mock returns assets in ticker asc order (as the query would)
        const mockAssets = [
          createMockAssetWithHolding({ id: 'a2', ticker: 'BTC', targetPercentage: 30, currentPrice: 50000, quantity: 0.1 }),
          createMockAssetWithHolding({ id: 'a3', ticker: 'GLD', targetPercentage: 20, currentPrice: 180, quantity: 10 }),
          createMockAssetWithHolding({ id: 'a1', ticker: 'VOO', targetPercentage: 50, currentPrice: 450, quantity: 10 }),
        ]

        vi.mocked(prisma.asset.findMany).mockResolvedValue(mockAssets as unknown as Asset[])

        const result = await contributionService.getSuggestion(userId, 1000)

        // Assets should be in order from query (by ticker asc)
        expect(result.allocations[0].ticker).toBe('BTC')
        expect(result.allocations[1].ticker).toBe('GLD')
        expect(result.allocations[2].ticker).toBe('VOO')
      })
    })

    describe('deviation adjustment (AC #2, #3)', () => {
      it('adjusts allocation for underweight assets (gives more)', async () => {
        // Setup: VOO is underweight, BTC is overweight
        // Total value = $4500 (VOO) + $1800 (GLD) + $5000 (BTC) = $11300
        // VOO: actual = 39.8%, target = 60% → deviation = -20.2% (underweight)
        // GLD: actual = 15.9%, target = 20% → deviation = -4.1% (underweight)
        // BTC: actual = 44.2%, target = 20% → deviation = +24.2% (overweight)
        const mockAssets = [
          createMockAssetWithHolding({ id: 'a1', ticker: 'VOO', targetPercentage: 60, currentPrice: 450, quantity: 10 }),
          createMockAssetWithHolding({ id: 'a2', ticker: 'GLD', targetPercentage: 20, currentPrice: 180, quantity: 10 }),
          createMockAssetWithHolding({ id: 'a3', ticker: 'BTC', targetPercentage: 20, currentPrice: 50000, quantity: 0.1 }),
        ]

        vi.mocked(prisma.asset.findMany).mockResolvedValue(mockAssets as unknown as Asset[])

        const result = await contributionService.getSuggestion(userId, 1000)

        const voo = result.allocations.find(a => a.ticker === 'VOO')
        const btc = result.allocations.find(a => a.ticker === 'BTC')

        // VOO is underweight, should get MORE than base allocation
        expect(parseFloat(voo!.adjustedAllocation)).toBeGreaterThan(parseFloat(voo!.baseAllocation))
        expect(voo!.adjustmentReason).toBe('underweight')

        // BTC is overweight, should get LESS than base allocation
        expect(parseFloat(btc!.adjustedAllocation)).toBeLessThan(parseFloat(btc!.baseAllocation))
        expect(btc!.adjustmentReason).toBe('overweight')
      })

      it('marks balanced assets with null adjustmentReason', async () => {
        // Setup: All assets at target (perfectly balanced)
        // Total value = $6000 (VOO) + $2000 (GLD) + $2000 (BTC) = $10000
        // VOO: actual = 60%, target = 60% → deviation = 0%
        // GLD: actual = 20%, target = 20% → deviation = 0%
        // BTC: actual = 20%, target = 20% → deviation = 0%
        const mockAssets = [
          createMockAssetWithHolding({ id: 'a1', ticker: 'VOO', targetPercentage: 60, currentPrice: 600, quantity: 10 }),
          createMockAssetWithHolding({ id: 'a2', ticker: 'GLD', targetPercentage: 20, currentPrice: 200, quantity: 10 }),
          createMockAssetWithHolding({ id: 'a3', ticker: 'BTC', targetPercentage: 20, currentPrice: 200, quantity: 10 }),
        ]

        vi.mocked(prisma.asset.findMany).mockResolvedValue(mockAssets as unknown as Asset[])

        const result = await contributionService.getSuggestion(userId, 1000)

        // All assets are balanced (deviation < 1%)
        result.allocations.forEach(alloc => {
          expect(alloc.adjustmentReason).toBeNull()
        })
      })

      it('adjusts exactly as per AC #3 example: VOO underweight, BTC overweight', async () => {
        // AC #3: VOO is 5% underweight, BTC is 5% overweight
        // VOO should get MORE than $600, BTC should get LESS than $200

        // Setup values to get exactly 5% deviation:
        // Total value = $5500 (VOO) + $2000 (GLD) + $2500 (BTC) = $10000
        // VOO: actual = 55%, target = 60% → deviation = -5% (underweight)
        // GLD: actual = 20%, target = 20% → deviation = 0% (balanced)
        // BTC: actual = 25%, target = 20% → deviation = +5% (overweight)
        const mockAssets = [
          createMockAssetWithHolding({ id: 'a1', ticker: 'VOO', targetPercentage: 60, currentPrice: 550, quantity: 10 }),
          createMockAssetWithHolding({ id: 'a2', ticker: 'GLD', targetPercentage: 20, currentPrice: 200, quantity: 10 }),
          createMockAssetWithHolding({ id: 'a3', ticker: 'BTC', targetPercentage: 20, currentPrice: 250, quantity: 10 }),
        ]

        vi.mocked(prisma.asset.findMany).mockResolvedValue(mockAssets as unknown as Asset[])

        const result = await contributionService.getSuggestion(userId, 1000)

        const voo = result.allocations.find(a => a.ticker === 'VOO')
        const btc = result.allocations.find(a => a.ticker === 'BTC')

        // Per AC #3: VOO should get more than $600
        expect(parseFloat(voo!.adjustedAllocation)).toBeGreaterThan(600)

        // Per AC #3: BTC should get less than $200
        expect(parseFloat(btc!.adjustedAllocation)).toBeLessThan(200)
      })

      it('ensures total adjusted allocation equals input amount', async () => {
        const mockAssets = [
          createMockAssetWithHolding({ id: 'a1', ticker: 'VOO', targetPercentage: 60, currentPrice: 450, quantity: 10 }),
          createMockAssetWithHolding({ id: 'a2', ticker: 'GLD', targetPercentage: 20, currentPrice: 180, quantity: 10 }),
          createMockAssetWithHolding({ id: 'a3', ticker: 'BTC', targetPercentage: 20, currentPrice: 50000, quantity: 0.1 }),
        ]

        vi.mocked(prisma.asset.findMany).mockResolvedValue(mockAssets as unknown as Asset[])

        const result = await contributionService.getSuggestion(userId, 1000)

        const totalAdjusted = result.allocations.reduce(
          (sum, a) => sum + parseFloat(a.adjustedAllocation),
          0
        )

        // Total should equal input amount (allowing for small rounding)
        expect(totalAdjusted).toBeCloseTo(1000, 1)
        expect(result.summary.totalAdjusted).toBe('1000.00')
      })
    })

    describe('summary calculation', () => {
      it('returns correct summary counts', async () => {
        // Setup: 1 underweight, 1 overweight, 1 balanced
        const mockAssets = [
          createMockAssetWithHolding({ id: 'a1', ticker: 'VOO', targetPercentage: 60, currentPrice: 550, quantity: 10 }),
          createMockAssetWithHolding({ id: 'a2', ticker: 'GLD', targetPercentage: 20, currentPrice: 200, quantity: 10 }),
          createMockAssetWithHolding({ id: 'a3', ticker: 'BTC', targetPercentage: 20, currentPrice: 250, quantity: 10 }),
        ]

        vi.mocked(prisma.asset.findMany).mockResolvedValue(mockAssets as unknown as Asset[])

        const result = await contributionService.getSuggestion(userId, 1000)

        expect(result.summary.underweightCount).toBe(1)
        expect(result.summary.overweightCount).toBe(1)
        expect(result.summary.balancedCount).toBe(1)
      })

      it('returns all balanced when assets are at target', async () => {
        const mockAssets = [
          createMockAssetWithHolding({ id: 'a1', ticker: 'VOO', targetPercentage: 60, currentPrice: 600, quantity: 10 }),
          createMockAssetWithHolding({ id: 'a2', ticker: 'GLD', targetPercentage: 20, currentPrice: 200, quantity: 10 }),
          createMockAssetWithHolding({ id: 'a3', ticker: 'BTC', targetPercentage: 20, currentPrice: 200, quantity: 10 }),
        ]

        vi.mocked(prisma.asset.findMany).mockResolvedValue(mockAssets as unknown as Asset[])

        const result = await contributionService.getSuggestion(userId, 1000)

        expect(result.summary.underweightCount).toBe(0)
        expect(result.summary.overweightCount).toBe(0)
        expect(result.summary.balancedCount).toBe(3)
      })
    })

    describe('error cases (AC #4, #5)', () => {
      it('throws validation error when no assets configured (AC #4)', async () => {
        vi.mocked(prisma.asset.findMany).mockResolvedValue([])

        await expect(contributionService.getSuggestion(userId, 1000)).rejects.toThrow(AppError)
        await expect(contributionService.getSuggestion(userId, 1000)).rejects.toMatchObject({
          statusCode: 400,
          code: 'VALIDATION_ERROR',
        })
      })

      it('error message mentions assets must be configured (AC #4)', async () => {
        vi.mocked(prisma.asset.findMany).mockResolvedValue([])

        try {
          await contributionService.getSuggestion(userId, 1000)
        } catch (error: unknown) {
          const appError = error as AppError
          expect(appError.message.toLowerCase()).toContain('asset')
        }
      })

      it('throws validation error when targets do not sum to 100% (AC #5)', async () => {
        const mockAssets = [
          createMockAssetWithHolding({ id: 'a1', ticker: 'VOO', targetPercentage: 50, currentPrice: 450, quantity: 10 }),
          createMockAssetWithHolding({ id: 'a2', ticker: 'GLD', targetPercentage: 30, currentPrice: 180, quantity: 10 }),
          // Total = 80%, missing 20%
        ]

        vi.mocked(prisma.asset.findMany).mockResolvedValue(mockAssets as unknown as Asset[])

        await expect(contributionService.getSuggestion(userId, 1000)).rejects.toThrow(AppError)
        await expect(contributionService.getSuggestion(userId, 1000)).rejects.toMatchObject({
          statusCode: 400,
          code: 'VALIDATION_ERROR',
        })
      })

      it('error includes current sum when targets != 100% (AC #5)', async () => {
        const mockAssets = [
          createMockAssetWithHolding({ id: 'a1', ticker: 'VOO', targetPercentage: 50, currentPrice: 450, quantity: 10 }),
          createMockAssetWithHolding({ id: 'a2', ticker: 'GLD', targetPercentage: 35, currentPrice: 180, quantity: 10 }),
          // Total = 85%
        ]

        vi.mocked(prisma.asset.findMany).mockResolvedValue(mockAssets as unknown as Asset[])

        try {
          await contributionService.getSuggestion(userId, 1000)
        } catch (error: unknown) {
          const appError = error as AppError
          expect(appError.details).toHaveProperty('currentSum', '85.00')
        }
      })
    })

    describe('edge cases', () => {
      it('handles single asset at 100% target', async () => {
        const mockAssets = [
          createMockAssetWithHolding({ id: 'a1', ticker: 'VOO', targetPercentage: 100, currentPrice: 450, quantity: 10 }),
        ]

        vi.mocked(prisma.asset.findMany).mockResolvedValue(mockAssets as unknown as Asset[])

        const result = await contributionService.getSuggestion(userId, 1000)

        expect(result.allocations).toHaveLength(1)
        expect(parseFloat(result.allocations[0].baseAllocation)).toBe(1000)
        expect(parseFloat(result.allocations[0].adjustedAllocation)).toBe(1000)
      })

      it('handles assets without holdings (new assets)', async () => {
        const mockAssets = [
          createMockAssetWithHolding({ id: 'a1', ticker: 'VOO', targetPercentage: 60, currentPrice: 450, quantity: 0 }),
          createMockAssetWithHolding({ id: 'a2', ticker: 'GLD', targetPercentage: 40, currentPrice: 180, quantity: 0 }),
        ]

        vi.mocked(prisma.asset.findMany).mockResolvedValue(mockAssets as unknown as Asset[])

        const result = await contributionService.getSuggestion(userId, 1000)

        // With no holdings (totalValue = 0), should use base allocation
        expect(parseFloat(result.allocations[0].baseAllocation)).toBe(600)
        expect(parseFloat(result.allocations[1].baseAllocation)).toBe(400)
      })

      it('handles assets without current price', async () => {
        const mockAssets = [
          createMockAssetWithHolding({ id: 'a1', ticker: 'VOO', targetPercentage: 60, currentPrice: null, quantity: 10 }),
          createMockAssetWithHolding({ id: 'a2', ticker: 'GLD', targetPercentage: 40, currentPrice: null, quantity: 10 }),
        ]

        vi.mocked(prisma.asset.findMany).mockResolvedValue(mockAssets as unknown as Asset[])

        const result = await contributionService.getSuggestion(userId, 1000)

        // Without prices, actual % is 0, so just use base allocation
        expect(parseFloat(result.allocations[0].baseAllocation)).toBe(600)
        expect(parseFloat(result.allocations[1].baseAllocation)).toBe(400)
        expect(result.allocations[0].actualPercentage).toBeNull()
        expect(result.allocations[1].actualPercentage).toBeNull()
      })

      it('handles very small contribution amount ($1)', async () => {
        const mockAssets = [
          createMockAssetWithHolding({ id: 'a1', ticker: 'VOO', targetPercentage: 60, currentPrice: 450, quantity: 10 }),
          createMockAssetWithHolding({ id: 'a2', ticker: 'GLD', targetPercentage: 20, currentPrice: 180, quantity: 10 }),
          createMockAssetWithHolding({ id: 'a3', ticker: 'BTC', targetPercentage: 20, currentPrice: 180, quantity: 10 }),
        ]

        vi.mocked(prisma.asset.findMany).mockResolvedValue(mockAssets as unknown as Asset[])

        const result = await contributionService.getSuggestion(userId, 1)

        expect(result.amount).toBe('1.00')
        const total = result.allocations.reduce((sum, a) => sum + parseFloat(a.adjustedAllocation), 0)
        expect(total).toBeCloseTo(1, 1)
      })

      it('handles decimal contribution amount ($123.45)', async () => {
        const mockAssets = [
          createMockAssetWithHolding({ id: 'a1', ticker: 'VOO', targetPercentage: 100, currentPrice: 450, quantity: 10 }),
        ]

        vi.mocked(prisma.asset.findMany).mockResolvedValue(mockAssets as unknown as Asset[])

        const result = await contributionService.getSuggestion(userId, 123.45)

        expect(result.amount).toBe('123.45')
        expect(parseFloat(result.allocations[0].adjustedAllocation)).toBeCloseTo(123.45, 2)
      })

      it('handles targets that sum to exactly 100 with decimals', async () => {
        const mockAssets = [
          createMockAssetWithHolding({ id: 'a1', ticker: 'VOO', targetPercentage: 33.33, currentPrice: 450, quantity: 10 }),
          createMockAssetWithHolding({ id: 'a2', ticker: 'GLD', targetPercentage: 33.33, currentPrice: 180, quantity: 10 }),
          createMockAssetWithHolding({ id: 'a3', ticker: 'BTC', targetPercentage: 33.34, currentPrice: 180, quantity: 10 }),
        ]

        vi.mocked(prisma.asset.findMany).mockResolvedValue(mockAssets as unknown as Asset[])

        const result = await contributionService.getSuggestion(userId, 1000)

        expect(result.allocations).toHaveLength(3)
        // Should not throw, 33.33 + 33.33 + 33.34 = 100
      })

      it('includes all allocation fields in response', async () => {
        const mockAssets = [
          createMockAssetWithHolding({ id: 'a1', ticker: 'VOO', name: 'Vanguard S&P 500', targetPercentage: 100, currentPrice: 450, quantity: 10 }),
        ]

        vi.mocked(prisma.asset.findMany).mockResolvedValue(mockAssets as unknown as Asset[])

        const result = await contributionService.getSuggestion(userId, 1000)

        const alloc = result.allocations[0]
        expect(alloc.assetId).toBe('a1')
        expect(alloc.ticker).toBe('VOO')
        expect(alloc.name).toBe('Vanguard S&P 500')
        expect(alloc.targetPercentage).toBeDefined()
        expect(alloc.actualPercentage).toBeDefined()
        expect(alloc.deviation).toBeDefined()
        expect(alloc.baseAllocation).toBeDefined()
        expect(alloc.adjustedAllocation).toBeDefined()
        expect(alloc).toHaveProperty('adjustmentReason')
      })
    })
  })
})
