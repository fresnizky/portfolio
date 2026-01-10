import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { api, ApiError } from './api'
import type {
  Asset,
  CreateAssetInput,
  UpdateAssetInput,
  BatchUpdateTargetsInput,
  Transaction,
  CreateTransactionInput,
  TransactionListFilters,
} from '@/types/api'

describe('api', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.resetAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  describe('ApiError', () => {
    it('should create an ApiError with error code, message, and details', () => {
      const error = new ApiError('VALIDATION_ERROR', 'Invalid input', { field: 'email' })

      expect(error.name).toBe('ApiError')
      expect(error.error).toBe('VALIDATION_ERROR')
      expect(error.message).toBe('Invalid input')
      expect(error.details).toEqual({ field: 'email' })
    })
  })

  describe('auth.login', () => {
    it('should successfully login and return user data with token', async () => {
      const mockResponse = {
        data: {
          user: { id: '1', email: 'test@example.com' },
          token: 'jwt-token-123',
        },
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await api.auth.login('test@example.com', 'password123')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
        })
      )
      expect(result).toEqual(mockResponse.data)
    })

    it('should throw ApiError on invalid credentials', async () => {
      const mockError = {
        error: 'UNAUTHORIZED',
        message: 'Invalid email or password',
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve(mockError),
      })

      await expect(api.auth.login('test@example.com', 'wrong-password')).rejects.toThrow(ApiError)
      await expect(api.auth.login('test@example.com', 'wrong-password')).rejects.toMatchObject({
        error: 'UNAUTHORIZED',
        message: 'Invalid email or password',
      })
    })
  })

  describe('auth.me', () => {
    it('should fetch current user when authenticated', async () => {
      const mockResponse = {
        data: { id: '1', email: 'test@example.com' },
      }

      // Simulate stored token
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({ state: { token: 'jwt-token-123' } })
      )

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await api.auth.me()

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/me'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer jwt-token-123',
          }),
        })
      )
      expect(result).toEqual(mockResponse.data)
    })

    it('should throw ApiError when not authenticated', async () => {
      const mockError = {
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve(mockError),
      })

      await expect(api.auth.me()).rejects.toThrow(ApiError)
    })

    it('should clear corrupted localStorage and continue without auth header', async () => {
      const mockResponse = {
        data: { id: '1', email: 'test@example.com' },
      }

      // Set corrupted/invalid JSON in localStorage
      localStorage.setItem('auth-storage', 'not-valid-json{')

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      await api.auth.me()

      // Verify localStorage was cleaned up
      expect(localStorage.getItem('auth-storage')).toBeNull()

      // Verify request was made without Authorization header
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/me'),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.any(String),
          }),
        })
      )
    })
  })

  describe('assets', () => {
    const mockAsset: Asset = {
      id: 'asset-1',
      ticker: 'VOO',
      name: 'Vanguard S&P 500 ETF',
      category: 'ETF',
      targetPercentage: '60.00',
      createdAt: '2026-01-07T00:00:00.000Z',
      updatedAt: '2026-01-07T00:00:00.000Z',
      userId: 'user-1',
    }

    beforeEach(() => {
      // Simulate stored token for authenticated requests
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({ state: { token: 'jwt-token-123' } })
      )
    })

    describe('assets.list', () => {
      it('should fetch all assets for the authenticated user', async () => {
        const mockResponse = {
          data: [mockAsset],
        }

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })

        const result = await api.assets.list()

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/assets'),
          expect.objectContaining({
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              Authorization: 'Bearer jwt-token-123',
            }),
          })
        )
        expect(result).toEqual([mockAsset])
      })

      it('should return empty array when no assets exist', async () => {
        const mockResponse = { data: [] }

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })

        const result = await api.assets.list()

        expect(result).toEqual([])
      })

      it('should throw ApiError when not authenticated', async () => {
        localStorage.clear()
        const mockError = {
          error: 'UNAUTHORIZED',
          message: 'Authentication required',
        }

        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          json: () => Promise.resolve(mockError),
        })

        await expect(api.assets.list()).rejects.toThrow(ApiError)
      })
    })

    describe('assets.create', () => {
      it('should create a new asset', async () => {
        const input: CreateAssetInput = {
          ticker: 'VOO',
          name: 'Vanguard S&P 500 ETF',
          category: 'ETF',
          targetPercentage: 60,
        }

        const mockResponse = { data: mockAsset }

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })

        const result = await api.assets.create(input)

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/assets'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              Authorization: 'Bearer jwt-token-123',
            }),
            body: JSON.stringify(input),
          })
        )
        expect(result).toEqual(mockAsset)
      })

      it('should throw ApiError on validation failure', async () => {
        const input: CreateAssetInput = {
          ticker: '',
          name: '',
          category: 'ETF',
        }

        const mockError = {
          error: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: { ticker: 'Ticker is required' },
        }

        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          json: () => Promise.resolve(mockError),
        })

        await expect(api.assets.create(input)).rejects.toMatchObject({
          error: 'VALIDATION_ERROR',
          message: 'Validation failed',
        })
      })

      it('should throw ApiError on duplicate ticker', async () => {
        const input: CreateAssetInput = {
          ticker: 'VOO',
          name: 'Duplicate',
          category: 'ETF',
        }

        const mockError = {
          error: 'CONFLICT',
          message: 'Asset with ticker VOO already exists',
        }

        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          json: () => Promise.resolve(mockError),
        })

        await expect(api.assets.create(input)).rejects.toMatchObject({
          error: 'CONFLICT',
        })
      })
    })

    describe('assets.update', () => {
      it('should update an existing asset', async () => {
        const input: UpdateAssetInput = {
          name: 'Updated Name',
          targetPercentage: 70,
        }

        const updatedAsset = { ...mockAsset, name: 'Updated Name', targetPercentage: '70.00' }
        const mockResponse = { data: updatedAsset }

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })

        const result = await api.assets.update('asset-1', input)

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/assets/asset-1'),
          expect.objectContaining({
            method: 'PUT',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              Authorization: 'Bearer jwt-token-123',
            }),
            body: JSON.stringify(input),
          })
        )
        expect(result).toEqual(updatedAsset)
      })

      it('should throw ApiError when asset not found', async () => {
        const input: UpdateAssetInput = { name: 'New Name' }

        const mockError = {
          error: 'NOT_FOUND',
          message: 'Asset not found',
        }

        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          json: () => Promise.resolve(mockError),
        })

        await expect(api.assets.update('nonexistent', input)).rejects.toMatchObject({
          error: 'NOT_FOUND',
        })
      })
    })

    describe('assets.delete', () => {
      it('should delete an asset', async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          status: 204,
        })

        await expect(api.assets.delete('asset-1')).resolves.toBeUndefined()

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/assets/asset-1'),
          expect.objectContaining({
            method: 'DELETE',
            headers: expect.objectContaining({
              Authorization: 'Bearer jwt-token-123',
            }),
          })
        )
      })

      it('should throw ApiError when asset not found', async () => {
        const mockError = {
          error: 'NOT_FOUND',
          message: 'Asset not found',
        }

        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          json: () => Promise.resolve(mockError),
        })

        await expect(api.assets.delete('nonexistent')).rejects.toMatchObject({
          error: 'NOT_FOUND',
        })
      })

      it('should throw ApiError when not authorized', async () => {
        const mockError = {
          error: 'FORBIDDEN',
          message: 'Not authorized to delete this asset',
        }

        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          json: () => Promise.resolve(mockError),
        })

        await expect(api.assets.delete('other-user-asset')).rejects.toMatchObject({
          error: 'FORBIDDEN',
        })
      })
    })

    describe('assets.batchUpdateTargets', () => {
      it('should batch update target percentages', async () => {
        const input: BatchUpdateTargetsInput = {
          targets: [
            { assetId: 'asset-1', targetPercentage: 60 },
            { assetId: 'asset-2', targetPercentage: 40 },
          ],
        }

        const updatedAssets: Asset[] = [
          { ...mockAsset, id: 'asset-1', targetPercentage: '60.00' },
          { ...mockAsset, id: 'asset-2', ticker: 'BND', targetPercentage: '40.00' },
        ]
        const mockResponse = { data: updatedAssets }

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })

        const result = await api.assets.batchUpdateTargets(input)

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/assets/targets'),
          expect.objectContaining({
            method: 'PUT',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              Authorization: 'Bearer jwt-token-123',
            }),
            body: JSON.stringify(input),
          })
        )
        expect(result).toEqual(updatedAssets)
      })

      it('should throw ApiError when targets do not sum to 100%', async () => {
        const input: BatchUpdateTargetsInput = {
          targets: [
            { assetId: 'asset-1', targetPercentage: 60 },
            { assetId: 'asset-2', targetPercentage: 30 },
          ],
        }

        const mockError = {
          error: 'VALIDATION_ERROR',
          message: 'Target percentages must sum to exactly 100%',
          details: { sum: 90, difference: -10 },
        }

        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          json: () => Promise.resolve(mockError),
        })

        await expect(api.assets.batchUpdateTargets(input)).rejects.toMatchObject({
          error: 'VALIDATION_ERROR',
          details: { sum: 90, difference: -10 },
        })
      })

      it('should throw ApiError when asset not found', async () => {
        const input: BatchUpdateTargetsInput = {
          targets: [
            { assetId: 'nonexistent', targetPercentage: 100 },
          ],
        }

        const mockError = {
          error: 'NOT_FOUND',
          message: 'Asset not found',
        }

        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          json: () => Promise.resolve(mockError),
        })

        await expect(api.assets.batchUpdateTargets(input)).rejects.toMatchObject({
          error: 'NOT_FOUND',
        })
      })
    })
  })

  describe('transactions', () => {
    const mockTransaction: Transaction = {
      id: 'tx-1',
      type: 'BUY',
      date: '2026-01-07T00:00:00.000Z',
      quantity: '10.00000000',
      priceCents: '15000',
      commissionCents: '500',
      totalCents: '150500',
      assetId: 'asset-1',
      userId: 'user-1',
      createdAt: '2026-01-07T00:00:00.000Z',
      updatedAt: '2026-01-07T00:00:00.000Z',
      asset: {
        ticker: 'VOO',
        name: 'Vanguard S&P 500 ETF',
      },
    }

    beforeEach(() => {
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({ state: { token: 'jwt-token-123' } })
      )
    })

    describe('transactions.list', () => {
      it('should fetch all transactions without filters', async () => {
        const mockResponse = {
          data: [mockTransaction],
          meta: { total: 1 },
        }

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })

        const result = await api.transactions.list()

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/transactions'),
          expect.objectContaining({
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              Authorization: 'Bearer jwt-token-123',
            }),
          })
        )
        expect(result).toEqual({
          transactions: [mockTransaction],
          total: 1,
        })
      })

      it('should fetch transactions with filters', async () => {
        const filters: TransactionListFilters = {
          assetId: 'asset-1',
          type: 'buy',
          fromDate: '2026-01-01',
          toDate: '2026-01-31',
        }

        const mockResponse = {
          data: [mockTransaction],
          meta: { total: 1 },
        }

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })

        const result = await api.transactions.list(filters)

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringMatching(/\/transactions\?assetId=asset-1&type=buy&fromDate=2026-01-01&toDate=2026-01-31/),
          expect.any(Object)
        )
        expect(result).toEqual({
          transactions: [mockTransaction],
          total: 1,
        })
      })

      it('should return empty array when no transactions exist', async () => {
        const mockResponse = {
          data: [],
          meta: { total: 0 },
        }

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })

        const result = await api.transactions.list()

        expect(result).toEqual({
          transactions: [],
          total: 0,
        })
      })

      it('should handle response without meta', async () => {
        const mockResponse = {
          data: [mockTransaction],
        }

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })

        const result = await api.transactions.list()

        expect(result).toEqual({
          transactions: [mockTransaction],
          total: 1,
        })
      })

      it('should throw ApiError when not authenticated', async () => {
        localStorage.clear()
        const mockError = {
          error: 'UNAUTHORIZED',
          message: 'Authentication required',
        }

        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          json: () => Promise.resolve(mockError),
        })

        await expect(api.transactions.list()).rejects.toThrow(ApiError)
      })
    })

    describe('transactions.create', () => {
      it('should create a new BUY transaction', async () => {
        const input: CreateTransactionInput = {
          type: 'buy',
          assetId: 'asset-1',
          date: '2026-01-07',
          quantity: 10,
          price: 150,
          commission: 5,
        }

        const mockResponse = { data: mockTransaction }

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })

        const result = await api.transactions.create(input)

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/transactions'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              Authorization: 'Bearer jwt-token-123',
            }),
            body: JSON.stringify(input),
          })
        )
        expect(result).toEqual(mockTransaction)
      })

      it('should create a new SELL transaction', async () => {
        const input: CreateTransactionInput = {
          type: 'sell',
          assetId: 'asset-1',
          date: '2026-01-07',
          quantity: 5,
          price: 160,
          commission: 5,
        }

        const sellTransaction: Transaction = {
          ...mockTransaction,
          id: 'tx-2',
          type: 'SELL',
          quantity: '5.00000000',
          totalCents: '79500',
        }
        const mockResponse = { data: sellTransaction }

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })

        const result = await api.transactions.create(input)

        expect(result.type).toBe('SELL')
      })

      it('should throw ApiError on validation failure', async () => {
        const input: CreateTransactionInput = {
          type: 'buy',
          assetId: '',
          date: '',
          quantity: -1,
          price: 0,
        }

        const mockError = {
          error: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: { quantity: 'Quantity must be positive' },
        }

        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          json: () => Promise.resolve(mockError),
        })

        await expect(api.transactions.create(input)).rejects.toMatchObject({
          error: 'VALIDATION_ERROR',
        })
      })

      it('should throw ApiError when selling more than owned', async () => {
        const input: CreateTransactionInput = {
          type: 'sell',
          assetId: 'asset-1',
          date: '2026-01-07',
          quantity: 1000,
          price: 150,
        }

        const mockError = {
          error: 'VALIDATION_ERROR',
          message: 'Insufficient quantity to sell',
        }

        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          json: () => Promise.resolve(mockError),
        })

        await expect(api.transactions.create(input)).rejects.toMatchObject({
          error: 'VALIDATION_ERROR',
          message: 'Insufficient quantity to sell',
        })
      })

      it('should throw ApiError when asset not found', async () => {
        const input: CreateTransactionInput = {
          type: 'buy',
          assetId: 'nonexistent',
          date: '2026-01-07',
          quantity: 10,
          price: 150,
        }

        const mockError = {
          error: 'NOT_FOUND',
          message: 'Asset not found',
        }

        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          json: () => Promise.resolve(mockError),
        })

        await expect(api.transactions.create(input)).rejects.toMatchObject({
          error: 'NOT_FOUND',
        })
      })
    })
  })

  describe('dashboard', () => {
    const mockDashboardResponse = {
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
          priceUpdatedAt: '2026-01-09T15:30:00.000Z',
        },
      ],
      alerts: [
        {
          type: 'stale_price',
          assetId: 'asset-2',
          ticker: 'GLD',
          message: 'GLD price is 10 days old',
          severity: 'warning',
          data: { daysOld: 10 },
        },
      ],
    }

    beforeEach(() => {
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({ state: { token: 'jwt-token-123' } })
      )
    })

    describe('dashboard.get', () => {
      it('should fetch dashboard data without params', async () => {
        const mockResponse = { data: mockDashboardResponse }

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })

        const result = await api.dashboard.get()

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/dashboard'),
          expect.objectContaining({
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              Authorization: 'Bearer jwt-token-123',
            }),
          })
        )
        expect(result).toEqual(mockDashboardResponse)
      })

      it('should include deviationThreshold query param', async () => {
        const mockResponse = { data: mockDashboardResponse }

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })

        await api.dashboard.get({ deviationThreshold: 10 })

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('deviationThreshold=10'),
          expect.any(Object)
        )
      })

      it('should include staleDays query param', async () => {
        const mockResponse = { data: mockDashboardResponse }

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })

        await api.dashboard.get({ staleDays: 14 })

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('staleDays=14'),
          expect.any(Object)
        )
      })

      it('should include both query params', async () => {
        const mockResponse = { data: mockDashboardResponse }

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })

        await api.dashboard.get({ deviationThreshold: 3, staleDays: 3 })

        const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]
        expect(calledUrl).toContain('deviationThreshold=3')
        expect(calledUrl).toContain('staleDays=3')
      })

      it('should return positions with calculated fields', async () => {
        const mockResponse = { data: mockDashboardResponse }

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })

        const result = await api.dashboard.get()

        expect(result.positions[0]).toHaveProperty('actualPercentage')
        expect(result.positions[0]).toHaveProperty('deviation')
      })

      it('should return alerts array', async () => {
        const mockResponse = { data: mockDashboardResponse }

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })

        const result = await api.dashboard.get()

        expect(result.alerts).toHaveLength(1)
        expect(result.alerts[0].type).toBe('stale_price')
      })

      it('should throw ApiError on server error', async () => {
        const mockError = {
          error: 'INTERNAL_ERROR',
          message: 'Database error',
        }

        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          json: () => Promise.resolve(mockError),
        })

        await expect(api.dashboard.get()).rejects.toMatchObject({
          error: 'INTERNAL_ERROR',
        })
      })

      it('should throw ApiError without auth token', async () => {
        localStorage.clear()
        const mockError = {
          error: 'UNAUTHORIZED',
          message: 'Authentication required',
        }

        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          json: () => Promise.resolve(mockError),
        })

        await expect(api.dashboard.get()).rejects.toThrow(ApiError)
      })
    })
  })
})
