import { prisma } from '@/config/database'
import { Errors } from '@/lib/errors'
import { Prisma } from '@prisma/client'
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
    let totalValue = new Prisma.Decimal(0)
    const assetBreakdown = assets
      .filter(asset => asset.holding && asset.currentPrice)
      .map(asset => {
        const quantity = asset.holding!.quantity
        const value = quantity.mul(asset.currentPrice!)
        totalValue = totalValue.add(value)
        return {
          assetId: asset.id,
          ticker: asset.ticker,
          name: asset.name,
          quantity: asset.holding!.quantity,
          price: asset.currentPrice!,
          value,
        }
      })

    // Add percentage to each asset
    const assetsWithPercentage = assetBreakdown.map(asset => ({
      ...asset,
      percentage: totalValue.gt(0)
        ? asset.value.mul(100).div(totalValue).toNumber()
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
          data: { totalValue },
        })

        // Create new assets
        await tx.snapshotAsset.createMany({
          data: assetsWithPercentage.map(a => ({
            snapshotId: snapshot.id,
            assetId: a.assetId,
            ticker: a.ticker,
            name: a.name,
            quantity: a.quantity,
            price: a.price,
            value: a.value,
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
          totalValue,
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
          price: a.price,
          value: a.value,
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
      totalValue: snapshot.totalValue.toString(),
      assets: snapshot.assets.map(a => ({
        assetId: a.assetId,
        ticker: a.ticker,
        name: a.name,
        quantity: a.quantity.toString(),
        price: a.price.toString(),
        value: a.value.toString(),
        percentage: a.percentage.toString(),
      })),
      createdAt: snapshot.createdAt.toISOString(),
    }
  },
}
