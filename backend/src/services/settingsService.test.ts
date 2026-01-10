import { describe, it, expect, vi, beforeEach } from 'vitest'
import { settingsService } from './settingsService'
import { prisma } from '@/config/database'
import { Decimal } from '@prisma/client/runtime/client'

// Mock the database
vi.mock('@/config/database', () => ({
  prisma: {
    user: {
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
  },
}))

describe('settingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getSettings', () => {
    it('should return user settings with defaults', async () => {
      vi.mocked(prisma.user.findUniqueOrThrow).mockResolvedValue({
        rebalanceThreshold: new Decimal('5.0'),
        priceAlertDays: 7,
      } as { rebalanceThreshold: Decimal; priceAlertDays: number })

      const result = await settingsService.getSettings('user-123')

      expect(result).toEqual({
        rebalanceThreshold: '5',
        priceAlertDays: 7,
      })
      expect(prisma.user.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: {
          rebalanceThreshold: true,
          priceAlertDays: true,
        },
      })
    })

    it('should return custom settings values', async () => {
      vi.mocked(prisma.user.findUniqueOrThrow).mockResolvedValue({
        rebalanceThreshold: new Decimal('10.5'),
        priceAlertDays: 14,
      } as { rebalanceThreshold: Decimal; priceAlertDays: number })

      const result = await settingsService.getSettings('user-123')

      expect(result).toEqual({
        rebalanceThreshold: '10.5',
        priceAlertDays: 14,
      })
    })
  })

  describe('updateSettings', () => {
    it('should update rebalance threshold', async () => {
      vi.mocked(prisma.user.update).mockResolvedValue({
        rebalanceThreshold: new Decimal('10'),
        priceAlertDays: 7,
      } as { rebalanceThreshold: Decimal; priceAlertDays: number })

      const result = await settingsService.updateSettings('user-123', {
        rebalanceThreshold: 10,
      })

      expect(result).toEqual({
        rebalanceThreshold: '10',
        priceAlertDays: 7,
      })
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          rebalanceThreshold: 10,
        },
        select: {
          rebalanceThreshold: true,
          priceAlertDays: true,
        },
      })
    })

    it('should update price alert days', async () => {
      vi.mocked(prisma.user.update).mockResolvedValue({
        rebalanceThreshold: new Decimal('5'),
        priceAlertDays: 14,
      } as { rebalanceThreshold: Decimal; priceAlertDays: number })

      const result = await settingsService.updateSettings('user-123', {
        priceAlertDays: 14,
      })

      expect(result).toEqual({
        rebalanceThreshold: '5',
        priceAlertDays: 14,
      })
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          priceAlertDays: 14,
        },
        select: {
          rebalanceThreshold: true,
          priceAlertDays: true,
        },
      })
    })

    it('should update both settings at once', async () => {
      vi.mocked(prisma.user.update).mockResolvedValue({
        rebalanceThreshold: new Decimal('15'),
        priceAlertDays: 21,
      } as { rebalanceThreshold: Decimal; priceAlertDays: number })

      const result = await settingsService.updateSettings('user-123', {
        rebalanceThreshold: 15,
        priceAlertDays: 21,
      })

      expect(result).toEqual({
        rebalanceThreshold: '15',
        priceAlertDays: 21,
      })
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          rebalanceThreshold: 15,
          priceAlertDays: 21,
        },
        select: {
          rebalanceThreshold: true,
          priceAlertDays: true,
        },
      })
    })
  })
})
