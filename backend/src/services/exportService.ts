import { prisma } from '@/config/database'
import archiver from 'archiver'
import { stringify } from 'csv-stringify/sync'

export interface ExportData {
  exportedAt: string
  user: { email: string }
  assets: ExportAsset[]
  holdings: ExportHolding[]
  transactions: ExportTransaction[]
  snapshots: ExportSnapshot[]
}

interface ExportAsset {
  id: string
  ticker: string
  name: string
  category: string
  targetPercentage: string
  currentPrice: string | null
  priceUpdatedAt: string | null
  createdAt: string
  updatedAt: string
}

interface ExportHolding {
  ticker: string
  quantity: string
  updatedAt: string
}

interface ExportTransaction {
  ticker: string
  type: string
  date: string
  quantity: string
  price: string
  commission: string
  total: string
}

interface ExportSnapshot {
  date: string
  totalValue: string
  assetCount: number
}

export const exportService = {
  /**
   * Export all user data as JSON
   * @param userId - The user's ID
   * @returns ExportData object with all user data
   */
  async exportJson(userId: string): Promise<ExportData> {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { email: true },
    })

    const [assets, holdings, transactions, snapshots] = await Promise.all([
      prisma.asset.findMany({
        where: { userId },
        orderBy: { ticker: 'asc' },
      }),
      prisma.holding.findMany({
        where: { userId },
        include: { asset: { select: { ticker: true } } },
        orderBy: { asset: { ticker: 'asc' } },
      }),
      prisma.transaction.findMany({
        where: { asset: { userId } },
        include: { asset: { select: { ticker: true } } },
        orderBy: { date: 'desc' },
      }),
      prisma.portfolioSnapshot.findMany({
        where: { userId },
        include: { assets: true },
        orderBy: { date: 'desc' },
      }),
    ])

    return {
      exportedAt: new Date().toISOString(),
      user: { email: user.email },
      assets: assets.map(a => ({
        id: a.id,
        ticker: a.ticker,
        name: a.name,
        category: a.category,
        targetPercentage: a.targetPercentage.toString(),
        currentPrice: a.currentPrice?.toString() ?? null,
        priceUpdatedAt: a.priceUpdatedAt?.toISOString() ?? null,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      })),
      holdings: holdings.map(h => ({
        ticker: h.asset.ticker,
        quantity: h.quantity.toString(),
        updatedAt: h.updatedAt.toISOString(),
      })),
      transactions: transactions.map(t => ({
        ticker: t.asset.ticker,
        type: t.type,
        date: t.date.toISOString(),
        quantity: t.quantity.toString(),
        price: t.price.toString(),
        commission: t.commission.toString(),
        total: t.total.toString(),
      })),
      snapshots: snapshots.map(s => ({
        date: s.date.toISOString(),
        totalValue: s.totalValue.toString(),
        assetCount: s.assets.length,
      })),
    }
  },

  /**
   * Export all user data as a ZIP file containing CSVs
   * @param userId - The user's ID
   * @returns Buffer containing the ZIP file
   */
  async exportCsv(userId: string): Promise<Buffer> {
    const data = await this.exportJson(userId)

    return new Promise((resolve, reject) => {
      const archive = archiver('zip', { zlib: { level: 9 } })
      const chunks: Buffer[] = []

      archive.on('data', chunk => chunks.push(chunk))
      archive.on('end', () => resolve(Buffer.concat(chunks)))
      archive.on('error', err => reject(err))

      // Assets CSV
      const assetsCsv = stringify(
        data.assets.map(a => ({
          id: a.id,
          ticker: a.ticker,
          name: a.name,
          category: a.category,
          targetPercentage: a.targetPercentage,
          currentPrice: a.currentPrice ?? '',
          priceUpdatedAt: a.priceUpdatedAt ?? '',
          createdAt: a.createdAt,
          updatedAt: a.updatedAt,
        })),
        { header: true }
      )
      archive.append(assetsCsv, { name: 'assets.csv' })

      // Holdings CSV
      const holdingsCsv = stringify(
        data.holdings.map(h => ({
          ticker: h.ticker,
          quantity: h.quantity,
          updatedAt: h.updatedAt,
        })),
        { header: true }
      )
      archive.append(holdingsCsv, { name: 'holdings.csv' })

      // Transactions CSV
      const transactionsCsv = stringify(
        data.transactions.map(t => ({
          ticker: t.ticker,
          type: t.type,
          date: t.date,
          quantity: t.quantity,
          price: t.price,
          commission: t.commission,
          total: t.total,
        })),
        { header: true }
      )
      archive.append(transactionsCsv, { name: 'transactions.csv' })

      // Snapshots CSV
      const snapshotsCsv = stringify(
        data.snapshots.map(s => ({
          date: s.date,
          totalValue: s.totalValue,
          assetCount: s.assetCount,
        })),
        { header: true }
      )
      archive.append(snapshotsCsv, { name: 'snapshots.csv' })

      archive.finalize()
    })
  },
}
