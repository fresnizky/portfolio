import { describe, it, expect, vi, beforeEach } from 'vitest'
import { onboardingService } from './onboardingService'
import { prisma } from '@/config/database'

// Mock the database
vi.mock('@/config/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  passwordHash: '$2b$10$hashedpassword',
  onboardingCompleted: false,
  onboardingSkipped: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

describe('onboardingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getStatus', () => {
    it('should return onboarding status for existing user with no assets', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        onboardingCompleted: false,
        onboardingSkipped: false,
        _count: { assets: 0 },
      } as ReturnType<typeof createMockUser>)

      const result = await onboardingService.getStatus('user-123')

      expect(result).toEqual({
        completed: false,
        skipped: false,
        hasExistingData: false,
      })
    })

    it('should return completed true when onboarding is completed', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        onboardingCompleted: true,
        onboardingSkipped: false,
        _count: { assets: 0 },
      } as ReturnType<typeof createMockUser>)

      const result = await onboardingService.getStatus('user-123')

      expect(result).toEqual({
        completed: true,
        skipped: false,
        hasExistingData: false,
      })
    })

    it('should return skipped true when onboarding is skipped', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        onboardingCompleted: false,
        onboardingSkipped: true,
        _count: { assets: 0 },
      } as ReturnType<typeof createMockUser>)

      const result = await onboardingService.getStatus('user-123')

      expect(result).toEqual({
        completed: false,
        skipped: true,
        hasExistingData: false,
      })
    })

    it('should return default values if user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const result = await onboardingService.getStatus('nonexistent')

      expect(result).toEqual({
        completed: false,
        skipped: false,
        hasExistingData: false,
      })
    })

    it('should return hasExistingData true when user has assets', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        onboardingCompleted: false,
        onboardingSkipped: false,
        _count: { assets: 5 },
      } as ReturnType<typeof createMockUser>)

      const result = await onboardingService.getStatus('user-123')

      expect(result).toEqual({
        completed: true, // Should be true because user has existing data
        skipped: false,
        hasExistingData: true,
      })
    })

    it('should return hasExistingData false when user has no assets', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        onboardingCompleted: false,
        onboardingSkipped: false,
        _count: { assets: 0 },
      } as ReturnType<typeof createMockUser>)

      const result = await onboardingService.getStatus('user-123')

      expect(result).toEqual({
        completed: false,
        skipped: false,
        hasExistingData: false,
      })
    })

    it('should query for asset count in findUnique', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        onboardingCompleted: false,
        onboardingSkipped: false,
        _count: { assets: 0 },
      } as ReturnType<typeof createMockUser>)

      await onboardingService.getStatus('user-123')

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: {
          onboardingCompleted: true,
          onboardingSkipped: true,
          _count: {
            select: { assets: true },
          },
        },
      })
    })
  })

  describe('markCompleted', () => {
    it('should mark onboarding as completed', async () => {
      vi.mocked(prisma.user.update).mockResolvedValue({
        onboardingCompleted: true,
        onboardingSkipped: false,
        _count: { assets: 3 },
      } as ReturnType<typeof createMockUser>)

      const result = await onboardingService.markCompleted('user-123')

      expect(result).toEqual({
        completed: true,
        skipped: false,
        hasExistingData: true,
      })
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          onboardingCompleted: true,
          onboardingSkipped: false,
        },
        select: {
          onboardingCompleted: true,
          onboardingSkipped: true,
          _count: {
            select: { assets: true },
          },
        },
      })
    })

    it('should clear skipped flag when completing', async () => {
      vi.mocked(prisma.user.update).mockResolvedValue({
        onboardingCompleted: true,
        onboardingSkipped: false,
        _count: { assets: 0 },
      } as ReturnType<typeof createMockUser>)

      await onboardingService.markCompleted('user-123')

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            onboardingSkipped: false,
          }),
        })
      )
    })
  })

  describe('markSkipped', () => {
    it('should mark onboarding as skipped', async () => {
      vi.mocked(prisma.user.update).mockResolvedValue({
        onboardingCompleted: false,
        onboardingSkipped: true,
        _count: { assets: 0 },
      } as ReturnType<typeof createMockUser>)

      const result = await onboardingService.markSkipped('user-123')

      expect(result).toEqual({
        completed: false,
        skipped: true,
        hasExistingData: false,
      })
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          onboardingSkipped: true,
        },
        select: {
          onboardingCompleted: true,
          onboardingSkipped: true,
          _count: {
            select: { assets: true },
          },
        },
      })
    })

    it('should preserve completed status when skipping', async () => {
      vi.mocked(prisma.user.update).mockResolvedValue({
        onboardingCompleted: true,
        onboardingSkipped: true,
        _count: { assets: 2 },
      } as ReturnType<typeof createMockUser>)

      const result = await onboardingService.markSkipped('user-123')

      expect(result.completed).toBe(true)
      expect(result.hasExistingData).toBe(true)
    })
  })
})
