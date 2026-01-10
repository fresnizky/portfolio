import { describe, it, expect, vi, beforeEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import settingsRouter from './settings'
import { settingsService } from '@/services/settingsService'
import { exportService } from '@/services/exportService'
import { errorHandler } from '@/middleware/errorHandler'

// Mock the settings service
vi.mock('@/services/settingsService', () => ({
  settingsService: {
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
  },
}))

// Mock the export service
vi.mock('@/services/exportService', () => ({
  exportService: {
    exportJson: vi.fn(),
    exportCsv: vi.fn(),
  },
}))

// Create test app with mock user middleware
const createApp = () => {
  const app = express()
  app.use(express.json())
  // Mock auth middleware - add user to request
  app.use((req, _res, next) => {
    req.user = { id: 'user-123', email: 'test@example.com' }
    next()
  })
  app.use('/api/settings', settingsRouter)
  app.use(errorHandler)
  return app
}

describe('Settings Routes', () => {
  let app: express.Application

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  describe('GET /api/settings', () => {
    it('should return user settings', async () => {
      vi.mocked(settingsService.getSettings).mockResolvedValue({
        rebalanceThreshold: '5',
        priceAlertDays: 7,
      })

      const response = await request(app).get('/api/settings').expect(200)

      expect(response.body).toEqual({
        data: {
          rebalanceThreshold: '5',
          priceAlertDays: 7,
        },
      })
      expect(settingsService.getSettings).toHaveBeenCalledWith('user-123')
    })

    it('should return default settings for new user', async () => {
      vi.mocked(settingsService.getSettings).mockResolvedValue({
        rebalanceThreshold: '5',
        priceAlertDays: 7,
      })

      const response = await request(app).get('/api/settings').expect(200)

      expect(response.body.data.rebalanceThreshold).toBe('5')
      expect(response.body.data.priceAlertDays).toBe(7)
    })
  })

  describe('PUT /api/settings', () => {
    it('should update rebalance threshold', async () => {
      vi.mocked(settingsService.updateSettings).mockResolvedValue({
        rebalanceThreshold: '10',
        priceAlertDays: 7,
      })

      const response = await request(app)
        .put('/api/settings')
        .send({ rebalanceThreshold: 10 })
        .expect(200)

      expect(response.body).toEqual({
        data: {
          rebalanceThreshold: '10',
          priceAlertDays: 7,
        },
        message: 'Settings updated',
      })
      expect(settingsService.updateSettings).toHaveBeenCalledWith('user-123', {
        rebalanceThreshold: 10,
      })
    })

    it('should update price alert days', async () => {
      vi.mocked(settingsService.updateSettings).mockResolvedValue({
        rebalanceThreshold: '5',
        priceAlertDays: 14,
      })

      const response = await request(app)
        .put('/api/settings')
        .send({ priceAlertDays: 14 })
        .expect(200)

      expect(response.body.data.priceAlertDays).toBe(14)
      expect(settingsService.updateSettings).toHaveBeenCalledWith('user-123', {
        priceAlertDays: 14,
      })
    })

    it('should update both settings at once', async () => {
      vi.mocked(settingsService.updateSettings).mockResolvedValue({
        rebalanceThreshold: '15',
        priceAlertDays: 21,
      })

      const response = await request(app)
        .put('/api/settings')
        .send({ rebalanceThreshold: 15, priceAlertDays: 21 })
        .expect(200)

      expect(response.body.data).toEqual({
        rebalanceThreshold: '15',
        priceAlertDays: 21,
      })
    })

    it('should reject invalid threshold below minimum', async () => {
      const response = await request(app)
        .put('/api/settings')
        .send({ rebalanceThreshold: 0 })
        .expect(400)

      expect(response.body.error).toBe('VALIDATION_ERROR')
    })

    it('should reject invalid threshold above maximum', async () => {
      const response = await request(app)
        .put('/api/settings')
        .send({ rebalanceThreshold: 51 })
        .expect(400)

      expect(response.body.error).toBe('VALIDATION_ERROR')
    })

    it('should reject invalid days below minimum', async () => {
      const response = await request(app)
        .put('/api/settings')
        .send({ priceAlertDays: 0 })
        .expect(400)

      expect(response.body.error).toBe('VALIDATION_ERROR')
    })

    it('should reject invalid days above maximum', async () => {
      const response = await request(app)
        .put('/api/settings')
        .send({ priceAlertDays: 31 })
        .expect(400)

      expect(response.body.error).toBe('VALIDATION_ERROR')
    })

    it('should reject request with no settings provided', async () => {
      const response = await request(app)
        .put('/api/settings')
        .send({})
        .expect(400)

      expect(response.body.error).toBe('VALIDATION_ERROR')
    })
  })

  describe('GET /api/settings/export/json', () => {
    it('should export user data as JSON', async () => {
      const mockExportData = {
        exportedAt: '2026-01-10T12:00:00.000Z',
        user: { email: 'test@example.com' },
        assets: [{ id: 'asset-1', ticker: 'AAPL', name: 'Apple Inc' }],
        holdings: [{ ticker: 'AAPL', quantity: '10.5' }],
        transactions: [],
        snapshots: [],
      }
      vi.mocked(exportService.exportJson).mockResolvedValue(mockExportData as never)

      const response = await request(app)
        .get('/api/settings/export/json')
        .expect(200)

      expect(response.body.data).toEqual(mockExportData)
      expect(exportService.exportJson).toHaveBeenCalledWith('user-123')
    })

    it('should include all data types in export', async () => {
      const mockExportData = {
        exportedAt: '2026-01-10T12:00:00.000Z',
        user: { email: 'test@example.com' },
        assets: [{ id: 'asset-1' }],
        holdings: [{ ticker: 'AAPL' }],
        transactions: [{ type: 'BUY' }],
        snapshots: [{ date: '2026-01-10' }],
      }
      vi.mocked(exportService.exportJson).mockResolvedValue(mockExportData as never)

      const response = await request(app)
        .get('/api/settings/export/json')
        .expect(200)

      expect(response.body.data.assets).toBeDefined()
      expect(response.body.data.holdings).toBeDefined()
      expect(response.body.data.transactions).toBeDefined()
      expect(response.body.data.snapshots).toBeDefined()
    })
  })

  describe('GET /api/settings/export/csv', () => {
    it('should export user data as ZIP file', async () => {
      // Mock ZIP buffer with valid ZIP header
      const mockBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00])
      vi.mocked(exportService.exportCsv).mockResolvedValue(mockBuffer)

      const response = await request(app)
        .get('/api/settings/export/csv')
        .expect(200)

      expect(response.headers['content-type']).toBe('application/zip')
      expect(response.headers['content-disposition']).toBe(
        'attachment; filename="portfolio-backup.zip"'
      )
      expect(exportService.exportCsv).toHaveBeenCalledWith('user-123')
    })

    it('should return correct content length', async () => {
      const mockBuffer = Buffer.alloc(1024)
      vi.mocked(exportService.exportCsv).mockResolvedValue(mockBuffer)

      const response = await request(app)
        .get('/api/settings/export/csv')
        .expect(200)

      expect(response.headers['content-length']).toBe('1024')
    })
  })
})
