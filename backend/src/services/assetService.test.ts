import { describe, it, expect, vi, beforeEach } from 'vitest'
import { assetService } from './assetService'
import { prisma } from '@/config/database'
import { AppError } from '@/lib/errors'
import type { Asset } from '@prisma/client'

// Mock the database
vi.mock('@/config/database', () => ({
  prisma: {
    asset: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

// Reusable mock asset factory
const createMockAsset = (overrides: Partial<Asset> = {}): Asset => ({
  id: 'asset-123',
  ticker: 'VOO',
  name: 'Vanguard S&P 500 ETF',
  category: 'ETF',
  targetPercentage: { toNumber: () => 0 } as Asset['targetPercentage'],
  userId: 'user-123',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

const userId = 'user-123'
const otherUserId = 'user-456'

describe('assetService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should create a new asset with valid data', async () => {
      const mockAsset = createMockAsset()
      const createData = { ticker: 'VOO', name: 'Vanguard S&P 500 ETF', category: 'ETF' as const }

      vi.mocked(prisma.asset.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.asset.create).mockResolvedValue(mockAsset)

      const result = await assetService.create(userId, createData)

      expect(result).toEqual(mockAsset)
      expect(prisma.asset.create).toHaveBeenCalledWith({
        data: { ...createData, userId },
      })
    })

    it('should throw validation error for duplicate ticker', async () => {
      const existingAsset = createMockAsset()
      const createData = { ticker: 'VOO', name: 'Vanguard S&P 500 ETF', category: 'ETF' as const }

      vi.mocked(prisma.asset.findFirst).mockResolvedValue(existingAsset)

      await expect(assetService.create(userId, createData)).rejects.toThrow(AppError)
      await expect(assetService.create(userId, createData)).rejects.toMatchObject({
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: 'Asset with this ticker already exists',
      })

      expect(prisma.asset.create).not.toHaveBeenCalled()
    })

    it('should allow same ticker for different users', async () => {
      const mockAsset = createMockAsset({ userId: otherUserId })
      const createData = { ticker: 'VOO', name: 'Vanguard S&P 500 ETF', category: 'ETF' as const }

      // First call returns null (no duplicate for this user)
      vi.mocked(prisma.asset.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.asset.create).mockResolvedValue(mockAsset)

      const result = await assetService.create(otherUserId, createData)

      expect(result).toEqual(mockAsset)
      expect(prisma.asset.findFirst).toHaveBeenCalledWith({
        where: { userId: otherUserId, ticker: 'VOO' },
      })
    })
  })

  describe('list', () => {
    it('should return all assets for a user with total count', async () => {
      const mockAssets = [
        createMockAsset({ id: 'asset-1', ticker: 'VOO' }),
        createMockAsset({ id: 'asset-2', ticker: 'SPY' }),
      ]

      vi.mocked(prisma.asset.findMany).mockResolvedValue(mockAssets)
      vi.mocked(prisma.asset.count).mockResolvedValue(2)

      const result = await assetService.list(userId)

      expect(result).toEqual({ assets: mockAssets, total: 2 })
      expect(prisma.asset.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      })
      expect(prisma.asset.count).toHaveBeenCalledWith({ where: { userId } })
    })

    it('should return empty array when user has no assets', async () => {
      vi.mocked(prisma.asset.findMany).mockResolvedValue([])
      vi.mocked(prisma.asset.count).mockResolvedValue(0)

      const result = await assetService.list(userId)

      expect(result).toEqual({ assets: [], total: 0 })
    })

    it('should apply pagination when limit and offset provided', async () => {
      const mockAssets = [createMockAsset({ userId })]

      vi.mocked(prisma.asset.findMany).mockResolvedValue(mockAssets)
      vi.mocked(prisma.asset.count).mockResolvedValue(10)

      const result = await assetService.list(userId, { limit: 5, offset: 5 })

      expect(result).toEqual({ assets: mockAssets, total: 10 })
      expect(prisma.asset.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        take: 5,
        skip: 5,
      })
    })

    it('should only return assets for the specified user', async () => {
      const userAssets = [createMockAsset({ userId })]

      vi.mocked(prisma.asset.findMany).mockResolvedValue(userAssets)
      vi.mocked(prisma.asset.count).mockResolvedValue(1)

      await assetService.list(userId)

      expect(prisma.asset.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      })
    })
  })

  describe('getById', () => {
    it('should return asset when found and owned by user', async () => {
      const mockAsset = createMockAsset()

      vi.mocked(prisma.asset.findFirst).mockResolvedValue(mockAsset)

      const result = await assetService.getById(userId, 'asset-123')

      expect(result).toEqual(mockAsset)
      expect(prisma.asset.findFirst).toHaveBeenCalledWith({
        where: { id: 'asset-123', userId },
      })
    })

    it('should throw not found error when asset does not exist', async () => {
      vi.mocked(prisma.asset.findFirst).mockResolvedValue(null)

      await expect(assetService.getById(userId, 'non-existent')).rejects.toThrow(AppError)
      await expect(assetService.getById(userId, 'non-existent')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'Asset not found',
      })
    })

    it('should throw not found error when asset belongs to another user', async () => {
      // Asset exists but belongs to different user - findFirst with userId filter returns null
      vi.mocked(prisma.asset.findFirst).mockResolvedValue(null)

      await expect(assetService.getById(userId, 'asset-123')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      })
    })
  })

  describe('update', () => {
    it('should update asset with valid data', async () => {
      const existingAsset = createMockAsset()
      const updatedAsset = { ...existingAsset, name: 'Updated Name' }
      const updateData = { name: 'Updated Name' }

      vi.mocked(prisma.asset.findFirst).mockResolvedValue(existingAsset)
      vi.mocked(prisma.asset.update).mockResolvedValue(updatedAsset)

      const result = await assetService.update(userId, 'asset-123', updateData)

      expect(result).toEqual(updatedAsset)
      expect(prisma.asset.update).toHaveBeenCalledWith({
        where: { id: 'asset-123' },
        data: updateData,
      })
    })

    it('should throw not found error when updating non-existent asset', async () => {
      vi.mocked(prisma.asset.findFirst).mockResolvedValue(null)

      await expect(assetService.update(userId, 'non-existent', { name: 'New Name' }))
        .rejects.toMatchObject({
          statusCode: 404,
          code: 'NOT_FOUND',
        })

      expect(prisma.asset.update).not.toHaveBeenCalled()
    })

    it('should throw validation error when updating ticker to duplicate', async () => {
      const existingAsset = createMockAsset({ id: 'asset-123', ticker: 'VOO' })
      const duplicateAsset = createMockAsset({ id: 'asset-456', ticker: 'SPY' })

      // First call: getById succeeds
      // Second call: findFirst for duplicate check returns existing asset
      vi.mocked(prisma.asset.findFirst)
        .mockResolvedValueOnce(existingAsset) // getById
        .mockResolvedValueOnce(duplicateAsset) // duplicate check

      await expect(assetService.update(userId, 'asset-123', { ticker: 'SPY' }))
        .rejects.toMatchObject({
          statusCode: 400,
          code: 'VALIDATION_ERROR',
          message: 'Asset with this ticker already exists',
        })

      expect(prisma.asset.update).not.toHaveBeenCalled()
    })

    it('should allow updating ticker to same value', async () => {
      const existingAsset = createMockAsset({ ticker: 'VOO' })

      vi.mocked(prisma.asset.findFirst)
        .mockResolvedValueOnce(existingAsset) // getById
        .mockResolvedValueOnce(null) // duplicate check (no other asset with same ticker)
      vi.mocked(prisma.asset.update).mockResolvedValue(existingAsset)

      const result = await assetService.update(userId, 'asset-123', { ticker: 'VOO' })

      expect(result).toEqual(existingAsset)
    })

    it('should throw not found error when asset belongs to another user', async () => {
      vi.mocked(prisma.asset.findFirst).mockResolvedValue(null)

      await expect(assetService.update(userId, 'asset-123', { name: 'New Name' }))
        .rejects.toMatchObject({
          statusCode: 404,
          code: 'NOT_FOUND',
        })
    })
  })

  describe('delete', () => {
    it('should delete asset when found and owned by user', async () => {
      const existingAsset = createMockAsset()

      vi.mocked(prisma.asset.findFirst).mockResolvedValue(existingAsset)
      vi.mocked(prisma.asset.delete).mockResolvedValue(existingAsset)

      const result = await assetService.delete(userId, 'asset-123')

      expect(result).toEqual(existingAsset)
      expect(prisma.asset.delete).toHaveBeenCalledWith({
        where: { id: 'asset-123' },
      })
    })

    it('should throw not found error when deleting non-existent asset', async () => {
      vi.mocked(prisma.asset.findFirst).mockResolvedValue(null)

      await expect(assetService.delete(userId, 'non-existent'))
        .rejects.toMatchObject({
          statusCode: 404,
          code: 'NOT_FOUND',
        })

      expect(prisma.asset.delete).not.toHaveBeenCalled()
    })

    it('should throw not found error when asset belongs to another user', async () => {
      vi.mocked(prisma.asset.findFirst).mockResolvedValue(null)

      await expect(assetService.delete(userId, 'asset-123'))
        .rejects.toMatchObject({
          statusCode: 404,
          code: 'NOT_FOUND',
        })

      expect(prisma.asset.delete).not.toHaveBeenCalled()
    })
  })

  describe('validateTargetsSum', () => {
    it('should return valid:true when sum equals 100', async () => {
      const mockAssets = [
        createMockAsset({ id: 'asset-1', targetPercentage: { toNumber: () => 60 } as Asset['targetPercentage'] }),
        createMockAsset({ id: 'asset-2', targetPercentage: { toNumber: () => 40 } as Asset['targetPercentage'] }),
      ]

      vi.mocked(prisma.asset.findMany).mockResolvedValue(mockAssets)
      vi.mocked(prisma.asset.count).mockResolvedValue(2)

      const result = await assetService.validateTargetsSum(userId)

      expect(result).toEqual({ valid: true, sum: 100, difference: 0 })
    })

    it('should return valid:false with positive difference when sum exceeds 100', async () => {
      const mockAssets = [
        createMockAsset({ id: 'asset-1', targetPercentage: { toNumber: () => 70 } as Asset['targetPercentage'] }),
        createMockAsset({ id: 'asset-2', targetPercentage: { toNumber: () => 50 } as Asset['targetPercentage'] }),
      ]

      vi.mocked(prisma.asset.findMany).mockResolvedValue(mockAssets)
      vi.mocked(prisma.asset.count).mockResolvedValue(2)

      const result = await assetService.validateTargetsSum(userId)

      expect(result).toEqual({ valid: false, sum: 120, difference: 20 })
    })

    it('should return valid:false with negative difference when sum is below 100', async () => {
      const mockAssets = [
        createMockAsset({ id: 'asset-1', targetPercentage: { toNumber: () => 30 } as Asset['targetPercentage'] }),
        createMockAsset({ id: 'asset-2', targetPercentage: { toNumber: () => 20 } as Asset['targetPercentage'] }),
      ]

      vi.mocked(prisma.asset.findMany).mockResolvedValue(mockAssets)
      vi.mocked(prisma.asset.count).mockResolvedValue(2)

      const result = await assetService.validateTargetsSum(userId)

      expect(result).toEqual({ valid: false, sum: 50, difference: -50 })
    })

    it('should apply pending updates when calculating sum', async () => {
      const mockAssets = [
        createMockAsset({ id: 'asset-1', targetPercentage: { toNumber: () => 60 } as Asset['targetPercentage'] }),
        createMockAsset({ id: 'asset-2', targetPercentage: { toNumber: () => 40 } as Asset['targetPercentage'] }),
      ]

      vi.mocked(prisma.asset.findMany).mockResolvedValue(mockAssets)
      vi.mocked(prisma.asset.count).mockResolvedValue(2)

      // Change asset-1 from 60 to 70 (would make sum 110)
      const pendingUpdates = new Map([['asset-1', 70]])
      const result = await assetService.validateTargetsSum(userId, pendingUpdates)

      expect(result).toEqual({ valid: false, sum: 110, difference: 10 })
    })

    it('should handle pending updates that result in valid sum', async () => {
      const mockAssets = [
        createMockAsset({ id: 'asset-1', targetPercentage: { toNumber: () => 50 } as Asset['targetPercentage'] }),
        createMockAsset({ id: 'asset-2', targetPercentage: { toNumber: () => 30 } as Asset['targetPercentage'] }),
      ]

      vi.mocked(prisma.asset.findMany).mockResolvedValue(mockAssets)
      vi.mocked(prisma.asset.count).mockResolvedValue(2)

      // Change asset-2 from 30 to 50 (would make sum 100)
      const pendingUpdates = new Map([['asset-2', 50]])
      const result = await assetService.validateTargetsSum(userId, pendingUpdates)

      expect(result).toEqual({ valid: true, sum: 100, difference: 0 })
    })

    it('should handle decimal values correctly', async () => {
      const mockAssets = [
        createMockAsset({ id: 'asset-1', targetPercentage: { toNumber: () => 33.33 } as Asset['targetPercentage'] }),
        createMockAsset({ id: 'asset-2', targetPercentage: { toNumber: () => 33.33 } as Asset['targetPercentage'] }),
        createMockAsset({ id: 'asset-3', targetPercentage: { toNumber: () => 33.34 } as Asset['targetPercentage'] }),
      ]

      vi.mocked(prisma.asset.findMany).mockResolvedValue(mockAssets)
      vi.mocked(prisma.asset.count).mockResolvedValue(3)

      const result = await assetService.validateTargetsSum(userId)

      expect(result).toEqual({ valid: true, sum: 100, difference: 0 })
    })

    it('should return valid:false when user has no assets (sum is 0)', async () => {
      vi.mocked(prisma.asset.findMany).mockResolvedValue([])
      vi.mocked(prisma.asset.count).mockResolvedValue(0)

      const result = await assetService.validateTargetsSum(userId)

      expect(result).toEqual({ valid: false, sum: 0, difference: -100 })
    })
  })

  describe('update with targetPercentage validation', () => {
    it('should update targetPercentage when sum equals 100%', async () => {
      const existingAsset = createMockAsset({ id: 'asset-1', targetPercentage: { toNumber: () => 60 } as Asset['targetPercentage'] })
      const otherAsset = createMockAsset({ id: 'asset-2', targetPercentage: { toNumber: () => 40 } as Asset['targetPercentage'] })
      const updatedAsset = { ...existingAsset, targetPercentage: { toNumber: () => 50 } as Asset['targetPercentage'] }

      // getById check
      vi.mocked(prisma.asset.findFirst).mockResolvedValueOnce(existingAsset)
      // validateTargetsSum - list call
      vi.mocked(prisma.asset.findMany).mockResolvedValueOnce([existingAsset, otherAsset])
      vi.mocked(prisma.asset.count).mockResolvedValueOnce(2)
      // actual update
      vi.mocked(prisma.asset.update).mockResolvedValue(updatedAsset)

      // Change from 60 to 50, other asset has 40 = 90, but we need to adjust
      // Let's make it: asset-1: 60->50, asset-2: 40 => 90 (invalid)
      // Instead, let's test valid: asset-1: 60, asset-2: 40 = 100, change asset-1 to 60 (same)
      const result = await assetService.update(userId, 'asset-1', { targetPercentage: 60 })

      expect(result).toEqual(updatedAsset)
      expect(prisma.asset.update).toHaveBeenCalled()
    })

    it('should reject targetPercentage update when sum would exceed 100%', async () => {
      const existingAsset = createMockAsset({ id: 'asset-1', targetPercentage: { toNumber: () => 60 } as Asset['targetPercentage'] })
      const otherAsset = createMockAsset({ id: 'asset-2', targetPercentage: { toNumber: () => 40 } as Asset['targetPercentage'] })

      // getById check
      vi.mocked(prisma.asset.findFirst).mockResolvedValueOnce(existingAsset)
      // validateTargetsSum - list call
      vi.mocked(prisma.asset.findMany).mockResolvedValueOnce([existingAsset, otherAsset])
      vi.mocked(prisma.asset.count).mockResolvedValueOnce(2)

      // Try to change asset-1 from 60 to 80 (would make sum 120)
      await expect(assetService.update(userId, 'asset-1', { targetPercentage: 80 }))
        .rejects.toMatchObject({
          statusCode: 400,
          code: 'VALIDATION_ERROR',
        })

      expect(prisma.asset.update).not.toHaveBeenCalled()
    })

    it('should reject targetPercentage update when sum would be below 100%', async () => {
      const existingAsset = createMockAsset({ id: 'asset-1', targetPercentage: { toNumber: () => 60 } as Asset['targetPercentage'] })
      const otherAsset = createMockAsset({ id: 'asset-2', targetPercentage: { toNumber: () => 40 } as Asset['targetPercentage'] })

      // getById check
      vi.mocked(prisma.asset.findFirst).mockResolvedValueOnce(existingAsset)
      // validateTargetsSum - list call
      vi.mocked(prisma.asset.findMany).mockResolvedValueOnce([existingAsset, otherAsset])
      vi.mocked(prisma.asset.count).mockResolvedValueOnce(2)

      // Try to change asset-1 from 60 to 30 (would make sum 70)
      await expect(assetService.update(userId, 'asset-1', { targetPercentage: 30 }))
        .rejects.toMatchObject({
          statusCode: 400,
          code: 'VALIDATION_ERROR',
        })

      expect(prisma.asset.update).not.toHaveBeenCalled()
    })

    it('should include sum details in validation error', async () => {
      const existingAsset = createMockAsset({ id: 'asset-1', targetPercentage: { toNumber: () => 60 } as Asset['targetPercentage'] })
      const otherAsset = createMockAsset({ id: 'asset-2', targetPercentage: { toNumber: () => 40 } as Asset['targetPercentage'] })

      vi.mocked(prisma.asset.findFirst).mockResolvedValueOnce(existingAsset)
      vi.mocked(prisma.asset.findMany).mockResolvedValueOnce([existingAsset, otherAsset])
      vi.mocked(prisma.asset.count).mockResolvedValueOnce(2)

      // Try to change asset-1 from 60 to 80 (would make sum 120)
      try {
        await assetService.update(userId, 'asset-1', { targetPercentage: 80 })
      } catch (error: unknown) {
        const appError = error as AppError
        expect(appError.message).toContain('100%')
        expect(appError.details).toHaveProperty('sum', 120)
        expect(appError.details).toHaveProperty('difference', 20)
      }
    })

    it('should allow non-targetPercentage updates without sum validation', async () => {
      const existingAsset = createMockAsset()
      const updatedAsset = { ...existingAsset, name: 'Updated Name' }

      vi.mocked(prisma.asset.findFirst).mockResolvedValueOnce(existingAsset)
      vi.mocked(prisma.asset.update).mockResolvedValue(updatedAsset)

      const result = await assetService.update(userId, 'asset-123', { name: 'Updated Name' })

      expect(result).toEqual(updatedAsset)
      // validateTargetsSum should not be called for non-targetPercentage updates
      expect(prisma.asset.findMany).not.toHaveBeenCalled()
    })
  })
})
