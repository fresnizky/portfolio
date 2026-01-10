import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import express, { Express, Request, Response, NextFunction } from 'express'
import request from 'supertest'
import snapshotsRouter from './snapshots'

// Mock snapshot service
vi.mock('@/services/snapshotService', () => ({
  snapshotService: {
    create: vi.fn(),
    list: vi.fn(),
    getById: vi.fn(),
  },
}))

import { snapshotService } from '@/services/snapshotService'
import { AppError } from '@/lib/errors'

// Mock response from service (already formatted)
const createMockSnapshot = (overrides = {}) => ({
  id: 'snapshot-123',
  date: '2026-01-10T00:00:00.000Z',
  totalValue: '4507.50',
  assets: [
    {
      assetId: 'asset-123',
      ticker: 'VOO',
      name: 'Vanguard S&P 500 ETF',
      quantity: '10',
      price: '450.75',
      value: '4507.50',
      percentage: '100.00',
    },
  ],
  createdAt: '2026-01-10T15:30:00.000Z',
  ...overrides,
})

// Mock authenticated user middleware
const mockAuthMiddleware =
  (userId = 'user-123') =>
  (req: Request, _res: Response, next: NextFunction) => {
    req.user = { id: userId, email: 'test@example.com' }
    next()
  }

describe('snapshots routes', () => {
  let app: Express

  // Request helpers
  const postSnapshot = () => request(app).post('/api/snapshots')
  const getSnapshots = (query = '') => request(app).get(`/api/snapshots${query}`)
  const getSnapshot = (id: string) => request(app).get(`/api/snapshots/${id}`)

  beforeEach(() => {
    vi.clearAllMocks()
    app = express()
    app.use(express.json())
    app.use(mockAuthMiddleware())
    app.use('/api/snapshots', snapshotsRouter)

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

  describe('POST /api/snapshots', () => {
    it('should create snapshot and return 201', async () => {
      const mockSnap = createMockSnapshot()
      vi.mocked(snapshotService.create).mockResolvedValue(mockSnap as never)

      const response = await postSnapshot()

      expect(response.status).toBe(201)
      expect(response.body.data).toEqual(mockSnap)
      expect(response.body.message).toBe('Snapshot created')
      expect(snapshotService.create).toHaveBeenCalledWith('user-123')
    })

    it('should handle empty portfolio', async () => {
      const mockSnap = createMockSnapshot({ totalValue: '0.00', assets: [] })
      vi.mocked(snapshotService.create).mockResolvedValue(mockSnap as never)

      const response = await postSnapshot()

      expect(response.status).toBe(201)
      expect(response.body.data.totalValue).toBe('0.00')
      expect(response.body.data.assets).toHaveLength(0)
    })

    it('should update existing snapshot for same day', async () => {
      const mockSnap = createMockSnapshot()
      vi.mocked(snapshotService.create).mockResolvedValue(mockSnap as never)

      const response = await postSnapshot()

      expect(response.status).toBe(201)
      // Service handles the upsert logic internally
    })
  })

  describe('GET /api/snapshots', () => {
    it('should return list of snapshots', async () => {
      const mockSnapshots = [createMockSnapshot(), createMockSnapshot({ id: 'snapshot-456' })]
      vi.mocked(snapshotService.list).mockResolvedValue({
        snapshots: mockSnapshots,
        total: 2,
      } as never)

      const response = await getSnapshots()

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(2)
      expect(response.body.meta.total).toBe(2)
      expect(snapshotService.list).toHaveBeenCalledWith('user-123', {})
    })

    it('should filter by date range when query params provided', async () => {
      vi.mocked(snapshotService.list).mockResolvedValue({
        snapshots: [],
        total: 0,
      } as never)

      await getSnapshots('?from=2026-01-01&to=2026-03-31')

      expect(snapshotService.list).toHaveBeenCalledWith('user-123', {
        from: '2026-01-01',
        to: '2026-03-31',
      })
    })

    it('should filter by from date only', async () => {
      vi.mocked(snapshotService.list).mockResolvedValue({
        snapshots: [],
        total: 0,
      } as never)

      await getSnapshots('?from=2026-01-01')

      expect(snapshotService.list).toHaveBeenCalledWith('user-123', {
        from: '2026-01-01',
      })
    })

    it('should filter by to date only', async () => {
      vi.mocked(snapshotService.list).mockResolvedValue({
        snapshots: [],
        total: 0,
      } as never)

      await getSnapshots('?to=2026-03-31')

      expect(snapshotService.list).toHaveBeenCalledWith('user-123', {
        to: '2026-03-31',
      })
    })

    it('should return empty array if no snapshots', async () => {
      vi.mocked(snapshotService.list).mockResolvedValue({
        snapshots: [],
        total: 0,
      } as never)

      const response = await getSnapshots()

      expect(response.status).toBe(200)
      expect(response.body.data).toEqual([])
      expect(response.body.meta.total).toBe(0)
    })

    it('should ignore invalid date filters', async () => {
      vi.mocked(snapshotService.list).mockResolvedValue({
        snapshots: [],
        total: 0,
      } as never)

      await getSnapshots('?from=invalid-date')

      // Should call without query when validation fails (safeParse returns undefined)
      expect(snapshotService.list).toHaveBeenCalledWith('user-123', undefined)
    })
  })

  describe('GET /api/snapshots/:id', () => {
    it('should return snapshot by id', async () => {
      const mockSnap = createMockSnapshot()
      vi.mocked(snapshotService.getById).mockResolvedValue(mockSnap as never)

      const response = await getSnapshot('snapshot-123')

      expect(response.status).toBe(200)
      expect(response.body.data).toEqual(mockSnap)
      expect(snapshotService.getById).toHaveBeenCalledWith('user-123', 'snapshot-123')
    })

    it('should return 404 if not found', async () => {
      vi.mocked(snapshotService.getById).mockRejectedValue(
        new AppError(404, 'NOT_FOUND', 'Snapshot not found')
      )

      const response = await getSnapshot('non-existent')

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('NOT_FOUND')
      expect(response.body.message).toBe('Snapshot not found')
    })

    it('should pass id to service for validation', async () => {
      // ID validation is handled by the service (ownership check)
      // Any string ID that matches the route will be passed to service
      const mockSnap = createMockSnapshot()
      vi.mocked(snapshotService.getById).mockResolvedValue(mockSnap as never)

      const response = await getSnapshot('any-valid-id')

      expect(response.status).toBe(200)
      expect(snapshotService.getById).toHaveBeenCalledWith('user-123', 'any-valid-id')
    })

    it('should return 404 for other users snapshot', async () => {
      vi.mocked(snapshotService.getById).mockRejectedValue(
        new AppError(404, 'NOT_FOUND', 'Snapshot not found')
      )

      const response = await getSnapshot('other-user-snapshot')

      expect(response.status).toBe(404)
    })
  })
})
