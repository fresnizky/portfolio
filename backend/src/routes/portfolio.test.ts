import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import express, { Express, Request, Response, NextFunction } from 'express'
import request from 'supertest'
import portfolioRouter from './portfolio'

// Mock portfolio service
vi.mock('@/services/portfolioService', () => ({
  portfolioService: {
    getSummary: vi.fn(),
  },
}))

import { portfolioService } from '@/services/portfolioService'
import { AppError } from '@/lib/errors'

// Mock authenticated user middleware
const mockAuthMiddleware = (userId = 'user-123') => (req: Request, _res: Response, next: NextFunction) => {
  req.user = { id: userId, email: 'test@example.com' }
  next()
}

describe('portfolio routes', () => {
  let app: Express

  // Request helper
  const getSummary = () => request(app).get('/api/portfolio/summary')

  beforeEach(() => {
    vi.clearAllMocks()
    app = express()
    app.use(express.json())
    app.use(mockAuthMiddleware())
    app.use('/api/portfolio', portfolioRouter)

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

  describe('GET /api/portfolio/summary', () => {
    it('should return portfolio summary with positions and totalValue', async () => {
      const mockSummary = {
        totalValue: '10032.50',
        positions: [
          {
            assetId: 'asset-1',
            ticker: 'VOO',
            name: 'Vanguard S&P 500 ETF',
            category: 'ETF',
            quantity: '10',
            currentPrice: '450.75',
            value: '4507.50',
            targetPercentage: '60.00',
            priceUpdatedAt: new Date('2026-01-09T15:30:00.000Z'),
          },
          {
            assetId: 'asset-2',
            ticker: 'GLD',
            name: 'SPDR Gold Trust',
            category: 'ETF',
            quantity: '50',
            currentPrice: '85.30',
            value: '4265.00',
            targetPercentage: '30.00',
            priceUpdatedAt: new Date('2026-01-09T15:30:00.000Z'),
          },
        ],
      }
      vi.mocked(portfolioService.getSummary).mockResolvedValue(mockSummary as never)

      const response = await getSummary()

      expect(response.status).toBe(200)
      expect(response.body.data.totalValue).toBe('10032.50')
      expect(response.body.data.positions).toHaveLength(2)
      expect(portfolioService.getSummary).toHaveBeenCalledWith('user-123')
    })

    it('should return empty portfolio when user has no holdings', async () => {
      const mockSummary = {
        totalValue: '0.00',
        positions: [],
      }
      vi.mocked(portfolioService.getSummary).mockResolvedValue(mockSummary)

      const response = await getSummary()

      expect(response.status).toBe(200)
      expect(response.body.data.totalValue).toBe('0.00')
      expect(response.body.data.positions).toEqual([])
    })

    it('should include all position details in response', async () => {
      const priceUpdatedAt = new Date('2026-01-09T15:30:00.000Z')
      const mockSummary = {
        totalValue: '4507.50',
        positions: [
          {
            assetId: 'asset-1',
            ticker: 'VOO',
            name: 'Vanguard S&P 500 ETF',
            category: 'ETF',
            quantity: '10',
            currentPrice: '450.75',
            value: '4507.50',
            targetPercentage: '60.00',
            priceUpdatedAt,
          },
        ],
      }
      vi.mocked(portfolioService.getSummary).mockResolvedValue(mockSummary as never)

      const response = await getSummary()

      expect(response.status).toBe(200)
      const position = response.body.data.positions[0]
      expect(position.assetId).toBe('asset-1')
      expect(position.ticker).toBe('VOO')
      expect(position.name).toBe('Vanguard S&P 500 ETF')
      expect(position.category).toBe('ETF')
      expect(position.quantity).toBe('10')
      expect(position.currentPrice).toBe('450.75')
      expect(position.value).toBe('4507.50')
      expect(position.targetPercentage).toBe('60.00')
      expect(position.priceUpdatedAt).toBeDefined()
    })

    it('should handle positions without prices', async () => {
      const mockSummary = {
        totalValue: '0.00',
        positions: [
          {
            assetId: 'asset-1',
            ticker: 'CASH',
            name: 'Cash',
            category: 'CASH',
            quantity: '1000',
            currentPrice: null,
            value: '0.00',
            targetPercentage: '10.00',
            priceUpdatedAt: null,
          },
        ],
      }
      vi.mocked(portfolioService.getSummary).mockResolvedValue(mockSummary as never)

      const response = await getSummary()

      expect(response.status).toBe(200)
      expect(response.body.data.positions[0].currentPrice).toBeNull()
      expect(response.body.data.positions[0].value).toBe('0.00')
    })

    it('should call service with authenticated user ID', async () => {
      const mockSummary = { totalValue: '0.00', positions: [] }
      vi.mocked(portfolioService.getSummary).mockResolvedValue(mockSummary)

      await getSummary()

      expect(portfolioService.getSummary).toHaveBeenCalledWith('user-123')
    })

    it('should handle service errors', async () => {
      vi.mocked(portfolioService.getSummary).mockRejectedValue(
        new AppError(500, 'INTERNAL_ERROR', 'Database error')
      )

      const response = await getSummary()

      expect(response.status).toBe(500)
      expect(response.body.error).toBe('INTERNAL_ERROR')
    })
  })
})
