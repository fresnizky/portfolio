import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import express, { Express } from 'express'
import request from 'supertest'
import authRouter from './auth'

// Mock auth service
vi.mock('@/services/authService', () => ({
  authService: {
    register: vi.fn(),
    login: vi.fn(),
  },
}))

// Mock rate limiter to not block tests
vi.mock('@/middleware/rateLimiter', () => ({
  authRateLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
}))

import { authService } from '@/services/authService'
import { AppError } from '@/lib/errors'
import { verifyToken } from '@/lib/jwt'

// Mock JWT verification for /me route
vi.mock('@/lib/jwt', () => ({
  verifyToken: vi.fn(),
}))

// Reusable test data
const validCredentials = { email: 'test@example.com', password: 'password123' }

const createMockAuthResult = (overrides = {}) => ({
  user: { id: 'user-123', email: 'test@example.com' },
  token: 'mock-jwt-token',
  ...overrides,
})

describe('auth routes', () => {
  let app: Express

  // Request helpers
  const postRegister = (data: object) => request(app).post('/api/auth/register').send(data)
  const postLogin = (data: object) => request(app).post('/api/auth/login').send(data)

  beforeEach(() => {
    vi.clearAllMocks()
    app = express()
    app.use(express.json())
    app.use('/api/auth', authRouter)

    // Error handler
    app.use((err: AppError, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
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

  describe('POST /api/auth/register', () => {
    it('should register a new user and return 201', async () => {
      const mockResult = createMockAuthResult()
      vi.mocked(authService.register).mockResolvedValue(mockResult)

      const response = await postRegister(validCredentials)

      expect(response.status).toBe(201)
      expect(response.body.data).toEqual(mockResult)
      expect(authService.register).toHaveBeenCalledWith(validCredentials.email, validCredentials.password)
    })

    it('should return 400 for invalid email', async () => {
      const response = await postRegister({ ...validCredentials, email: 'invalid-email' })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for short password', async () => {
      const response = await postRegister({ ...validCredentials, password: 'short' })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('VALIDATION_ERROR')
    })

    it('should return 409 for duplicate email', async () => {
      vi.mocked(authService.register).mockRejectedValue(
        new AppError(409, 'CONFLICT', 'Email already registered')
      )

      const response = await postRegister(validCredentials)

      expect(response.status).toBe(409)
      expect(response.body.error).toBe('CONFLICT')
    })
  })

  describe('GET /api/auth/me', () => {
    const getMe = (token?: string) => {
      const req = request(app).get('/api/auth/me')
      return token ? req.set('Authorization', `Bearer ${token}`) : req
    }

    it('should return user data for valid token', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      vi.mocked(verifyToken).mockReturnValue(mockUser)

      const response = await getMe('valid-token')

      expect(response.status).toBe(200)
      expect(response.body.data).toEqual(mockUser)
    })

    it('should return 401 when no token provided', async () => {
      const response = await getMe()

      expect(response.status).toBe(401)
      expect(response.body.error).toBe('UNAUTHORIZED')
    })

    it('should return 401 for invalid token', async () => {
      vi.mocked(verifyToken).mockImplementation(() => {
        throw new Error('Invalid token')
      })

      const response = await getMe('invalid-token')

      expect(response.status).toBe(401)
      expect(response.body.error).toBe('UNAUTHORIZED')
    })
  })

  describe('POST /api/auth/login', () => {
    it('should login user and return 200', async () => {
      const mockResult = createMockAuthResult()
      vi.mocked(authService.login).mockResolvedValue(mockResult)

      const response = await postLogin(validCredentials)

      expect(response.status).toBe(200)
      expect(response.body.data).toEqual(mockResult)
      expect(authService.login).toHaveBeenCalledWith(validCredentials.email, validCredentials.password)
    })

    it('should return 400 for invalid email', async () => {
      const response = await postLogin({ ...validCredentials, email: 'invalid-email' })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for empty password', async () => {
      const response = await postLogin({ ...validCredentials, password: '' })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('VALIDATION_ERROR')
    })

    it('should return 401 for invalid credentials', async () => {
      vi.mocked(authService.login).mockRejectedValue(
        new AppError(401, 'UNAUTHORIZED', 'Invalid email or password')
      )

      const response = await postLogin(validCredentials)

      expect(response.status).toBe(401)
      expect(response.body.error).toBe('UNAUTHORIZED')
    })
  })
})
