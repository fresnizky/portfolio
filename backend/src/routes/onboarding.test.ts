import { describe, it, expect, vi, beforeEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import onboardingRouter from './onboarding'
import { onboardingService } from '@/services/onboardingService'

// Mock the onboarding service
vi.mock('@/services/onboardingService', () => ({
  onboardingService: {
    getStatus: vi.fn(),
    markCompleted: vi.fn(),
    markSkipped: vi.fn(),
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
  app.use('/api/onboarding', onboardingRouter)
  return app
}

describe('Onboarding Routes', () => {
  let app: express.Application

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  describe('GET /api/onboarding/status', () => {
    it('should return onboarding status', async () => {
      vi.mocked(onboardingService.getStatus).mockResolvedValue({
        completed: false,
        skipped: false,
      })

      const response = await request(app)
        .get('/api/onboarding/status')
        .expect(200)

      expect(response.body).toEqual({
        data: {
          completed: false,
          skipped: false,
        },
      })
      expect(onboardingService.getStatus).toHaveBeenCalledWith('user-123')
    })

    it('should return completed status when onboarding is done', async () => {
      vi.mocked(onboardingService.getStatus).mockResolvedValue({
        completed: true,
        skipped: false,
      })

      const response = await request(app)
        .get('/api/onboarding/status')
        .expect(200)

      expect(response.body.data.completed).toBe(true)
    })
  })

  describe('POST /api/onboarding/complete', () => {
    it('should mark onboarding as completed', async () => {
      vi.mocked(onboardingService.markCompleted).mockResolvedValue({
        completed: true,
        skipped: false,
      })

      const response = await request(app)
        .post('/api/onboarding/complete')
        .expect(200)

      expect(response.body).toEqual({
        data: {
          completed: true,
          skipped: false,
        },
        message: 'Onboarding completed',
      })
      expect(onboardingService.markCompleted).toHaveBeenCalledWith('user-123')
    })
  })

  describe('POST /api/onboarding/skip', () => {
    it('should mark onboarding as skipped', async () => {
      vi.mocked(onboardingService.markSkipped).mockResolvedValue({
        completed: false,
        skipped: true,
      })

      const response = await request(app)
        .post('/api/onboarding/skip')
        .expect(200)

      expect(response.body).toEqual({
        data: {
          completed: false,
          skipped: true,
        },
        message: 'Onboarding skipped',
      })
      expect(onboardingService.markSkipped).toHaveBeenCalledWith('user-123')
    })
  })
})
