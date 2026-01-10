import { prisma } from '@/config/database'
import { Errors } from '@/lib/errors'
import { fromCents } from '@/lib/money'
import type { PortfolioSnapshot, SnapshotAsset } from '@prisma/client'

type PortfolioSnapshotWithAssets = PortfolioSnapshot & { assets: SnapshotAsset[] }

export const snapshotService = {
  async create(userId: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get current portfolio data
    const assets = await prisma.asset.findMany({
      where: { userId },
      include: { holding: true },
    })

    // Calculate total value and build asset breakdown
    let totalValueCents = BigInt(0)
    const assetBreakdown = assets
      .filter(asset => asset.holding && asset.currentPriceCents)
      .map(asset => {
        const quantity = Number(asset.holding!.quantity)
        const valueCents = BigInt(Math.round(quantity * Number(asset.currentPriceCents!)))
        totalValueCents += valueCents
        return {
          assetId: asset.id,
          ticker: asset.ticker,
          name: asset.name,
          quantity: asset.holding!.quantity,
          priceCents: asset.currentPriceCents!,
          valueCents,
        }
      })

    // Add percentage to each asset
    const assetsWithPercentage = assetBreakdown.map(asset => ({
      ...asset,
      percentage:
        totalValueCents > BigInt(0)
          ? Number((asset.valueCents * BigInt(10000)) / totalValueCents) / 100
          : 0,
    }))

    // Check if snapshot exists for today (upsert logic)
    const existingSnapshot = await prisma.portfolioSnapshot.findUnique({
      where: { userId_date: { userId, date: today } },
    })

    if (existingSnapshot) {
      // Update existing snapshot
      const updated = await prisma.$transaction(async tx => {
        // Delete old assets
        await tx.snapshotAsset.deleteMany({
          where: { snapshotId: existingSnapshot.id },
        })

        // Update snapshot
        const snapshot = await tx.portfolioSnapshot.update({
          where: { id: existingSnapshot.id },
          data: { totalValueCents },
        })

        // Create new assets
        await tx.snapshotAsset.createMany({
          data: assetsWithPercentage.map(a => ({
            snapshotId: snapshot.id,
            assetId: a.assetId,
            ticker: a.ticker,
            name: a.name,
            quantity: a.quantity,
            priceCents: a.priceCents,
            valueCents: a.valueCents,
            percentage: a.percentage,
          })),
        })

        return snapshot
      })

      return this.getById(userId, updated.id)
    }

    // Create new snapshot
    const snapshot = await prisma.$transaction(async tx => {
      const newSnapshot = await tx.portfolioSnapshot.create({
        data: {
          date: today,
          totalValueCents,
          userId,
        },
      })

      await tx.snapshotAsset.createMany({
        data: assetsWithPercentage.map(a => ({
          snapshotId: newSnapshot.id,
          assetId: a.assetId,
          ticker: a.ticker,
          name: a.name,
          quantity: a.quantity,
          priceCents: a.priceCents,
          valueCents: a.valueCents,
          percentage: a.percentage,
        })),
      })

      return newSnapshot
    })

    return this.getById(userId, snapshot.id)
  },

  async list(userId: string, query?: { from?: string; to?: string }) {
    const where: { userId: string; date?: { gte?: Date; lte?: Date } } = { userId }

    if (query?.from || query?.to) {
      where.date = {}
      if (query.from) where.date.gte = new Date(query.from)
      if (query.to) where.date.lte = new Date(query.to)
    }

    const snapshots = await prisma.portfolioSnapshot.findMany({
      where,
      include: { assets: true },
      orderBy: { date: 'desc' },
    })

    return {
      snapshots: snapshots.map(s => this.formatSnapshot(s)),
      total: snapshots.length,
    }
  },

  async getById(userId: string, id: string) {
    const snapshot = await prisma.portfolioSnapshot.findFirst({
      where: { id, userId },
      include: { assets: true },
    })

    if (!snapshot) {
      throw Errors.notFound('Snapshot')
    }

    return this.formatSnapshot(snapshot)
  },

  formatSnapshot(snapshot: PortfolioSnapshotWithAssets) {
    return {
      id: snapshot.id,
      date: snapshot.date.toISOString(),
      totalValue: fromCents(snapshot.totalValueCents),
      assets: snapshot.assets.map(a => ({
        assetId: a.assetId,
        ticker: a.ticker,
        name: a.name,
        quantity: a.quantity.toString(),
        price: fromCents(a.priceCents),
        value: fromCents(a.valueCents),
        percentage: a.percentage.toString(),
      })),
      createdAt: snapshot.createdAt.toISOString(),
    }
  },
}
