import { prisma } from '@/config/database'
import { Errors } from '@/lib/errors'
import type { CreateAssetInput, UpdateAssetInput } from '@/validations/asset'

export const assetService = {
  async create(userId: string, data: CreateAssetInput) {
    // Check for duplicate ticker for this user
    const existing = await prisma.asset.findFirst({
      where: { userId, ticker: data.ticker },
    })
    if (existing) {
      throw Errors.validation('Asset with this ticker already exists', { ticker: data.ticker })
    }

    return prisma.asset.create({
      data: { ...data, userId },
    })
  },

  async list(userId: string) {
    return prisma.asset.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    })
  },

  async getById(userId: string, id: string) {
    const asset = await prisma.asset.findFirst({
      where: { id, userId },
    })
    if (!asset) {
      throw Errors.notFound('Asset')
    }
    return asset
  },

  async update(userId: string, id: string, data: UpdateAssetInput) {
    await this.getById(userId, id) // Verify ownership

    // If updating ticker, check for duplicates
    if (data.ticker) {
      const existing = await prisma.asset.findFirst({
        where: { userId, ticker: data.ticker, NOT: { id } },
      })
      if (existing) {
        throw Errors.validation('Asset with this ticker already exists', { ticker: data.ticker })
      }
    }

    return prisma.asset.update({
      where: { id },
      data,
    })
  },

  async delete(userId: string, id: string) {
    await this.getById(userId, id) // Verify ownership
    return prisma.asset.delete({ where: { id } })
  },
}
