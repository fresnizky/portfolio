import { describe, it, expect, vi, beforeEach } from 'vitest'
import { holdingService } from './holdingService'
import { prisma } from '@/config/database'
import { AppError } from '@/lib/errors'
import type { Asset, Holding } from '@prisma/client'

// Mock the database
vi.mock('@/config/database', () => ({
  prisma: {
    holding: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    asset: {
      findUnique: vi.fn(),
    },
  },
}))

// Helper to create mock Prisma Decimal that works with Number()
const createMockDecimal = (value: number) => ({
  toNumber: () => value,
  valueOf: () => value,
  toString: () => String(value),
})

// Reusable mock asset factory
const createMockAsset = (overrides: Partial<Asset> = {}): Asset => ({
  id: 'asset-123',
  ticker: 'VOO',
  name: 'Vanguard S&P 500 ETF',
  category: 'ETF',
  targetPercentage: createMockDecimal(50) as unknown as Asset['targetPercentage'],
  currentPriceCents: null,
  priceUpdatedAt: null,
  userId: 'user-123',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

// Reusable mock holding factory
const createMockHolding = (overrides: Partial<Holding> = {}): Holding => ({
  id: 'holding-123',
  quantity: createMockDecimal(10.5) as unknown as Holding['quantity'],
  userId: 'user-123',
  assetId: 'asset-123',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

// Type for holding with asset included
type HoldingWithAsset = Holding & {
  asset: {
    id: string
    ticker: string
    name: string
    category: string
  }
}

const createMockHoldingWithAsset = (
  holdingOverrides: Partial<Holding> = {},
  assetOverrides: Partial<Asset> = {}
): HoldingWithAsset => ({
  ...createMockHolding(holdingOverrides),
  asset: {
    id: assetOverrides.id ?? 'asset-123',
    ticker: assetOverrides.ticker ?? 'VOO',
    name: assetOverrides.name ?? 'Vanguard S&P 500 ETF',
    category: assetOverrides.category ?? 'ETF',
  },
})

const userId = 'user-123'
const otherUserId = 'user-456'

describe('holdingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getHoldings', () => {
    it('should return all holdings for a user with asset details', async () => {
      const mockHoldings = [
        createMockHoldingWithAsset(
          { id: 'holding-1', assetId: 'asset-1' },
          { id: 'asset-1', ticker: 'VOO', name: 'Vanguard S&P 500 ETF', category: 'ETF' }
        ),
        createMockHoldingWithAsset(
          { id: 'holding-2', assetId: 'asset-2' },
          { id: 'asset-2', ticker: 'BTC', name: 'Bitcoin', category: 'CRYPTO' }
        ),
      ]

      vi.mocked(prisma.holding.findMany).mockResolvedValue(mockHoldings)

      const result = await holdingService.getHoldings(userId)

      expect(result).toEqual(mockHoldings)
      expect(prisma.holding.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: {
          asset: {
            select: {
              id: true,
              ticker: true,
              name: true,
              category: true,
            },
          },
        },
        orderBy: { asset: { ticker: 'asc' } },
      })
    })

    it('should return empty array when user has no holdings', async () => {
      vi.mocked(prisma.holding.findMany).mockResolvedValue([])

      const result = await holdingService.getHoldings(userId)

      expect(result).toEqual([])
    })

    it('should only return holdings for the specified user', async () => {
      const userHoldings = [createMockHoldingWithAsset({ userId })]

      vi.mocked(prisma.holding.findMany).mockResolvedValue(userHoldings)

      await holdingService.getHoldings(userId)

      expect(prisma.holding.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId },
        })
      )
    })

    it('should order holdings by asset ticker alphabetically', async () => {
      await holdingService.getHoldings(userId)

      expect(prisma.holding.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { asset: { ticker: 'asc' } },
        })
      )
    })
  })

  describe('createOrUpdateHolding', () => {
    describe('when asset exists and belongs to user', () => {
      it('should create or update holding and return holding object', async () => {
        const mockAsset = createMockAsset()
        const mockHoldingWithAsset = createMockHoldingWithAsset()

        vi.mocked(prisma.asset.findUnique).mockResolvedValue(mockAsset)
        vi.mocked(prisma.holding.upsert).mockResolvedValue(mockHoldingWithAsset)

        const result = await holdingService.createOrUpdateHolding(userId, 'asset-123', 10.5)

        expect(result).toEqual(mockHoldingWithAsset)
        expect(prisma.holding.upsert).toHaveBeenCalledWith({
          where: { assetId: 'asset-123' },
          create: {
            userId,
            assetId: 'asset-123',
            quantity: 10.5,
          },
          update: {
            quantity: 10.5,
          },
          include: {
            asset: {
              select: {
                id: true,
                ticker: true,
                name: true,
                category: true,
              },
            },
          },
        })
      })

      it('should accept fractional quantities for crypto', async () => {
        const mockAsset = createMockAsset({ category: 'CRYPTO', ticker: 'BTC' })
        const mockHoldingWithAsset = createMockHoldingWithAsset(
          { quantity: createMockDecimal(0.00012345) as unknown as Holding['quantity'] },
          { category: 'CRYPTO', ticker: 'BTC' }
        )

        vi.mocked(prisma.asset.findUnique).mockResolvedValue(mockAsset)
        vi.mocked(prisma.holding.upsert).mockResolvedValue(mockHoldingWithAsset)

        const result = await holdingService.createOrUpdateHolding(userId, 'asset-123', 0.00012345)

        expect(result).toEqual(mockHoldingWithAsset)
        expect(prisma.holding.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            create: expect.objectContaining({ quantity: 0.00012345 }),
          })
        )
      })

      it('should accept large integer quantities', async () => {
        const mockAsset = createMockAsset()
        const mockHoldingWithAsset = createMockHoldingWithAsset({
          quantity: createMockDecimal(1000000) as unknown as Holding['quantity'],
        })

        vi.mocked(prisma.asset.findUnique).mockResolvedValue(mockAsset)
        vi.mocked(prisma.holding.upsert).mockResolvedValue(mockHoldingWithAsset)

        const result = await holdingService.createOrUpdateHolding(userId, 'asset-123', 1000000)

        expect(result).toEqual(mockHoldingWithAsset)
      })
    })

    describe('when asset does not exist', () => {
      it('should throw not found error', async () => {
        vi.mocked(prisma.asset.findUnique).mockResolvedValue(null)

        await expect(holdingService.createOrUpdateHolding(userId, 'non-existent', 10))
          .rejects.toThrow(AppError)
        await expect(holdingService.createOrUpdateHolding(userId, 'non-existent', 10))
          .rejects.toMatchObject({
            statusCode: 404,
            code: 'NOT_FOUND',
            message: 'Asset not found',
          })

        expect(prisma.holding.upsert).not.toHaveBeenCalled()
      })
    })

    describe('when asset belongs to another user', () => {
      it('should throw forbidden error', async () => {
        const otherUserAsset = createMockAsset({ userId: otherUserId })

        vi.mocked(prisma.asset.findUnique).mockResolvedValue(otherUserAsset)

        await expect(holdingService.createOrUpdateHolding(userId, 'asset-123', 10))
          .rejects.toThrow(AppError)
        await expect(holdingService.createOrUpdateHolding(userId, 'asset-123', 10))
          .rejects.toMatchObject({
            statusCode: 403,
            code: 'FORBIDDEN',
            message: 'Access denied',
          })

        expect(prisma.holding.upsert).not.toHaveBeenCalled()
      })
    })

    describe('edge cases', () => {
      it('should include asset details in returned holding', async () => {
        const mockAsset = createMockAsset()
        const holdingWithAsset = createMockHoldingWithAsset()

        vi.mocked(prisma.asset.findUnique).mockResolvedValue(mockAsset)
        vi.mocked(prisma.holding.upsert).mockResolvedValue(holdingWithAsset)

        const result = await holdingService.createOrUpdateHolding(userId, 'asset-123', 10)

        expect(result.asset).toEqual({
          id: 'asset-123',
          ticker: 'VOO',
          name: 'Vanguard S&P 500 ETF',
          category: 'ETF',
        })
      })
    })
  })

  describe('holdingExists', () => {
    it('should return true when holding exists', async () => {
      vi.mocked(prisma.holding.findUnique).mockResolvedValue({ id: 'holding-123' } as Holding)

      const result = await holdingService.holdingExists('asset-123')

      expect(result).toBe(true)
      expect(prisma.holding.findUnique).toHaveBeenCalledWith({
        where: { assetId: 'asset-123' },
        select: { id: true },
      })
    })

    it('should return false when holding does not exist', async () => {
      vi.mocked(prisma.holding.findUnique).mockResolvedValue(null)

      const result = await holdingService.holdingExists('asset-123')

      expect(result).toBe(false)
    })
  })
})
