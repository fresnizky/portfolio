import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import express, { Express, Request, Response, NextFunction } from 'express'
import request from 'supertest'
import dashboardRouter from './dashboard'

// Mock dashboard service
vi.mock('@/services/dashboardService', () => ({
  dashboardService: {
    getDashboard: vi.fn(),
  },
}))

import { dashboardService } from '@/services/dashboardService'
import { AppError } from '@/lib/errors'

// Mock authenticated user middleware
const mockAuthMiddleware =
  (userId = 'user-123') =>
  (req: Request, _res: Response, next: NextFunction) => {
    req.user = { id: userId, email: 'test@example.com' }
    next()
  }

describe('dashboard routes', () => {
  let app: Express

  // Request helper
  const getDashboard = (query?: Record<string, string>) => {
    const req = request(app).get('/api/dashboard')
    if (query) {
      return req.query(query)
    }
    return req
  }

  beforeEach(() => {
    vi.clearAllMocks()
    app = express()
    app.use(express.json())
    app.use(mockAuthMiddleware())
    app.use('/api/dashboard', dashboardRouter)

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

  describe('GET /api/dashboard', () => {
    it('should return dashboard data with positions and alerts', async () => {
      const mockDashboard = {
        totalValue: '10000.00',
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
            actualPercentage: '45.08',
            deviation: '-14.92',
            priceUpdatedAt: new Date('2026-01-09T15:30:00.000Z'),
          },
        ],
        alerts: [
          {
            type: 'rebalance_needed',
            assetId: 'asset-1',
            ticker: 'VOO',
            message: 'VOO is 14.9% underweight',
            severity: 'warning',
            data: { deviation: '-14.92', direction: 'underweight' },
          },
        ],
      }
      vi.mocked(dashboardService.getDashboard).mockResolvedValue(mockDashboard)

      const response = await getDashboard()

      expect(response.status).toBe(200)
      expect(response.body.data.totalValue).toBe('10000.00')
      expect(response.body.data.positions).toHaveLength(1)
      expect(response.body.data.alerts).toHaveLength(1)
      expect(dashboardService.getDashboard).toHaveBeenCalledWith('user-123', {
        deviationPct: 5,
        staleDays: 7,
      })
    })

    it('should return empty dashboard when user has no holdings', async () => {
      const mockDashboard = {
        totalValue: '0.00',
        positions: [],
        alerts: [],
      }
      vi.mocked(dashboardService.getDashboard).mockResolvedValue(mockDashboard)

      const response = await getDashboard()

      expect(response.status).toBe(200)
      expect(response.body.data.totalValue).toBe('0.00')
      expect(response.body.data.positions).toEqual([])
      expect(response.body.data.alerts).toEqual([])
    })

    it('should include calculated fields in positions', async () => {
      const mockDashboard = {
        totalValue: '10000.00',
        positions: [
          {
            assetId: 'asset-1',
            ticker: 'VOO',
            name: 'Vanguard S&P 500 ETF',
            category: 'ETF',
            quantity: '10',
            currentPrice: '600.00',
            value: '6000.00',
            targetPercentage: '60.00',
            actualPercentage: '60.00',
            deviation: '0.00',
            priceUpdatedAt: new Date('2026-01-09T15:30:00.000Z'),
          },
        ],
        alerts: [],
      }
      vi.mocked(dashboardService.getDashboard).mockResolvedValue(mockDashboard)

      const response = await getDashboard()

      expect(response.status).toBe(200)
      const position = response.body.data.positions[0]
      expect(position.actualPercentage).toBe('60.00')
      expect(position.deviation).toBe('0.00')
    })

    it('should accept custom deviationThreshold query param', async () => {
      const mockDashboard = {
        totalValue: '10000.00',
        positions: [],
        alerts: [],
      }
      vi.mocked(dashboardService.getDashboard).mockResolvedValue(mockDashboard)

      const response = await getDashboard({ deviationThreshold: '10' })

      expect(response.status).toBe(200)
      expect(dashboardService.getDashboard).toHaveBeenCalledWith('user-123', {
        deviationPct: 10,
        staleDays: 7,
      })
    })

    it('should accept custom staleDays query param', async () => {
      const mockDashboard = {
        totalValue: '10000.00',
        positions: [],
        alerts: [],
      }
      vi.mocked(dashboardService.getDashboard).mockResolvedValue(mockDashboard)

      const response = await getDashboard({ staleDays: '14' })

      expect(response.status).toBe(200)
      expect(dashboardService.getDashboard).toHaveBeenCalledWith('user-123', {
        deviationPct: 5,
        staleDays: 14,
      })
    })

    it('should accept both custom thresholds', async () => {
      const mockDashboard = {
        totalValue: '10000.00',
        positions: [],
        alerts: [],
      }
      vi.mocked(dashboardService.getDashboard).mockResolvedValue(mockDashboard)

      const response = await getDashboard({
        deviationThreshold: '3',
        staleDays: '3',
      })

      expect(response.status).toBe(200)
      expect(dashboardService.getDashboard).toHaveBeenCalledWith('user-123', {
        deviationPct: 3,
        staleDays: 3,
      })
    })

    it('should return 400 for invalid deviationThreshold', async () => {
      const response = await getDashboard({ deviationThreshold: '-5' })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for deviationThreshold > 100', async () => {
      const response = await getDashboard({ deviationThreshold: '150' })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for invalid staleDays', async () => {
      const response = await getDashboard({ staleDays: '0' })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('VALIDATION_ERROR')
    })

    it('should call service with authenticated user ID', async () => {
      const mockDashboard = {
        totalValue: '0.00',
        positions: [],
        alerts: [],
      }
      vi.mocked(dashboardService.getDashboard).mockResolvedValue(mockDashboard)

      await getDashboard()

      expect(dashboardService.getDashboard).toHaveBeenCalledWith(
        'user-123',
        expect.any(Object)
      )
    })

    it('should handle service errors', async () => {
      vi.mocked(dashboardService.getDashboard).mockRejectedValue(
        new AppError(500, 'INTERNAL_ERROR', 'Database error')
      )

      const response = await getDashboard()

      expect(response.status).toBe(500)
      expect(response.body.error).toBe('INTERNAL_ERROR')
    })
  })
})
