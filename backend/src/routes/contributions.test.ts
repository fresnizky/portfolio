import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import express, { Express, Request, Response, NextFunction } from 'express'
import request from 'supertest'
import contributionsRouter from './contributions'

// Mock contribution service
vi.mock('@/services/contributionService', () => ({
  contributionService: {
    getSuggestion: vi.fn(),
  },
}))

import { contributionService } from '@/services/contributionService'
import { AppError } from '@/lib/errors'

// Mock authenticated user middleware
const mockAuthMiddleware =
  (userId = 'user-123') =>
  (req: Request, _res: Response, next: NextFunction) => {
    req.user = { id: userId, email: 'test@example.com' }
    next()
  }

describe('contributions routes', () => {
  let app: Express

  // Request helper
  const postSuggest = (body: Record<string, unknown>) => {
    return request(app).post('/api/contributions/suggest').send(body)
  }

  beforeEach(() => {
    vi.clearAllMocks()
    app = express()
    app.use(express.json())
    app.use(mockAuthMiddleware())
    app.use('/api/contributions', contributionsRouter)

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

  describe('POST /api/contributions/suggest', () => {
    it('returns suggestion with allocations (AC #1)', async () => {
      const mockSuggestion = {
        amount: '1000.00',
        displayCurrency: 'USD',
        allocations: [
          {
            assetId: 'a1',
            ticker: 'VOO',
            name: 'Vanguard S&P 500',
            targetPercentage: '60.00',
            actualPercentage: '55.00',
            deviation: '-5.00',
            baseAllocation: '600.00',
            adjustedAllocation: '650.00',
            adjustmentReason: 'underweight',
          },
          {
            assetId: 'a2',
            ticker: 'GLD',
            name: 'SPDR Gold',
            targetPercentage: '20.00',
            actualPercentage: '20.00',
            deviation: '0.00',
            baseAllocation: '200.00',
            adjustedAllocation: '200.00',
            adjustmentReason: null,
          },
          {
            assetId: 'a3',
            ticker: 'BTC',
            name: 'Bitcoin',
            targetPercentage: '20.00',
            actualPercentage: '25.00',
            deviation: '5.00',
            baseAllocation: '200.00',
            adjustedAllocation: '150.00',
            adjustmentReason: 'overweight',
          },
        ],
        summary: {
          totalAdjusted: '1000.00',
          underweightCount: 1,
          overweightCount: 1,
          balancedCount: 1,
        },
      }
      vi.mocked(contributionService.getSuggestion).mockResolvedValue(mockSuggestion)

      const response = await postSuggest({ amount: 1000 })

      expect(response.status).toBe(200)
      expect(response.body.data.amount).toBe('1000.00')
      expect(response.body.data.allocations).toHaveLength(3)
      expect(response.body.data.summary.underweightCount).toBe(1)
    })

    it('calls service with authenticated user ID', async () => {
      const mockSuggestion = {
        amount: '1000.00',
        displayCurrency: 'USD',
        allocations: [],
        summary: { totalAdjusted: '0.00', underweightCount: 0, overweightCount: 0, balancedCount: 0 },
      }
      vi.mocked(contributionService.getSuggestion).mockResolvedValue(mockSuggestion)

      await postSuggest({ amount: 1000 })

      expect(contributionService.getSuggestion).toHaveBeenCalledWith('user-123', 1000)
    })

    it('returns 400 when no assets configured (AC #4)', async () => {
      vi.mocked(contributionService.getSuggestion).mockRejectedValue(
        new AppError(400, 'VALIDATION_ERROR', 'No assets configured. Add assets before requesting contribution suggestions.')
      )

      const response = await postSuggest({ amount: 1000 })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('VALIDATION_ERROR')
      expect(response.body.message).toContain('No assets configured')
    })

    it('returns 400 when targets do not sum to 100% (AC #5)', async () => {
      vi.mocked(contributionService.getSuggestion).mockRejectedValue(
        new AppError(400, 'VALIDATION_ERROR', 'Targets must sum to 100%', { currentSum: '85.00' })
      )

      const response = await postSuggest({ amount: 1000 })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('VALIDATION_ERROR')
      expect(response.body.message).toContain('100%')
      expect(response.body.details.currentSum).toBe('85.00')
    })

    it('returns 400 for zero amount (AC #6)', async () => {
      const response = await postSuggest({ amount: 0 })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('VALIDATION_ERROR')
    })

    it('returns 400 for negative amount (AC #6)', async () => {
      const response = await postSuggest({ amount: -100 })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('VALIDATION_ERROR')
    })

    it('returns 400 for missing amount (AC #6)', async () => {
      const response = await postSuggest({})

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('VALIDATION_ERROR')
    })

    it('returns 400 for non-numeric amount (AC #6)', async () => {
      const response = await postSuggest({ amount: 'abc' })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('VALIDATION_ERROR')
    })

    it('accepts decimal amount', async () => {
      const mockSuggestion = {
        amount: '123.45',
        displayCurrency: 'USD',
        allocations: [],
        summary: { totalAdjusted: '123.45', underweightCount: 0, overweightCount: 0, balancedCount: 0 },
      }
      vi.mocked(contributionService.getSuggestion).mockResolvedValue(mockSuggestion)

      const response = await postSuggest({ amount: 123.45 })

      expect(response.status).toBe(200)
      expect(contributionService.getSuggestion).toHaveBeenCalledWith('user-123', 123.45)
    })

    it('accepts string amount (coerced to number)', async () => {
      const mockSuggestion = {
        amount: '500.00',
        displayCurrency: 'USD',
        allocations: [],
        summary: { totalAdjusted: '500.00', underweightCount: 0, overweightCount: 0, balancedCount: 0 },
      }
      vi.mocked(contributionService.getSuggestion).mockResolvedValue(mockSuggestion)

      const response = await postSuggest({ amount: '500' })

      expect(response.status).toBe(200)
      expect(contributionService.getSuggestion).toHaveBeenCalledWith('user-123', 500)
    })

    it('handles service errors gracefully', async () => {
      vi.mocked(contributionService.getSuggestion).mockRejectedValue(
        new AppError(500, 'INTERNAL_ERROR', 'Database error')
      )

      const response = await postSuggest({ amount: 1000 })

      expect(response.status).toBe(500)
      expect(response.body.error).toBe('INTERNAL_ERROR')
    })

    it('returns response in correct format', async () => {
      const mockSuggestion = {
        amount: '1000.00',
        displayCurrency: 'USD',
        allocations: [
          {
            assetId: 'a1',
            ticker: 'VOO',
            name: 'Vanguard S&P 500',
            targetPercentage: '100.00',
            actualPercentage: '100.00',
            deviation: '0.00',
            baseAllocation: '1000.00',
            adjustedAllocation: '1000.00',
            adjustmentReason: null,
          },
        ],
        summary: {
          totalAdjusted: '1000.00',
          underweightCount: 0,
          overweightCount: 0,
          balancedCount: 1,
        },
      }
      vi.mocked(contributionService.getSuggestion).mockResolvedValue(mockSuggestion)

      const response = await postSuggest({ amount: 1000 })

      expect(response.status).toBe(200)
      // Response should be wrapped in { data: ... }
      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toHaveProperty('amount')
      expect(response.body.data).toHaveProperty('displayCurrency')
      expect(response.body.data).toHaveProperty('allocations')
      expect(response.body.data).toHaveProperty('summary')
    })
  })
})
