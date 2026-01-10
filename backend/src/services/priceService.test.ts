import { describe, it, expect, vi, beforeEach } from 'vitest'
import { priceService, fromCents } from './priceService'
import { prisma } from '@/config/database'
import { AppError } from '@/lib/errors'
import type { Asset } from '@prisma/client'

// Mock the database
vi.mock('@/config/database', () => ({
  prisma: {
    asset: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

// Helper to create mock Prisma Decimal
const createMockDecimal = (value: number) => ({
  toNumber: () => value,
  valueOf: () => value,
  toString: () => String(value),
}) as unknown as Asset['targetPercentage']

// Reusable mock asset factory
const createMockAsset = (overrides: Partial<Asset> = {}): Asset => ({
  id: 'asset-123',
  ticker: 'VOO',
  name: 'Vanguard S&P 500 ETF',
  category: 'ETF',
  targetPercentage: createMockDecimal(50),
  currentPriceCents: BigInt(45075), // $450.75
  priceUpdatedAt: new Date('2026-01-09T15:30:00.000Z'),
  userId: 'user-123',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

const userId = 'user-123'

describe('fromCents', () => {
  it('should convert cents to decimal string', () => {
    expect(fromCents(BigInt(45075))).toBe('450.75')
    expect(fromCents(BigInt(100))).toBe('1.00')
    expect(fromCents(BigInt(1))).toBe('0.01')
    expect(fromCents(BigInt(4200000))).toBe('42000.00')
  })

  it('should return null for null input', () => {
    expect(fromCents(null)).toBeNull()
  })
})

describe('priceService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('updatePrice', () => {
    it('should update price with current timestamp', async () => {
      const mockAsset = createMockAsset()
      const updatedAsset = {
        id: 'asset-123',
        ticker: 'VOO',
        name: 'Vanguard S&P 500 ETF',
        currentPriceCents: BigInt(50000), // $500.00
        priceUpdatedAt: new Date(),
      }

      vi.mocked(prisma.asset.findFirst).mockResolvedValue(mockAsset)
      vi.mocked(prisma.asset.update).mockResolvedValue(updatedAsset as never)

      const result = await priceService.updatePrice(userId, 'asset-123', { price: 500.00 })

      expect(result.currentPrice).toBe('500.00')
      expect(prisma.asset.findFirst).toHaveBeenCalledWith({
        where: { id: 'asset-123', userId },
      })
      expect(prisma.asset.update).toHaveBeenCalledWith({
        where: { id: 'asset-123' },
        data: {
          currentPriceCents: BigInt(50000),
          priceUpdatedAt: expect.any(Date),
        },
        select: {
          id: true,
          ticker: true,
          name: true,
          currentPriceCents: true,
          priceUpdatedAt: true,
        },
      })
    })

    it('should throw notFound for non-existent asset', async () => {
      vi.mocked(prisma.asset.findFirst).mockResolvedValue(null)

      await expect(priceService.updatePrice(userId, 'non-existent', { price: 100 }))
        .rejects.toThrow(AppError)
      await expect(priceService.updatePrice(userId, 'non-existent', { price: 100 }))
        .rejects.toMatchObject({
          statusCode: 404,
          code: 'NOT_FOUND',
          message: 'Asset not found',
        })

      expect(prisma.asset.update).not.toHaveBeenCalled()
    })

    it('should throw notFound for other user\'s asset', async () => {
      vi.mocked(prisma.asset.findFirst).mockResolvedValue(null)

      await expect(priceService.updatePrice(userId, 'other-user-asset', { price: 100 }))
        .rejects.toThrow(AppError)
      await expect(priceService.updatePrice(userId, 'other-user-asset', { price: 100 }))
        .rejects.toMatchObject({
          statusCode: 404,
          code: 'NOT_FOUND',
        })

      expect(prisma.asset.update).not.toHaveBeenCalled()
    })

    it('should convert decimal prices to cents', async () => {
      const mockAsset = createMockAsset()
      vi.mocked(prisma.asset.findFirst).mockResolvedValue(mockAsset)
      vi.mocked(prisma.asset.update).mockResolvedValue(mockAsset)

      await priceService.updatePrice(userId, 'asset-123', { price: 450.75 })

      expect(prisma.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ currentPriceCents: BigInt(45075) }),
        })
      )
    })

    it('should handle high prices for crypto', async () => {
      const mockAsset = createMockAsset({ ticker: 'BTC', category: 'CRYPTO' })
      vi.mocked(prisma.asset.findFirst).mockResolvedValue(mockAsset)
      vi.mocked(prisma.asset.update).mockResolvedValue(mockAsset)

      await priceService.updatePrice(userId, 'asset-123', { price: 42000.00 })

      expect(prisma.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ currentPriceCents: BigInt(4200000) }),
        })
      )
    })
  })

  describe('batchUpdatePrices', () => {
    it('should update all prices atomically', async () => {
      const mockAssets = [
        { id: 'asset-1' },
        { id: 'asset-2' },
      ]
      const updatedAssets = [
        { id: 'asset-1', ticker: 'VOO', currentPriceCents: BigInt(45075), priceUpdatedAt: new Date() },
        { id: 'asset-2', ticker: 'GLD', currentPriceCents: BigInt(8530), priceUpdatedAt: new Date() },
      ]

      vi.mocked(prisma.asset.findMany).mockResolvedValue(mockAssets as Asset[])
      vi.mocked(prisma.$transaction).mockResolvedValue(updatedAssets)

      const result = await priceService.batchUpdatePrices(userId, {
        prices: [
          { assetId: 'asset-1', price: 450.75 },
          { assetId: 'asset-2', price: 85.30 },
        ],
      })

      expect(result.updated).toBe(2)
      expect(result.assets[0].currentPrice).toBe('450.75')
      expect(result.assets[1].currentPrice).toBe('85.30')
      expect(prisma.$transaction).toHaveBeenCalled()
    })

    it('should throw notFound if any asset doesn\'t exist', async () => {
      vi.mocked(prisma.asset.findMany).mockResolvedValue([{ id: 'asset-1' }] as Asset[])

      await expect(
        priceService.batchUpdatePrices(userId, {
          prices: [
            { assetId: 'asset-1', price: 100 },
            { assetId: 'asset-2', price: 200 },
          ],
        })
      ).rejects.toThrow(AppError)

      await expect(
        priceService.batchUpdatePrices(userId, {
          prices: [
            { assetId: 'asset-1', price: 100 },
            { assetId: 'asset-2', price: 200 },
          ],
        })
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'One or more assets not found',
      })

      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it('should include notFound asset IDs in error details', async () => {
      vi.mocked(prisma.asset.findMany).mockResolvedValue([{ id: 'asset-1' }] as Asset[])

      try {
        await priceService.batchUpdatePrices(userId, {
          prices: [
            { assetId: 'asset-1', price: 100 },
            { assetId: 'asset-2', price: 200 },
            { assetId: 'asset-3', price: 300 },
          ],
        })
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).details).toEqual({ notFound: ['asset-2', 'asset-3'] })
      }
    })

    it('should verify all assets belong to user', async () => {
      vi.mocked(prisma.asset.findMany).mockResolvedValue([])

      await priceService.batchUpdatePrices(userId, {
        prices: [{ assetId: 'asset-1', price: 100 }],
      }).catch(() => {})

      expect(prisma.asset.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['asset-1'] },
          userId,
        },
        select: { id: true },
      })
    })

    it('should handle single price in batch', async () => {
      const mockAssets = [{ id: 'asset-1' }]
      const updatedAssets = [
        { id: 'asset-1', ticker: 'VOO', currentPriceCents: BigInt(10000), priceUpdatedAt: new Date() },
      ]

      vi.mocked(prisma.asset.findMany).mockResolvedValue(mockAssets as Asset[])
      vi.mocked(prisma.$transaction).mockResolvedValue(updatedAssets)

      const result = await priceService.batchUpdatePrices(userId, {
        prices: [{ assetId: 'asset-1', price: 100 }],
      })

      expect(result.updated).toBe(1)
      expect(result.assets[0].currentPrice).toBe('100.00')
    })
  })
})
