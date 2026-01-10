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
    it('should return onboarding status for existing user', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        onboardingCompleted: false,
        onboardingSkipped: false,
      } as ReturnType<typeof createMockUser>)

      const result = await onboardingService.getStatus('user-123')

      expect(result).toEqual({
        completed: false,
        skipped: false,
      })
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: {
          onboardingCompleted: true,
          onboardingSkipped: true,
        },
      })
    })

    it('should return completed true when onboarding is completed', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        onboardingCompleted: true,
        onboardingSkipped: false,
      } as ReturnType<typeof createMockUser>)

      const result = await onboardingService.getStatus('user-123')

      expect(result).toEqual({
        completed: true,
        skipped: false,
      })
    })

    it('should return skipped true when onboarding is skipped', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        onboardingCompleted: false,
        onboardingSkipped: true,
      } as ReturnType<typeof createMockUser>)

      const result = await onboardingService.getStatus('user-123')

      expect(result).toEqual({
        completed: false,
        skipped: true,
      })
    })

    it('should return default values if user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const result = await onboardingService.getStatus('nonexistent')

      expect(result).toEqual({
        completed: false,
        skipped: false,
      })
    })
  })

  describe('markCompleted', () => {
    it('should mark onboarding as completed', async () => {
      vi.mocked(prisma.user.update).mockResolvedValue({
        onboardingCompleted: true,
        onboardingSkipped: false,
      } as ReturnType<typeof createMockUser>)

      const result = await onboardingService.markCompleted('user-123')

      expect(result).toEqual({
        completed: true,
        skipped: false,
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
        },
      })
    })

    it('should clear skipped flag when completing', async () => {
      vi.mocked(prisma.user.update).mockResolvedValue({
        onboardingCompleted: true,
        onboardingSkipped: false,
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
      } as ReturnType<typeof createMockUser>)

      const result = await onboardingService.markSkipped('user-123')

      expect(result).toEqual({
        completed: false,
        skipped: true,
      })
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          onboardingSkipped: true,
        },
        select: {
          onboardingCompleted: true,
          onboardingSkipped: true,
        },
      })
    })

    it('should preserve completed status when skipping', async () => {
      vi.mocked(prisma.user.update).mockResolvedValue({
        onboardingCompleted: true,
        onboardingSkipped: true,
      } as ReturnType<typeof createMockUser>)

      const result = await onboardingService.markSkipped('user-123')

      expect(result.completed).toBe(true)
    })
  })
})
