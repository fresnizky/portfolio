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
    it('should return all assets for a user', async () => {
      const mockAssets = [
        createMockAsset({ id: 'asset-1', ticker: 'VOO' }),
        createMockAsset({ id: 'asset-2', ticker: 'SPY' }),
      ]

      vi.mocked(prisma.asset.findMany).mockResolvedValue(mockAssets)

      const result = await assetService.list(userId)

      expect(result).toEqual(mockAssets)
      expect(prisma.asset.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      })
    })

    it('should return empty array when user has no assets', async () => {
      vi.mocked(prisma.asset.findMany).mockResolvedValue([])

      const result = await assetService.list(userId)

      expect(result).toEqual([])
    })

    it('should only return assets for the specified user', async () => {
      const userAssets = [createMockAsset({ userId })]

      vi.mocked(prisma.asset.findMany).mockResolvedValue(userAssets)

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
})
