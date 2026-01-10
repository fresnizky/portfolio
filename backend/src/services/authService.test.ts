import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { authService } from './authService'
import { prisma } from '@/config/database'
import { AppError } from '@/lib/errors'

// Mock the database
vi.mock('@/config/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}))

// Mock JWT utilities
vi.mock('@/lib/jwt', () => ({
  generateToken: vi.fn(() => 'mock-jwt-token'),
}))

// Reusable mock user factory
const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  passwordHash: '$2b$10$hashedpassword',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.JWT_SECRET = 'test-secret'
  })

  afterEach(() => {
    delete process.env.JWT_SECRET
  })

  describe('register', () => {
    it('should create a new user and return token', async () => {
      const mockUser = createMockUser()

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.user.create).mockResolvedValue(mockUser)

      const result = await authService.register('test@example.com', 'password123')

      expect(result.user.id).toBe(mockUser.id)
      expect(result.user.email).toBe(mockUser.email)
      expect(result.token).toBe('mock-jwt-token')
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          passwordHash: expect.any(String),
        },
      })
    })

    it('should throw conflict error if email already exists', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(createMockUser())

      await expect(authService.register('test@example.com', 'password123'))
        .rejects.toThrow(AppError)

      await expect(authService.register('test@example.com', 'password123'))
        .rejects.toMatchObject({
          statusCode: 409,
          code: 'CONFLICT',
        })
    })

    it('should hash the password before storing', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.user.create).mockResolvedValue(createMockUser())

      await authService.register('test@example.com', 'password123')

      const createCall = vi.mocked(prisma.user.create).mock.calls[0][0]
      expect(createCall.data.passwordHash).toMatch(/^\$2[aby]?\$/)
    })
  })

  describe('login', () => {
    it('should return user and token for valid credentials', async () => {
      const mockUser = createMockUser()
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)

      const passwordModule = await import('@/lib/password')
      vi.spyOn(passwordModule, 'verifyPassword').mockResolvedValue(true)

      const result = await authService.login('test@example.com', 'password123')

      expect(result.user.id).toBe(mockUser.id)
      expect(result.user.email).toBe(mockUser.email)
      expect(result.token).toBe('mock-jwt-token')
    })

    it('should throw unauthorized error for non-existent user', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      await expect(authService.login('nonexistent@example.com', 'password123'))
        .rejects.toThrow(AppError)

      await expect(authService.login('nonexistent@example.com', 'password123'))
        .rejects.toMatchObject({
          statusCode: 401,
          code: 'UNAUTHORIZED',
        })
    })

    it('should throw unauthorized error for wrong password', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(createMockUser())

      const passwordModule = await import('@/lib/password')
      vi.spyOn(passwordModule, 'verifyPassword').mockResolvedValue(false)

      await expect(authService.login('test@example.com', 'wrongpassword'))
        .rejects.toMatchObject({
          statusCode: 401,
          code: 'UNAUTHORIZED',
        })
    })

    it('should not reveal whether email exists in error message', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      try {
        await authService.login('nonexistent@example.com', 'password123')
      } catch (error) {
        expect((error as AppError).message).toBe('Invalid email or password')
        expect((error as AppError).message).not.toContain('not found')
        expect((error as AppError).message).not.toContain('does not exist')
      }
    })
  })

  describe('changePassword', () => {
    it('should change password with valid current password', async () => {
      const mockUser = createMockUser()
      vi.mocked(prisma.user.findUniqueOrThrow).mockResolvedValue(mockUser)
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser)

      const passwordModule = await import('@/lib/password')
      vi.spyOn(passwordModule, 'verifyPassword').mockResolvedValue(true)
      vi.spyOn(passwordModule, 'hashPassword').mockResolvedValue('$2b$10$newhash')

      const result = await authService.changePassword('user-123', 'oldpassword', 'newpassword')

      expect(result).toEqual({ success: true })
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { passwordHash: '$2b$10$newhash' },
      })
    })

    it('should throw unauthorized error for incorrect current password', async () => {
      const mockUser = createMockUser()
      vi.mocked(prisma.user.findUniqueOrThrow).mockResolvedValue(mockUser)

      const passwordModule = await import('@/lib/password')
      vi.spyOn(passwordModule, 'verifyPassword').mockResolvedValue(false)

      await expect(authService.changePassword('user-123', 'wrongpassword', 'newpassword'))
        .rejects.toMatchObject({
          statusCode: 401,
          code: 'UNAUTHORIZED',
        })
    })

    it('should hash the new password before storing', async () => {
      const mockUser = createMockUser()
      vi.mocked(prisma.user.findUniqueOrThrow).mockResolvedValue(mockUser)
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser)

      const passwordModule = await import('@/lib/password')
      vi.spyOn(passwordModule, 'verifyPassword').mockResolvedValue(true)

      await authService.changePassword('user-123', 'oldpassword', 'newpassword')

      const updateCall = vi.mocked(prisma.user.update).mock.calls[0][0]
      expect(updateCall.data.passwordHash).toMatch(/^\$2[aby]?\$/)
    })
  })
})
