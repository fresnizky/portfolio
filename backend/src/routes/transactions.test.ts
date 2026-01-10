import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import express, { Express, Request, Response, NextFunction } from 'express'
import request from 'supertest'
import transactionsRouter from './transactions'

// Mock transaction service
vi.mock('@/services/transactionService', () => ({
  transactionService: {
    create: vi.fn(),
    list: vi.fn(),
    getById: vi.fn(),
  },
}))

import { transactionService } from '@/services/transactionService'
import { AppError } from '@/lib/errors'

// Mock response from service (already formatted)
const createMockTransaction = (overrides = {}) => ({
  id: 'tx-123',
  type: 'BUY',
  assetId: 'asset-123',
  asset: { ticker: 'VOO', name: 'Vanguard S&P 500 ETF' },
  date: '2026-01-10T10:00:00.000Z',
  quantity: '10',
  price: '450.75',
  commission: '5.00',
  totalCost: '4512.50',
  totalProceeds: undefined,
  createdAt: '2026-01-10T10:00:00.000Z',
  ...overrides,
})

// Mock authenticated user middleware
const mockAuthMiddleware =
  (userId = 'user-123') =>
  (req: Request, _res: Response, next: NextFunction) => {
    req.user = { id: userId, email: 'test@example.com' }
    next()
  }

describe('transactions routes', () => {
  let app: Express

  // Request helpers
  const postTransaction = (data: object) =>
    request(app).post('/api/transactions').send(data)
  const getTransactions = (query = '') =>
    request(app).get(`/api/transactions${query}`)
  const getTransaction = (id: string) =>
    request(app).get(`/api/transactions/${id}`)

  beforeEach(() => {
    vi.clearAllMocks()
    app = express()
    app.use(express.json())
    app.use(mockAuthMiddleware())
    app.use('/api/transactions', transactionsRouter)

    // Error handler
    app.use((err: AppError, _req: Request, res: Response, _next: NextFunction) => {
      res.status(err.statusCode || 500).json({
        error: err.code || 'INTERNAL_ERROR',
        message: err.message,
        details: err.details,
      })
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('POST /api/transactions', () => {
    const validBuyTransaction = {
      type: 'buy',
      assetId: 'asset-123',
      date: '2026-01-10T10:00:00.000Z',
      quantity: 10,
      price: 450.75,
      commission: 5,
    }

    it('should create a buy transaction', async () => {
      const mockTx = createMockTransaction()
      vi.mocked(transactionService.create).mockResolvedValue(mockTx as never)

      const response = await postTransaction(validBuyTransaction)

      expect(response.status).toBe(201)
      expect(response.body.data).toEqual(mockTx)
      expect(response.body.message).toBe('Transaction recorded')
      expect(transactionService.create).toHaveBeenCalledWith('user-123', {
        type: 'buy',
        assetId: 'asset-123',
        date: '2026-01-10T10:00:00.000Z',
        quantity: 10,
        price: 450.75,
        commission: 5,
      })
    })

    it('should create a sell transaction', async () => {
      const mockTx = createMockTransaction({
        type: 'SELL',
        totalCost: undefined,
        totalProceeds: '4502.50',
      })
      vi.mocked(transactionService.create).mockResolvedValue(mockTx as never)

      const response = await postTransaction({
        ...validBuyTransaction,
        type: 'sell',
      })

      expect(response.status).toBe(201)
      expect(response.body.data.type).toBe('SELL')
      expect(response.body.data.totalProceeds).toBe('4502.50')
    })

    it('should default commission to 0', async () => {
      const mockTx = createMockTransaction({ commission: '0.00' })
      vi.mocked(transactionService.create).mockResolvedValue(mockTx as never)

      const { commission, ...txWithoutCommission } = validBuyTransaction
      const response = await postTransaction(txWithoutCommission)

      expect(response.status).toBe(201)
      expect(transactionService.create).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({ commission: 0 })
      )
    })

    it('should return 400 for missing type', async () => {
      const { type, ...txWithoutType } = validBuyTransaction
      const response = await postTransaction(txWithoutType)

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('VALIDATION_ERROR')
      expect(transactionService.create).not.toHaveBeenCalled()
    })

    it('should return 400 for invalid type', async () => {
      const response = await postTransaction({
        ...validBuyTransaction,
        type: 'hold',
      })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for missing assetId', async () => {
      const { assetId, ...txWithoutAssetId } = validBuyTransaction
      const response = await postTransaction(txWithoutAssetId)

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for missing date', async () => {
      const { date, ...txWithoutDate } = validBuyTransaction
      const response = await postTransaction(txWithoutDate)

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for invalid date format', async () => {
      const response = await postTransaction({
        ...validBuyTransaction,
        date: '2026-01-10',
      })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for zero quantity', async () => {
      const response = await postTransaction({
        ...validBuyTransaction,
        quantity: 0,
      })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for negative quantity', async () => {
      const response = await postTransaction({
        ...validBuyTransaction,
        quantity: -10,
      })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for zero price', async () => {
      const response = await postTransaction({
        ...validBuyTransaction,
        price: 0,
      })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for negative commission', async () => {
      const response = await postTransaction({
        ...validBuyTransaction,
        commission: -5,
      })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('VALIDATION_ERROR')
    })

    it('should return 404 for non-existent asset', async () => {
      vi.mocked(transactionService.create).mockRejectedValue(
        new AppError(404, 'NOT_FOUND', 'Asset not found')
      )

      const response = await postTransaction(validBuyTransaction)

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('NOT_FOUND')
    })

    it('should return 400 for insufficient holdings on sell', async () => {
      vi.mocked(transactionService.create).mockRejectedValue(
        new AppError(400, 'VALIDATION_ERROR', 'Insufficient holdings', {
          available: '5',
          requested: '10',
        })
      )

      const response = await postTransaction({
        ...validBuyTransaction,
        type: 'sell',
      })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('VALIDATION_ERROR')
      expect(response.body.message).toBe('Insufficient holdings')
      expect(response.body.details).toEqual({
        available: '5',
        requested: '10',
      })
    })
  })

  describe('GET /api/transactions', () => {
    it('should list all transactions', async () => {
      const mockTransactions = [
        createMockTransaction(),
        createMockTransaction({ id: 'tx-456' }),
      ]
      vi.mocked(transactionService.list).mockResolvedValue({
        transactions: mockTransactions,
        total: 2,
      } as never)

      const response = await getTransactions()

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(2)
      expect(response.body.meta.total).toBe(2)
      expect(transactionService.list).toHaveBeenCalledWith('user-123', {})
    })

    it('should filter by assetId', async () => {
      vi.mocked(transactionService.list).mockResolvedValue({
        transactions: [],
        total: 0,
      } as never)

      await getTransactions('?assetId=asset-123')

      expect(transactionService.list).toHaveBeenCalledWith('user-123', {
        assetId: 'asset-123',
      })
    })

    it('should filter by type', async () => {
      vi.mocked(transactionService.list).mockResolvedValue({
        transactions: [],
        total: 0,
      } as never)

      await getTransactions('?type=buy')

      expect(transactionService.list).toHaveBeenCalledWith('user-123', {
        type: 'buy',
      })
    })

    it('should filter by date range', async () => {
      vi.mocked(transactionService.list).mockResolvedValue({
        transactions: [],
        total: 0,
      } as never)

      await getTransactions(
        '?fromDate=2026-01-01T00:00:00.000Z&toDate=2026-12-31T23:59:59.999Z'
      )

      expect(transactionService.list).toHaveBeenCalledWith('user-123', {
        fromDate: '2026-01-01T00:00:00.000Z',
        toDate: '2026-12-31T23:59:59.999Z',
      })
    })

    it('should apply multiple filters', async () => {
      vi.mocked(transactionService.list).mockResolvedValue({
        transactions: [],
        total: 0,
      } as never)

      await getTransactions('?assetId=asset-123&type=sell')

      expect(transactionService.list).toHaveBeenCalledWith('user-123', {
        assetId: 'asset-123',
        type: 'sell',
      })
    })

    it('should ignore invalid filters and return all', async () => {
      vi.mocked(transactionService.list).mockResolvedValue({
        transactions: [],
        total: 0,
      } as never)

      await getTransactions('?type=invalid')

      // Should call without query when validation fails
      expect(transactionService.list).toHaveBeenCalledWith('user-123')
    })
  })

  describe('GET /api/transactions/:id', () => {
    it('should return transaction by id', async () => {
      const mockTx = createMockTransaction()
      vi.mocked(transactionService.getById).mockResolvedValue(mockTx as never)

      const response = await getTransaction('tx-123')

      expect(response.status).toBe(200)
      expect(response.body.data).toEqual(mockTx)
      expect(transactionService.getById).toHaveBeenCalledWith('user-123', 'tx-123')
    })

    it('should return 404 for non-existent transaction', async () => {
      vi.mocked(transactionService.getById).mockRejectedValue(
        new AppError(404, 'NOT_FOUND', 'Transaction not found')
      )

      const response = await getTransaction('non-existent')

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('NOT_FOUND')
      expect(response.body.message).toBe('Transaction not found')
    })

    it('should return 404 for other user\'s transaction', async () => {
      vi.mocked(transactionService.getById).mockRejectedValue(
        new AppError(404, 'NOT_FOUND', 'Transaction not found')
      )

      const response = await getTransaction('other-user-tx')

      expect(response.status).toBe(404)
    })
  })
})
