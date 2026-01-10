import { describe, it, expect, vi, beforeEach } from 'vitest'
import { transactionService } from './transactionService'
import { prisma } from '@/config/database'
import { AppError } from '@/lib/errors'

// Mock the database
vi.mock('@/config/database', () => ({
  prisma: {
    asset: {
      findFirst: vi.fn(),
    },
    holding: {
      findFirst: vi.fn(),
    },
    transaction: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

const userId = 'user-123'
const assetId = 'asset-123'

const mockAsset = {
  id: assetId,
  ticker: 'VOO',
  name: 'Vanguard S&P 500 ETF',
  userId,
}

const mockHolding = {
  id: 'holding-123',
  quantity: { toString: () => '100' },
  userId,
  assetId,
}

const createMockTransaction = (overrides = {}) => ({
  id: 'tx-123',
  type: 'BUY' as const,
  date: new Date('2026-01-10T10:00:00.000Z'),
  quantity: { toString: () => '10' },
  priceCents: BigInt(45075),
  commissionCents: BigInt(500),
  totalCents: BigInt(451250), // (10 × 45075) + 500
  userId,
  assetId,
  createdAt: new Date('2026-01-10T10:00:00.000Z'),
  updatedAt: new Date('2026-01-10T10:00:00.000Z'),
  asset: { ticker: 'VOO', name: 'Vanguard S&P 500 ETF' },
  ...overrides,
})

describe('transactionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should create a buy transaction with correct totalCost', async () => {
      const mockTx = createMockTransaction()
      vi.mocked(prisma.asset.findFirst).mockResolvedValue(mockAsset as never)
      vi.mocked(prisma.transaction.create).mockResolvedValue(mockTx as never)

      const result = await transactionService.create(userId, {
        type: 'buy',
        assetId,
        date: '2026-01-10T10:00:00.000Z',
        quantity: 10,
        price: 450.75,
        commission: 5,
      })

      expect(result.type).toBe('BUY')
      expect(result.quantity).toBe('10')
      expect(result.price).toBe('450.75')
      expect(result.commission).toBe('5.00')
      expect(result.totalCost).toBe('4512.50') // (10 × 450.75) + 5 = 4512.50
      expect(result.totalProceeds).toBeUndefined()
    })

    it('should create a sell transaction with correct totalProceeds', async () => {
      const mockTx = createMockTransaction({
        type: 'SELL',
        totalCents: BigInt(450250), // (10 × 45075) - 500
      })
      vi.mocked(prisma.asset.findFirst).mockResolvedValue(mockAsset as never)
      vi.mocked(prisma.holding.findFirst).mockResolvedValue(mockHolding as never)
      vi.mocked(prisma.transaction.create).mockResolvedValue(mockTx as never)

      const result = await transactionService.create(userId, {
        type: 'sell',
        assetId,
        date: '2026-01-10T10:00:00.000Z',
        quantity: 10,
        price: 450.75,
        commission: 5,
      })

      expect(result.type).toBe('SELL')
      expect(result.totalProceeds).toBe('4502.50') // (10 × 450.75) - 5 = 4502.50
      expect(result.totalCost).toBeUndefined()
    })

    it('should throw notFound if asset does not exist', async () => {
      vi.mocked(prisma.asset.findFirst).mockResolvedValue(null)

      await expect(
        transactionService.create(userId, {
          type: 'buy',
          assetId: 'non-existent',
          date: '2026-01-10T10:00:00.000Z',
          quantity: 10,
          price: 100,
          commission: 0,
        })
      ).rejects.toThrow(AppError)

      await expect(
        transactionService.create(userId, {
          type: 'buy',
          assetId: 'non-existent',
          date: '2026-01-10T10:00:00.000Z',
          quantity: 10,
          price: 100,
          commission: 0,
        })
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'Asset not found',
      })
    })

    it('should throw notFound if asset belongs to another user', async () => {
      vi.mocked(prisma.asset.findFirst).mockResolvedValue(null)

      await expect(
        transactionService.create(userId, {
          type: 'buy',
          assetId: 'other-user-asset',
          date: '2026-01-10T10:00:00.000Z',
          quantity: 10,
          price: 100,
          commission: 0,
        })
      ).rejects.toMatchObject({
        statusCode: 404,
      })
    })

    it('should verify asset ownership', async () => {
      vi.mocked(prisma.asset.findFirst).mockResolvedValue(mockAsset as never)
      vi.mocked(prisma.transaction.create).mockResolvedValue(createMockTransaction() as never)

      await transactionService.create(userId, {
        type: 'buy',
        assetId,
        date: '2026-01-10T10:00:00.000Z',
        quantity: 10,
        price: 100,
        commission: 0,
      })

      expect(prisma.asset.findFirst).toHaveBeenCalledWith({
        where: { id: assetId, userId },
      })
    })

    it('should validate sell quantity against holdings', async () => {
      vi.mocked(prisma.asset.findFirst).mockResolvedValue(mockAsset as never)
      vi.mocked(prisma.holding.findFirst).mockResolvedValue(mockHolding as never)
      vi.mocked(prisma.transaction.create).mockResolvedValue(
        createMockTransaction({ type: 'SELL' }) as never
      )

      await transactionService.create(userId, {
        type: 'sell',
        assetId,
        date: '2026-01-10T10:00:00.000Z',
        quantity: 50, // Less than 100 in holdings
        price: 100,
        commission: 0,
      })

      expect(prisma.holding.findFirst).toHaveBeenCalledWith({
        where: { userId, assetId },
      })
    })

    it('should handle fractional quantities (crypto)', async () => {
      const mockTx = createMockTransaction({
        quantity: { toString: () => '0.00012345' },
        priceCents: BigInt(4200000), // $42,000
        commissionCents: BigInt(0),
        totalCents: BigInt(518), // 0.00012345 × 4200000 ≈ 518
      })
      vi.mocked(prisma.asset.findFirst).mockResolvedValue(mockAsset as never)
      vi.mocked(prisma.transaction.create).mockResolvedValue(mockTx as never)

      const result = await transactionService.create(userId, {
        type: 'buy',
        assetId,
        date: '2026-01-10T10:00:00.000Z',
        quantity: 0.00012345,
        price: 42000,
        commission: 0,
      })

      expect(result.quantity).toBe('0.00012345')
    })

    it('should include asset info in response', async () => {
      vi.mocked(prisma.asset.findFirst).mockResolvedValue(mockAsset as never)
      vi.mocked(prisma.transaction.create).mockResolvedValue(createMockTransaction() as never)

      const result = await transactionService.create(userId, {
        type: 'buy',
        assetId,
        date: '2026-01-10T10:00:00.000Z',
        quantity: 10,
        price: 100,
        commission: 0,
      })

      expect(result.asset).toEqual({
        ticker: 'VOO',
        name: 'Vanguard S&P 500 ETF',
      })
    })

    it('should store transaction with uppercase type', async () => {
      vi.mocked(prisma.asset.findFirst).mockResolvedValue(mockAsset as never)
      vi.mocked(prisma.transaction.create).mockResolvedValue(createMockTransaction() as never)

      await transactionService.create(userId, {
        type: 'buy',
        assetId,
        date: '2026-01-10T10:00:00.000Z',
        quantity: 10,
        price: 100,
        commission: 0,
      })

      expect(prisma.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: 'BUY' }),
        })
      )
    })
  })

  describe('validateSellQuantity', () => {
    it('should throw validation error when no holdings exist', async () => {
      vi.mocked(prisma.holding.findFirst).mockResolvedValue(null)

      await expect(
        transactionService.validateSellQuantity(userId, assetId, 10)
      ).rejects.toThrow(AppError)

      await expect(
        transactionService.validateSellQuantity(userId, assetId, 10)
      ).rejects.toMatchObject({
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: 'Insufficient holdings',
        details: { available: '0', requested: '10' },
      })
    })

    it('should throw validation error when holdings are insufficient', async () => {
      vi.mocked(prisma.holding.findFirst).mockResolvedValue({
        ...mockHolding,
        quantity: { toString: () => '5' },
      } as never)

      await expect(
        transactionService.validateSellQuantity(userId, assetId, 10)
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'Insufficient holdings',
        details: { available: '5', requested: '10' },
      })
    })

    it('should pass when holdings are sufficient', async () => {
      vi.mocked(prisma.holding.findFirst).mockResolvedValue(mockHolding as never)

      await expect(
        transactionService.validateSellQuantity(userId, assetId, 50)
      ).resolves.not.toThrow()
    })

    it('should pass when selling exact holdings amount', async () => {
      vi.mocked(prisma.holding.findFirst).mockResolvedValue(mockHolding as never)

      await expect(
        transactionService.validateSellQuantity(userId, assetId, 100)
      ).resolves.not.toThrow()
    })
  })

  describe('list', () => {
    it('should list all user transactions', async () => {
      const mockTransactions = [createMockTransaction(), createMockTransaction({ id: 'tx-456' })]
      vi.mocked(prisma.transaction.findMany).mockResolvedValue(mockTransactions as never)
      vi.mocked(prisma.transaction.count).mockResolvedValue(2)

      const result = await transactionService.list(userId)

      expect(result.transactions).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(prisma.transaction.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: { asset: { select: { ticker: true, name: true } } },
        orderBy: { date: 'desc' },
      })
    })

    it('should filter by assetId', async () => {
      vi.mocked(prisma.transaction.findMany).mockResolvedValue([])
      vi.mocked(prisma.transaction.count).mockResolvedValue(0)

      await transactionService.list(userId, { assetId: 'asset-456' })

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId, assetId: 'asset-456' },
        })
      )
    })

    it('should filter by type', async () => {
      vi.mocked(prisma.transaction.findMany).mockResolvedValue([])
      vi.mocked(prisma.transaction.count).mockResolvedValue(0)

      await transactionService.list(userId, { type: 'buy' })

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId, type: 'BUY' },
        })
      )
    })

    it('should filter by date range', async () => {
      vi.mocked(prisma.transaction.findMany).mockResolvedValue([])
      vi.mocked(prisma.transaction.count).mockResolvedValue(0)

      await transactionService.list(userId, {
        fromDate: '2026-01-01T00:00:00.000Z',
        toDate: '2026-12-31T23:59:59.999Z',
      })

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId,
            date: {
              gte: new Date('2026-01-01T00:00:00.000Z'),
              lte: new Date('2026-12-31T23:59:59.999Z'),
            },
          },
        })
      )
    })

    it('should apply multiple filters', async () => {
      vi.mocked(prisma.transaction.findMany).mockResolvedValue([])
      vi.mocked(prisma.transaction.count).mockResolvedValue(0)

      await transactionService.list(userId, {
        assetId: 'asset-123',
        type: 'sell',
        fromDate: '2026-01-01T00:00:00.000Z',
      })

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId,
            assetId: 'asset-123',
            type: 'SELL',
            date: { gte: new Date('2026-01-01T00:00:00.000Z') },
          },
        })
      )
    })

    it('should order by date descending', async () => {
      vi.mocked(prisma.transaction.findMany).mockResolvedValue([])
      vi.mocked(prisma.transaction.count).mockResolvedValue(0)

      await transactionService.list(userId)

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { date: 'desc' },
        })
      )
    })
  })

  describe('getById', () => {
    it('should return transaction by id', async () => {
      vi.mocked(prisma.transaction.findFirst).mockResolvedValue(createMockTransaction() as never)

      const result = await transactionService.getById(userId, 'tx-123')

      expect(result.id).toBe('tx-123')
      expect(prisma.transaction.findFirst).toHaveBeenCalledWith({
        where: { id: 'tx-123', userId },
        include: { asset: { select: { ticker: true, name: true } } },
      })
    })

    it('should throw notFound if transaction does not exist', async () => {
      vi.mocked(prisma.transaction.findFirst).mockResolvedValue(null)

      await expect(transactionService.getById(userId, 'non-existent')).rejects.toThrow(AppError)

      await expect(transactionService.getById(userId, 'non-existent')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'Transaction not found',
      })
    })

    it('should throw notFound if transaction belongs to another user', async () => {
      vi.mocked(prisma.transaction.findFirst).mockResolvedValue(null)

      await expect(transactionService.getById(userId, 'other-user-tx')).rejects.toMatchObject({
        statusCode: 404,
      })
    })

    it('should format response correctly for buy transaction', async () => {
      vi.mocked(prisma.transaction.findFirst).mockResolvedValue(createMockTransaction() as never)

      const result = await transactionService.getById(userId, 'tx-123')

      expect(result.totalCost).toBe('4512.50')
      expect(result.totalProceeds).toBeUndefined()
    })

    it('should format response correctly for sell transaction', async () => {
      vi.mocked(prisma.transaction.findFirst).mockResolvedValue(
        createMockTransaction({
          type: 'SELL',
          totalCents: BigInt(450250),
        }) as never
      )

      const result = await transactionService.getById(userId, 'tx-123')

      expect(result.totalProceeds).toBe('4502.50')
      expect(result.totalCost).toBeUndefined()
    })
  })
})
