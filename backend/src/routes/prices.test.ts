import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import express, { Express, Request, Response, NextFunction } from 'express'
import request from 'supertest'
import pricesRouter from './prices'

// Mock price service
vi.mock('@/services/priceService', () => ({
  priceService: {
    updatePrice: vi.fn(),
    batchUpdatePrices: vi.fn(),
  },
}))

import { priceService } from '@/services/priceService'
import { AppError } from '@/lib/errors'

// Mock response from updatePrice (already formatted, no BigInt)
const createMockPriceResponse = (overrides = {}) => ({
  id: 'asset-123',
  ticker: 'VOO',
  name: 'Vanguard S&P 500 ETF',
  currentPrice: '450.75',
  priceUpdatedAt: new Date('2026-01-09T15:30:00.000Z'),
  ...overrides,
})

// Mock authenticated user middleware
const mockAuthMiddleware = (userId = 'user-123') => (req: Request, _res: Response, next: NextFunction) => {
  req.user = { id: userId, email: 'test@example.com' }
  next()
}

describe('prices routes', () => {
  let app: Express

  // Request helpers
  const putPrice = (assetId: string, data: object) =>
    request(app).put(`/api/prices/${assetId}`).send(data)
  const putBatchPrices = (data: object) =>
    request(app).put('/api/prices/batch').send(data)

  beforeEach(() => {
    vi.clearAllMocks()
    app = express()
    app.use(express.json())
    app.use(mockAuthMiddleware())
    app.use('/api/prices', pricesRouter)

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

  describe('PUT /api/prices/:assetId', () => {
    it('should update price with valid data', async () => {
      const mockResponse = createMockPriceResponse({ currentPrice: '500.00' })
      vi.mocked(priceService.updatePrice).mockResolvedValue(mockResponse as never)

      const response = await putPrice('asset-123', { price: 500.00 })

      expect(response.status).toBe(200)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.currentPrice).toBe('500.00')
      expect(response.body.message).toBe('Price updated')
      expect(priceService.updatePrice).toHaveBeenCalledWith(
        'user-123',
        'asset-123',
        { price: 500.00 }
      )
    })

    it('should accept decimal prices', async () => {
      const mockResponse = createMockPriceResponse()
      vi.mocked(priceService.updatePrice).mockResolvedValue(mockResponse as never)

      const response = await putPrice('asset-123', { price: 450.75 })

      expect(response.status).toBe(200)
      expect(priceService.updatePrice).toHaveBeenCalledWith(
        'user-123',
        'asset-123',
        { price: 450.75 }
      )
    })

    it('should round price to 2 decimals', async () => {
      const mockResponse = createMockPriceResponse({ currentPrice: '101.00' })
      vi.mocked(priceService.updatePrice).mockResolvedValue(mockResponse as never)

      const response = await putPrice('asset-123', { price: 100.999 })

      expect(response.status).toBe(200)
      // Price should be rounded to 101.00
      expect(priceService.updatePrice).toHaveBeenCalledWith(
        'user-123',
        'asset-123',
        { price: 101 }
      )
    })

    it('should return 400 for zero price', async () => {
      const response = await putPrice('asset-123', { price: 0 })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('VALIDATION_ERROR')
      expect(priceService.updatePrice).not.toHaveBeenCalled()
    })

    it('should return 400 for negative price', async () => {
      const response = await putPrice('asset-123', { price: -10 })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('VALIDATION_ERROR')
      expect(priceService.updatePrice).not.toHaveBeenCalled()
    })

    it('should return 400 for missing price', async () => {
      const response = await putPrice('asset-123', {})

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('VALIDATION_ERROR')
      expect(priceService.updatePrice).not.toHaveBeenCalled()
    })

    it('should return 404 for non-existent asset', async () => {
      vi.mocked(priceService.updatePrice).mockRejectedValue(
        new AppError(404, 'NOT_FOUND', 'Asset not found')
      )

      const response = await putPrice('non-existent', { price: 100 })

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('NOT_FOUND')
      expect(response.body.message).toBe('Asset not found')
    })

    it('should return 404 for other user\'s asset', async () => {
      vi.mocked(priceService.updatePrice).mockRejectedValue(
        new AppError(404, 'NOT_FOUND', 'Asset not found')
      )

      const response = await putPrice('other-user-asset', { price: 100 })

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('NOT_FOUND')
    })

    it('should coerce string price to number', async () => {
      const mockResponse = createMockPriceResponse({ currentPrice: '500.50' })
      vi.mocked(priceService.updatePrice).mockResolvedValue(mockResponse as never)

      const response = await request(app)
        .put('/api/prices/asset-123')
        .send({ price: '500.50' })

      expect(response.status).toBe(200)
      expect(priceService.updatePrice).toHaveBeenCalledWith(
        'user-123',
        'asset-123',
        { price: 500.5 }
      )
    })
  })

  describe('PUT /api/prices/batch', () => {
    it('should update multiple prices atomically', async () => {
      const mockResult = {
        updated: 2,
        assets: [
          { id: 'asset-1', ticker: 'VOO', currentPrice: '450.75', priceUpdatedAt: new Date() },
          { id: 'asset-2', ticker: 'GLD', currentPrice: '85.30', priceUpdatedAt: new Date() },
        ],
      }
      vi.mocked(priceService.batchUpdatePrices).mockResolvedValue(mockResult as never)

      const response = await putBatchPrices({
        prices: [
          { assetId: 'asset-1', price: 450.75 },
          { assetId: 'asset-2', price: 85.30 },
        ],
      })

      expect(response.status).toBe(200)
      expect(response.body.data.updated).toBe(2)
      expect(response.body.message).toBe('2 prices updated')
      expect(priceService.batchUpdatePrices).toHaveBeenCalledWith(
        'user-123',
        {
          prices: [
            { assetId: 'asset-1', price: 450.75 },
            { assetId: 'asset-2', price: 85.3 },
          ],
        }
      )
    })

    it('should accept single price in batch', async () => {
      const mockResult = {
        updated: 1,
        assets: [
          { id: 'asset-1', ticker: 'VOO', currentPrice: '100.00', priceUpdatedAt: new Date() },
        ],
      }
      vi.mocked(priceService.batchUpdatePrices).mockResolvedValue(mockResult as never)

      const response = await putBatchPrices({
        prices: [{ assetId: 'asset-1', price: 100 }],
      })

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('1 prices updated')
    })

    it('should return 400 for empty prices array', async () => {
      const response = await putBatchPrices({ prices: [] })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('VALIDATION_ERROR')
      expect(priceService.batchUpdatePrices).not.toHaveBeenCalled()
    })

    it('should return 400 for missing prices field', async () => {
      const response = await putBatchPrices({})

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('VALIDATION_ERROR')
      expect(priceService.batchUpdatePrices).not.toHaveBeenCalled()
    })

    it('should return 400 if any price is invalid', async () => {
      const response = await putBatchPrices({
        prices: [
          { assetId: 'asset-1', price: 100 },
          { assetId: 'asset-2', price: -10 }, // Invalid
        ],
      })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('VALIDATION_ERROR')
      expect(priceService.batchUpdatePrices).not.toHaveBeenCalled()
    })

    it('should return 400 if any assetId is missing', async () => {
      const response = await putBatchPrices({
        prices: [
          { assetId: 'asset-1', price: 100 },
          { price: 200 }, // Missing assetId
        ],
      })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('VALIDATION_ERROR')
      expect(priceService.batchUpdatePrices).not.toHaveBeenCalled()
    })

    it('should return 404 if any asset not found', async () => {
      vi.mocked(priceService.batchUpdatePrices).mockRejectedValue(
        new AppError(404, 'NOT_FOUND', 'One or more assets not found', { notFound: ['asset-2'] })
      )

      const response = await putBatchPrices({
        prices: [
          { assetId: 'asset-1', price: 100 },
          { assetId: 'asset-2', price: 200 },
        ],
      })

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('NOT_FOUND')
      expect(response.body.details).toEqual({ notFound: ['asset-2'] })
    })

    it('should round all prices to 2 decimals', async () => {
      const mockResult = { updated: 2, assets: [] }
      vi.mocked(priceService.batchUpdatePrices).mockResolvedValue(mockResult)

      await putBatchPrices({
        prices: [
          { assetId: 'asset-1', price: 100.999 },
          { assetId: 'asset-2', price: 50.001 },
        ],
      })

      expect(priceService.batchUpdatePrices).toHaveBeenCalledWith(
        'user-123',
        {
          prices: [
            { assetId: 'asset-1', price: 101 },
            { assetId: 'asset-2', price: 50 },
          ],
        }
      )
    })
  })
})
