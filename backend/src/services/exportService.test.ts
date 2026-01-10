import { describe, it, expect, vi, beforeEach } from 'vitest'
import { exportService } from './exportService'
import { prisma } from '@/config/database'
import { Decimal } from '@prisma/client/runtime/client'

// Mock the database
vi.mock('@/config/database', () => ({
  prisma: {
    user: {
      findUniqueOrThrow: vi.fn(),
    },
    asset: {
      findMany: vi.fn(),
    },
    holding: {
      findMany: vi.fn(),
    },
    transaction: {
      findMany: vi.fn(),
    },
    portfolioSnapshot: {
      findMany: vi.fn(),
    },
  },
}))

const mockUser = {
  email: 'test@example.com',
}

const mockAsset = {
  id: 'asset-1',
  ticker: 'AAPL',
  name: 'Apple Inc',
  category: 'ETF',
  targetPercentage: new Decimal('25'),
  currentPriceCents: BigInt(15000),
  priceUpdatedAt: new Date('2026-01-10T12:00:00Z'),
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-10T12:00:00Z'),
}

const mockHolding = {
  id: 'holding-1',
  quantity: new Decimal('10.5'),
  updatedAt: new Date('2026-01-10T12:00:00Z'),
  asset: { ticker: 'AAPL' },
}

const mockTransaction = {
  id: 'tx-1',
  type: 'BUY',
  date: new Date('2026-01-05T00:00:00Z'),
  quantity: new Decimal('10.5'),
  priceCents: BigInt(14500),
  commissionCents: BigInt(100),
  totalCents: BigInt(152350),
  asset: { ticker: 'AAPL' },
}

const mockSnapshot = {
  id: 'snap-1',
  date: new Date('2026-01-10T00:00:00Z'),
  totalValueCents: BigInt(15750000),
  assets: [{ id: 'sa-1' }],
}

describe('exportService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('exportJson', () => {
    it('should export all user data as JSON', async () => {
      vi.mocked(prisma.user.findUniqueOrThrow).mockResolvedValue(mockUser as never)
      vi.mocked(prisma.asset.findMany).mockResolvedValue([mockAsset] as never)
      vi.mocked(prisma.holding.findMany).mockResolvedValue([mockHolding] as never)
      vi.mocked(prisma.transaction.findMany).mockResolvedValue([mockTransaction] as never)
      vi.mocked(prisma.portfolioSnapshot.findMany).mockResolvedValue([mockSnapshot] as never)

      const result = await exportService.exportJson('user-123')

      expect(result.user.email).toBe('test@example.com')
      expect(result.assets).toHaveLength(1)
      expect(result.assets[0].ticker).toBe('AAPL')
      expect(result.holdings).toHaveLength(1)
      expect(result.holdings[0].ticker).toBe('AAPL')
      expect(result.transactions).toHaveLength(1)
      expect(result.transactions[0].type).toBe('BUY')
      expect(result.snapshots).toHaveLength(1)
      expect(result.exportedAt).toBeDefined()
    })

    it('should handle assets without price', async () => {
      const assetNoPrice = { ...mockAsset, currentPriceCents: null, priceUpdatedAt: null }
      vi.mocked(prisma.user.findUniqueOrThrow).mockResolvedValue(mockUser as never)
      vi.mocked(prisma.asset.findMany).mockResolvedValue([assetNoPrice] as never)
      vi.mocked(prisma.holding.findMany).mockResolvedValue([])
      vi.mocked(prisma.transaction.findMany).mockResolvedValue([])
      vi.mocked(prisma.portfolioSnapshot.findMany).mockResolvedValue([])

      const result = await exportService.exportJson('user-123')

      expect(result.assets[0].currentPrice).toBeNull()
      expect(result.assets[0].priceUpdatedAt).toBeNull()
    })

    it('should include correct asset count in snapshots', async () => {
      const snapshotWithAssets = {
        ...mockSnapshot,
        assets: [{ id: 'sa-1' }, { id: 'sa-2' }, { id: 'sa-3' }],
      }
      vi.mocked(prisma.user.findUniqueOrThrow).mockResolvedValue(mockUser as never)
      vi.mocked(prisma.asset.findMany).mockResolvedValue([])
      vi.mocked(prisma.holding.findMany).mockResolvedValue([])
      vi.mocked(prisma.transaction.findMany).mockResolvedValue([])
      vi.mocked(prisma.portfolioSnapshot.findMany).mockResolvedValue([snapshotWithAssets] as never)

      const result = await exportService.exportJson('user-123')

      expect(result.snapshots[0].assetCount).toBe(3)
    })
  })

  describe('exportCsv', () => {
    it('should export all user data as ZIP containing CSVs', async () => {
      vi.mocked(prisma.user.findUniqueOrThrow).mockResolvedValue(mockUser as never)
      vi.mocked(prisma.asset.findMany).mockResolvedValue([mockAsset] as never)
      vi.mocked(prisma.holding.findMany).mockResolvedValue([mockHolding] as never)
      vi.mocked(prisma.transaction.findMany).mockResolvedValue([mockTransaction] as never)
      vi.mocked(prisma.portfolioSnapshot.findMany).mockResolvedValue([mockSnapshot] as never)

      const result = await exportService.exportCsv('user-123')

      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBeGreaterThan(0)
      // ZIP file magic bytes: PK
      expect(result[0]).toBe(0x50) // 'P'
      expect(result[1]).toBe(0x4b) // 'K'
    })

    it('should handle empty data', async () => {
      vi.mocked(prisma.user.findUniqueOrThrow).mockResolvedValue(mockUser as never)
      vi.mocked(prisma.asset.findMany).mockResolvedValue([])
      vi.mocked(prisma.holding.findMany).mockResolvedValue([])
      vi.mocked(prisma.transaction.findMany).mockResolvedValue([])
      vi.mocked(prisma.portfolioSnapshot.findMany).mockResolvedValue([])

      const result = await exportService.exportCsv('user-123')

      expect(result).toBeInstanceOf(Buffer)
      // Should still be a valid ZIP with empty CSVs (headers only)
      expect(result[0]).toBe(0x50) // 'P'
      expect(result[1]).toBe(0x4b) // 'K'
    })
  })
})
