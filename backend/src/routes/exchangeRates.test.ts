import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import express, { Express, Request, Response, NextFunction } from 'express'
import request from 'supertest'
import exchangeRatesRouter from './exchangeRates'

// Mock exchange rate service
vi.mock('@/services/exchangeRateService', () => ({
  exchangeRateService: {
    getRate: vi.fn(),
  },
}))

import { exchangeRateService } from '@/services/exchangeRateService'
import { AppError } from '@/lib/errors'

// Mock response from getRate
const createMockRateResponse = (overrides = {}) => ({
  rate: 1050.5,
  fetchedAt: new Date('2026-01-11T15:30:00.000Z'),
  isStale: false,
  source: 'bluelytics',
  ...overrides,
})

// Mock authenticated user middleware
const mockAuthMiddleware =
  (userId = 'user-123') =>
  (req: Request, _res: Response, next: NextFunction) => {
    req.user = { id: userId, email: 'test@example.com' }
    next()
  }

describe('exchange-rates routes', () => {
  let app: Express

  const getCurrent = () => request(app).get('/api/exchange-rates/current')

  beforeEach(() => {
    vi.clearAllMocks()
    app = express()
    app.use(express.json())
    app.use(mockAuthMiddleware())
    app.use('/api/exchange-rates', exchangeRatesRouter)

    // Error handler
    app.use(
      (err: AppError, _req: Request, res: Response, _next: NextFunction) => {
        res.status(err.statusCode || 500).json({
          error: err.code || 'INTERNAL_ERROR',
          message: err.message,
          details: err.details,
        })
      }
    )
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('GET /api/exchange-rates/current', () => {
    it('should return current exchange rate', async () => {
      const mockResponse = createMockRateResponse()
      vi.mocked(exchangeRateService.getRate).mockResolvedValue(mockResponse)

      const response = await getCurrent()

      expect(response.status).toBe(200)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.baseCurrency).toBe('USD')
      expect(response.body.data.quoteCurrency).toBe('ARS')
      expect(response.body.data.rate).toBe(1050.5)
      expect(response.body.data.isStale).toBe(false)
      expect(response.body.data.source).toBe('bluelytics')
      expect(exchangeRateService.getRate).toHaveBeenCalledWith('USD', 'ARS')
    })

    it('should include fetchedAt as ISO string', async () => {
      const mockResponse = createMockRateResponse()
      vi.mocked(exchangeRateService.getRate).mockResolvedValue(mockResponse)

      const response = await getCurrent()

      expect(response.status).toBe(200)
      expect(response.body.data.fetchedAt).toBe('2026-01-11T15:30:00.000Z')
    })

    it('should include isStale flag when rate is stale', async () => {
      const mockResponse = createMockRateResponse({ isStale: true })
      vi.mocked(exchangeRateService.getRate).mockResolvedValue(mockResponse)

      const response = await getCurrent()

      expect(response.status).toBe(200)
      expect(response.body.data.isStale).toBe(true)
    })

    it('should return 500 when exchange rate service fails', async () => {
      vi.mocked(exchangeRateService.getRate).mockRejectedValue(
        new AppError(500, 'INTERNAL_ERROR', 'Exchange rate unavailable')
      )

      const response = await getCurrent()

      expect(response.status).toBe(500)
      expect(response.body.error).toBe('INTERNAL_ERROR')
      expect(response.body.message).toBe('Exchange rate unavailable')
    })
  })
})
