import { describe, it, expect, vi, beforeEach } from 'vitest'
import { snapshotService } from './snapshotService'
import { prisma } from '@/config/database'
import { AppError } from '@/lib/errors'
import { Prisma } from '@prisma/client'

// Mock the database
vi.mock('@/config/database', () => {
  const mockPrisma = {
    asset: {
      findMany: vi.fn(),
    },
    portfolioSnapshot: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    snapshotAsset: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  }
  // Make $transaction execute the callback with the same prisma mock
  mockPrisma.$transaction.mockImplementation((cb: (tx: typeof mockPrisma) => Promise<unknown>) =>
    cb(mockPrisma)
  )
  return { prisma: mockPrisma }
})

const userId = 'user-123'

const mockAssetWithHolding = (overrides = {}) => ({
  id: 'asset-123',
  ticker: 'VOO',
  name: 'Vanguard S&P 500 ETF',
  userId,
  currentPrice: new Prisma.Decimal('450.75'),
  holding: {
    quantity: new Prisma.Decimal('10'),
  },
  ...overrides,
})

const mockSnapshot = (overrides = {}) => ({
  id: 'snapshot-123',
  date: new Date('2026-01-10T00:00:00.000Z'),
  totalValue: new Prisma.Decimal('4507.50'),
  userId,
  createdAt: new Date('2026-01-10T15:30:00.000Z'),
  updatedAt: new Date('2026-01-10T15:30:00.000Z'),
  assets: [
    {
      id: 'sa-123',
      snapshotId: 'snapshot-123',
      assetId: 'asset-123',
      ticker: 'VOO',
      name: 'Vanguard S&P 500 ETF',
      quantity: new Prisma.Decimal('10'),
      price: new Prisma.Decimal('450.75'),
      value: new Prisma.Decimal('4507.50'),
      percentage: new Prisma.Decimal('100.00'),
    },
  ],
  ...overrides,
})

describe('snapshotService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset the date mock
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-10T15:30:00.000Z'))
  })

  describe('create', () => {
    it('should create snapshot with current portfolio state', async () => {
      const assets = [mockAssetWithHolding()]
      vi.mocked(prisma.asset.findMany).mockResolvedValue(assets as never)
      vi.mocked(prisma.portfolioSnapshot.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.portfolioSnapshot.create).mockResolvedValue({
        id: 'snapshot-123',
        date: new Date('2026-01-10T00:00:00.000Z'),
        totalValue: new Prisma.Decimal('4507.50'),
        userId,
      } as never)
      vi.mocked(prisma.snapshotAsset.createMany).mockResolvedValue({ count: 1 } as never)
      vi.mocked(prisma.portfolioSnapshot.findFirst).mockResolvedValue(mockSnapshot() as never)

      const result = await snapshotService.create(userId)

      expect(result.id).toBe('snapshot-123')
      expect(result.totalValue).toBe('4507.5')
      expect(result.assets).toHaveLength(1)
      expect(result.assets[0].ticker).toBe('VOO')
    })

    it('should calculate totalValue as sum of all position values', async () => {
      const assets = [
        mockAssetWithHolding({ id: 'asset-1', ticker: 'VOO', currentPrice: new Prisma.Decimal('450.00') }),
        mockAssetWithHolding({
          id: 'asset-2',
          ticker: 'VTI',
          currentPrice: new Prisma.Decimal('250.00'),
          holding: { quantity: new Prisma.Decimal('5') },
        }),
      ]
      vi.mocked(prisma.asset.findMany).mockResolvedValue(assets as never)
      vi.mocked(prisma.portfolioSnapshot.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.portfolioSnapshot.create).mockResolvedValue({
        id: 'snapshot-123',
        date: new Date('2026-01-10T00:00:00.000Z'),
        totalValue: new Prisma.Decimal('5750.00'), // (10 × 450) + (5 × 250) = 5750
        userId,
      } as never)
      vi.mocked(prisma.snapshotAsset.createMany).mockResolvedValue({ count: 2 } as never)
      vi.mocked(prisma.portfolioSnapshot.findFirst).mockResolvedValue(
        mockSnapshot({ totalValue: new Prisma.Decimal('5750.00') }) as never
      )

      const result = await snapshotService.create(userId)

      expect(result.totalValue).toBe('5750')
    })

    it('should include all assets with holdings in breakdown', async () => {
      const assets = [
        mockAssetWithHolding({ id: 'asset-1', ticker: 'VOO' }),
        mockAssetWithHolding({ id: 'asset-2', ticker: 'VTI' }),
      ]
      vi.mocked(prisma.asset.findMany).mockResolvedValue(assets as never)
      vi.mocked(prisma.portfolioSnapshot.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.portfolioSnapshot.create).mockResolvedValue({
        id: 'snapshot-123',
        totalValue: new Prisma.Decimal('9015.00'),
        userId,
      } as never)
      vi.mocked(prisma.snapshotAsset.createMany).mockResolvedValue({ count: 2 } as never)
      vi.mocked(prisma.portfolioSnapshot.findFirst).mockResolvedValue(
        mockSnapshot({
          assets: [
            { assetId: 'asset-1', ticker: 'VOO', name: 'Vanguard S&P 500', quantity: new Prisma.Decimal('10'), price: new Prisma.Decimal('450.75'), value: new Prisma.Decimal('4507.50'), percentage: new Prisma.Decimal('50.00') },
            { assetId: 'asset-2', ticker: 'VTI', name: 'Vanguard Total Stock', quantity: new Prisma.Decimal('10'), price: new Prisma.Decimal('450.75'), value: new Prisma.Decimal('4507.50'), percentage: new Prisma.Decimal('50.00') },
          ],
        }) as never
      )

      const result = await snapshotService.create(userId)

      expect(result.assets).toHaveLength(2)
    })

    it('should calculate percentage for each asset', async () => {
      const assets = [mockAssetWithHolding()]
      vi.mocked(prisma.asset.findMany).mockResolvedValue(assets as never)
      vi.mocked(prisma.portfolioSnapshot.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.portfolioSnapshot.create).mockResolvedValue({
        id: 'snapshot-123',
        totalValue: new Prisma.Decimal('4507.50'),
        userId,
      } as never)
      vi.mocked(prisma.snapshotAsset.createMany).mockResolvedValue({ count: 1 } as never)
      vi.mocked(prisma.portfolioSnapshot.findFirst).mockResolvedValue(mockSnapshot() as never)

      const result = await snapshotService.create(userId)

      expect(result.assets[0].percentage).toBe('100')
    })

    it('should update existing snapshot if one exists for today', async () => {
      const existingSnapshot = mockSnapshot()
      vi.mocked(prisma.asset.findMany).mockResolvedValue([mockAssetWithHolding()] as never)
      vi.mocked(prisma.portfolioSnapshot.findUnique).mockResolvedValue(existingSnapshot as never)
      vi.mocked(prisma.snapshotAsset.deleteMany).mockResolvedValue({ count: 1 } as never)
      vi.mocked(prisma.portfolioSnapshot.update).mockResolvedValue(existingSnapshot as never)
      vi.mocked(prisma.snapshotAsset.createMany).mockResolvedValue({ count: 1 } as never)
      vi.mocked(prisma.portfolioSnapshot.findFirst).mockResolvedValue(existingSnapshot as never)

      await snapshotService.create(userId)

      expect(prisma.portfolioSnapshot.update).toHaveBeenCalled()
      expect(prisma.snapshotAsset.deleteMany).toHaveBeenCalled()
    })

    it('should handle empty portfolio gracefully', async () => {
      vi.mocked(prisma.asset.findMany).mockResolvedValue([] as never)
      vi.mocked(prisma.portfolioSnapshot.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.portfolioSnapshot.create).mockResolvedValue({
        id: 'snapshot-123',
        date: new Date('2026-01-10T00:00:00.000Z'),
        totalValue: new Prisma.Decimal('0'),
        userId,
      } as never)
      vi.mocked(prisma.snapshotAsset.createMany).mockResolvedValue({ count: 0 } as never)
      vi.mocked(prisma.portfolioSnapshot.findFirst).mockResolvedValue(
        mockSnapshot({ totalValue: new Prisma.Decimal('0'), assets: [] }) as never
      )

      const result = await snapshotService.create(userId)

      expect(result.totalValue).toBe('0')
      expect(result.assets).toHaveLength(0)
    })

    it('should skip assets without holdings or prices', async () => {
      const assets = [
        mockAssetWithHolding({ id: 'asset-1', ticker: 'VOO' }),
        { id: 'asset-2', ticker: 'VTI', userId, currentPrice: null, holding: null }, // No price
        { id: 'asset-3', ticker: 'BTC', userId, currentPrice: new Prisma.Decimal('42000'), holding: null }, // No holding
      ]
      vi.mocked(prisma.asset.findMany).mockResolvedValue(assets as never)
      vi.mocked(prisma.portfolioSnapshot.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.portfolioSnapshot.create).mockResolvedValue({
        id: 'snapshot-123',
        totalValue: new Prisma.Decimal('4507.50'),
        userId,
      } as never)
      vi.mocked(prisma.snapshotAsset.createMany).mockResolvedValue({ count: 1 } as never)
      vi.mocked(prisma.portfolioSnapshot.findFirst).mockResolvedValue(mockSnapshot() as never)

      await snapshotService.create(userId)

      // Only one asset should be included in createMany
      expect(prisma.snapshotAsset.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ assetId: 'asset-1' }),
          ]),
        })
      )
    })
  })

  describe('list', () => {
    it('should return all snapshots for user sorted by date desc', async () => {
      const snapshots = [
        mockSnapshot({ id: 'snap-2', date: new Date('2026-01-10') }),
        mockSnapshot({ id: 'snap-1', date: new Date('2026-01-09') }),
      ]
      vi.mocked(prisma.portfolioSnapshot.findMany).mockResolvedValue(snapshots as never)

      const result = await snapshotService.list(userId)

      expect(result.snapshots).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(prisma.portfolioSnapshot.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: { assets: true },
        orderBy: { date: 'desc' },
      })
    })

    it('should filter by date range when from/to provided', async () => {
      vi.mocked(prisma.portfolioSnapshot.findMany).mockResolvedValue([] as never)

      await snapshotService.list(userId, {
        from: '2026-01-01',
        to: '2026-03-31',
      })

      expect(prisma.portfolioSnapshot.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          date: {
            gte: new Date('2026-01-01'),
            lte: new Date('2026-03-31'),
          },
        },
        include: { assets: true },
        orderBy: { date: 'desc' },
      })
    })

    it('should filter by from date only', async () => {
      vi.mocked(prisma.portfolioSnapshot.findMany).mockResolvedValue([] as never)

      await snapshotService.list(userId, { from: '2026-01-01' })

      expect(prisma.portfolioSnapshot.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          date: { gte: new Date('2026-01-01') },
        },
        include: { assets: true },
        orderBy: { date: 'desc' },
      })
    })

    it('should filter by to date only', async () => {
      vi.mocked(prisma.portfolioSnapshot.findMany).mockResolvedValue([] as never)

      await snapshotService.list(userId, { to: '2026-03-31' })

      expect(prisma.portfolioSnapshot.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          date: { lte: new Date('2026-03-31') },
        },
        include: { assets: true },
        orderBy: { date: 'desc' },
      })
    })

    it('should return empty array if no snapshots', async () => {
      vi.mocked(prisma.portfolioSnapshot.findMany).mockResolvedValue([] as never)

      const result = await snapshotService.list(userId)

      expect(result.snapshots).toEqual([])
      expect(result.total).toBe(0)
    })

    it('should not return other users snapshots', async () => {
      vi.mocked(prisma.portfolioSnapshot.findMany).mockResolvedValue([] as never)

      await snapshotService.list(userId)

      expect(prisma.portfolioSnapshot.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId }),
        })
      )
    })
  })

  describe('getById', () => {
    it('should return snapshot with full breakdown', async () => {
      vi.mocked(prisma.portfolioSnapshot.findFirst).mockResolvedValue(mockSnapshot() as never)

      const result = await snapshotService.getById(userId, 'snapshot-123')

      expect(result.id).toBe('snapshot-123')
      expect(result.totalValue).toBe('4507.5')
      expect(result.assets).toHaveLength(1)
      expect(result.assets[0]).toMatchObject({
        assetId: 'asset-123',
        ticker: 'VOO',
        name: 'Vanguard S&P 500 ETF',
        quantity: '10',
        price: '450.75',
        value: '4507.5',
        percentage: '100',
      })
    })

    it('should throw notFound if snapshot does not exist', async () => {
      vi.mocked(prisma.portfolioSnapshot.findFirst).mockResolvedValue(null)

      await expect(snapshotService.getById(userId, 'non-existent')).rejects.toThrow(AppError)

      await expect(snapshotService.getById(userId, 'non-existent')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'Snapshot not found',
      })
    })

    it('should throw notFound if snapshot belongs to other user', async () => {
      vi.mocked(prisma.portfolioSnapshot.findFirst).mockResolvedValue(null)

      await expect(snapshotService.getById(userId, 'other-user-snapshot')).rejects.toMatchObject({
        statusCode: 404,
      })
    })

    it('should verify ownership by filtering with userId', async () => {
      vi.mocked(prisma.portfolioSnapshot.findFirst).mockResolvedValue(mockSnapshot() as never)

      await snapshotService.getById(userId, 'snapshot-123')

      expect(prisma.portfolioSnapshot.findFirst).toHaveBeenCalledWith({
        where: { id: 'snapshot-123', userId },
        include: { assets: true },
      })
    })
  })
})
