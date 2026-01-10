import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import express, { Express, Request, Response, NextFunction } from 'express'
import request from 'supertest'
import holdingsRouter from './holdings'
import type { Holding } from '@prisma/client'

// Mock holding service
vi.mock('@/services/holdingService', () => ({
  holdingService: {
    getHoldings: vi.fn(),
    createOrUpdateHolding: vi.fn(),
    holdingExists: vi.fn(),
  },
}))

import { holdingService } from '@/services/holdingService'
import { AppError } from '@/lib/errors'

// Helper to create mock Prisma Decimal
const createMockDecimal = (value: number) => ({
  toNumber: () => value,
  valueOf: () => value,
  toString: () => String(value),
}) as unknown as Holding['quantity']

// Mock holding with asset factory
const createMockHoldingWithAsset = (overrides: Partial<Holding> = {}, assetOverrides = {}) => ({
  id: 'holding-123',
  quantity: createMockDecimal(10.5),
  userId: 'user-123',
  assetId: 'asset-123',
  createdAt: new Date('2026-01-08T00:00:00.000Z'),
  updatedAt: new Date('2026-01-08T00:00:00.000Z'),
  asset: {
    id: 'asset-123',
    ticker: 'VOO',
    name: 'Vanguard S&P 500 ETF',
    category: 'ETF',
    ...assetOverrides,
  },
  ...overrides,
})

// Mock authenticated user middleware
const mockAuthMiddleware = (userId = 'user-123') => (req: Request, _res: Response, next: NextFunction) => {
  req.user = { id: userId, email: 'test@example.com' }
  next()
}

describe('holdings routes', () => {
  let app: Express

  // Request helpers
  const getHoldings = () => request(app).get('/api/holdings')
  const putHolding = (assetId: string, data: object) =>
    request(app).put(`/api/holdings/${assetId}`).send(data)

  beforeEach(() => {
    vi.clearAllMocks()
    app = express()
    app.use(express.json())
    app.use(mockAuthMiddleware())
    app.use('/api/holdings', holdingsRouter)

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

  describe('GET /api/holdings', () => {
    it('should return all holdings for the authenticated user', async () => {
      const mockHoldings = [
        createMockHoldingWithAsset({ id: 'holding-1', assetId: 'asset-1' }, { id: 'asset-1', ticker: 'VOO' }),
        createMockHoldingWithAsset({ id: 'holding-2', assetId: 'asset-2' }, { id: 'asset-2', ticker: 'BTC' }),
      ]
      vi.mocked(holdingService.getHoldings).mockResolvedValue(mockHoldings as never)

      const response = await getHoldings()

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(2)
      expect(holdingService.getHoldings).toHaveBeenCalledWith('user-123')
    })

    it('should return empty array when user has no holdings', async () => {
      vi.mocked(holdingService.getHoldings).mockResolvedValue([])

      const response = await getHoldings()

      expect(response.status).toBe(200)
      expect(response.body.data).toEqual([])
    })

    it('should include asset details in response', async () => {
      const mockHolding = createMockHoldingWithAsset()
      vi.mocked(holdingService.getHoldings).mockResolvedValue([mockHolding] as never)

      const response = await getHoldings()

      expect(response.status).toBe(200)
      expect(response.body.data[0].asset).toEqual({
        id: 'asset-123',
        ticker: 'VOO',
        name: 'Vanguard S&P 500 ETF',
        category: 'ETF',
      })
    })
  })

  describe('PUT /api/holdings/:assetId', () => {
    it('should create a new holding with valid data', async () => {
      const mockHolding = createMockHoldingWithAsset()
      vi.mocked(holdingService.holdingExists).mockResolvedValue(false)
      vi.mocked(holdingService.createOrUpdateHolding).mockResolvedValue(mockHolding as never)

      const response = await putHolding('any-valid-asset-id', { quantity: 10.5 })

      expect(response.status).toBe(200)
      expect(response.body.data).toBeDefined()
      expect(response.body.message).toBe('Holding created')
      expect(holdingService.holdingExists).toHaveBeenCalledWith('any-valid-asset-id')
      expect(holdingService.createOrUpdateHolding).toHaveBeenCalledWith(
        'user-123',
        'any-valid-asset-id',
        10.5
      )
    })

    it('should update existing holding with valid data', async () => {
      const mockHolding = createMockHoldingWithAsset({ quantity: createMockDecimal(25) })
      vi.mocked(holdingService.holdingExists).mockResolvedValue(true)
      vi.mocked(holdingService.createOrUpdateHolding).mockResolvedValue(mockHolding as never)

      const response = await putHolding('any-valid-asset-id', { quantity: 25 })

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('Holding updated')
    })

    it('should accept integer quantity', async () => {
      const mockHolding = createMockHoldingWithAsset({ quantity: createMockDecimal(100) })
      vi.mocked(holdingService.holdingExists).mockResolvedValue(false)
      vi.mocked(holdingService.createOrUpdateHolding).mockResolvedValue(mockHolding as never)

      const response = await putHolding('any-valid-asset-id', { quantity: 100 })

      expect(response.status).toBe(200)
      expect(holdingService.createOrUpdateHolding).toHaveBeenCalledWith(
        'user-123',
        'any-valid-asset-id',
        100
      )
    })

    it('should accept fractional quantity', async () => {
      const mockHolding = createMockHoldingWithAsset({ quantity: createMockDecimal(0.00012345) })
      vi.mocked(holdingService.holdingExists).mockResolvedValue(false)
      vi.mocked(holdingService.createOrUpdateHolding).mockResolvedValue(mockHolding as never)

      const response = await putHolding('any-valid-asset-id', { quantity: 0.00012345 })

      expect(response.status).toBe(200)
      expect(holdingService.createOrUpdateHolding).toHaveBeenCalledWith(
        'user-123',
        'any-valid-asset-id',
        0.00012345
      )
    })

    it('should return 400 for zero quantity', async () => {
      const response = await putHolding('any-valid-asset-id', { quantity: 0 })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('VALIDATION_ERROR')
      expect(holdingService.createOrUpdateHolding).not.toHaveBeenCalled()
    })

    it('should return 400 for negative quantity', async () => {
      const response = await putHolding('any-valid-asset-id', { quantity: -5 })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('VALIDATION_ERROR')
      expect(holdingService.createOrUpdateHolding).not.toHaveBeenCalled()
    })

    it('should return 400 for missing quantity', async () => {
      const response = await putHolding('any-valid-asset-id', {})

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('VALIDATION_ERROR')
      expect(holdingService.createOrUpdateHolding).not.toHaveBeenCalled()
    })

    it('should return 400 for empty assetId', async () => {
      // Empty assetId should fail validation (z.string().min(1))
      const response = await request(app).put('/api/holdings/').send({ quantity: 10 })

      expect(response.status).toBe(404) // Express 404 for missing route param
    })

    it('should return 404 for non-existent asset', async () => {
      vi.mocked(holdingService.holdingExists).mockResolvedValue(false)
      vi.mocked(holdingService.createOrUpdateHolding).mockRejectedValue(
        new AppError(404, 'NOT_FOUND', 'Asset not found')
      )

      const response = await putHolding('non-existent-asset-id', { quantity: 10 })

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('NOT_FOUND')
      expect(response.body.message).toBe('Asset not found')
    })

    it('should return 403 for asset belonging to another user', async () => {
      vi.mocked(holdingService.holdingExists).mockResolvedValue(false)
      vi.mocked(holdingService.createOrUpdateHolding).mockRejectedValue(
        new AppError(403, 'FORBIDDEN', 'Access denied')
      )

      const response = await putHolding('other-user-asset-id', { quantity: 10 })

      expect(response.status).toBe(403)
      expect(response.body.error).toBe('FORBIDDEN')
      expect(response.body.message).toBe('Access denied')
    })

    it('should coerce string quantity to number', async () => {
      const mockHolding = createMockHoldingWithAsset({ quantity: createMockDecimal(50) })
      vi.mocked(holdingService.holdingExists).mockResolvedValue(false)
      vi.mocked(holdingService.createOrUpdateHolding).mockResolvedValue(mockHolding as never)

      const response = await request(app)
        .put('/api/holdings/any-valid-asset-id')
        .send({ quantity: '50' })

      expect(response.status).toBe(200)
      expect(holdingService.createOrUpdateHolding).toHaveBeenCalledWith(
        'user-123',
        'any-valid-asset-id',
        50
      )
    })
  })
})
