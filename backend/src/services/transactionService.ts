import { prisma } from '@/config/database'
import { Errors } from '@/lib/errors'
import { toCents, fromCents } from '@/lib/money'
import type { CreateTransactionInput, TransactionListQuery } from '@/validations/transaction'

/**
 * Format transaction for API response
 */
function formatTransaction(tx: {
  id: string
  type: 'BUY' | 'SELL'
  assetId: string
  date: Date
  quantity: { toString(): string }
  priceCents: bigint
  commissionCents: bigint
  totalCents: bigint
  createdAt: Date
  asset: { ticker: string; name: string }
}) {
  return {
    id: tx.id,
    type: tx.type,
    assetId: tx.assetId,
    asset: {
      ticker: tx.asset.ticker,
      name: tx.asset.name,
    },
    date: tx.date.toISOString(),
    quantity: tx.quantity.toString(),
    price: fromCents(tx.priceCents),
    commission: fromCents(tx.commissionCents),
    totalCost: tx.type === 'BUY' ? fromCents(tx.totalCents) : undefined,
    totalProceeds: tx.type === 'SELL' ? fromCents(tx.totalCents) : undefined,
    createdAt: tx.createdAt.toISOString(),
  }
}

export const transactionService = {
  /**
   * Create a new transaction (buy or sell) with atomic holding update
   * @param userId - The ID of the user
   * @param input - Transaction data
   * @returns The created transaction
   * @throws NotFoundError if asset doesn't exist or belongs to another user
   * @throws ValidationError if selling more than available holdings
   */
  async create(userId: string, input: CreateTransactionInput) {
    // Verify asset belongs to user
    const asset = await prisma.asset.findFirst({
      where: { id: input.assetId, userId },
    })

    if (!asset) {
      throw Errors.notFound('Asset')
    }

    // For SELL, validate sufficient holdings
    if (input.type === 'sell') {
      await this.validateSellQuantity(userId, input.assetId, input.quantity)
    }

    // Calculate amounts in cents
    const priceCents = toCents(input.price)
    const commissionCents = toCents(input.commission)

    // quantity × priceCents (handle decimal quantity)
    // We need to use the quantity as-is and calculate with precision
    const baseAmountCents = BigInt(Math.round(input.quantity * Number(priceCents)))

    // totalCents based on type:
    // BUY: add commission to cost
    // SELL: subtract commission from proceeds
    const totalCents =
      input.type === 'buy'
        ? baseAmountCents + commissionCents
        : baseAmountCents - commissionCents

    // Atomic transaction: create transaction record + update holding
    const result = await prisma.$transaction(async (tx) => {
      // Create the transaction record
      const transaction = await tx.transaction.create({
        data: {
          type: input.type.toUpperCase() as 'BUY' | 'SELL',
          date: new Date(input.date),
          quantity: input.quantity,
          priceCents,
          commissionCents,
          totalCents,
          userId,
          assetId: input.assetId,
        },
        include: {
          asset: { select: { ticker: true, name: true } },
        },
      })

      // Update or create holding
      const existingHolding = await tx.holding.findUnique({
        where: { assetId: input.assetId },
      })

      if (existingHolding) {
        // Update existing holding
        const currentQty = Number(existingHolding.quantity.toString())
        const newQty =
          input.type === 'buy' ? currentQty + input.quantity : currentQty - input.quantity

        await tx.holding.update({
          where: { assetId: input.assetId },
          data: { quantity: newQty },
        })
      } else {
        // Create new holding (only for BUY - SELL already validated above)
        await tx.holding.create({
          data: {
            userId,
            assetId: input.assetId,
            quantity: input.quantity,
          },
        })
      }

      return transaction
    })

    return formatTransaction(result)
  },

  /**
   * Validate that user has sufficient holdings to sell
   * @throws ValidationError if holdings are insufficient
   */
  async validateSellQuantity(userId: string, assetId: string, quantity: number) {
    const holding = await prisma.holding.findFirst({
      where: { userId, assetId },
    })

    if (!holding) {
      throw Errors.validation('Insufficient holdings', {
        available: '0',
        requested: quantity.toString(),
      })
    }

    // Compare using number conversion for simplicity
    const holdingQty = Number(holding.quantity.toString())
    if (holdingQty < quantity) {
      throw Errors.validation('Insufficient holdings', {
        available: holding.quantity.toString(),
        requested: quantity.toString(),
      })
    }
  },

  /**
   * List transactions for a user with optional filters
   * @param userId - The ID of the user
   * @param query - Optional filters (assetId, type, fromDate, toDate)
   * @returns List of transactions and total count
   */
  async list(userId: string, query?: TransactionListQuery) {
    const where: {
      userId: string
      assetId?: string
      type?: 'BUY' | 'SELL'
      date?: { gte?: Date; lte?: Date }
    } = { userId }

    if (query?.assetId) {
      where.assetId = query.assetId
    }

    if (query?.type) {
      where.type = query.type.toUpperCase() as 'BUY' | 'SELL'
    }

    if (query?.fromDate || query?.toDate) {
      where.date = {}
      if (query.fromDate) {
        where.date.gte = new Date(query.fromDate)
      }
      if (query.toDate) {
        where.date.lte = new Date(query.toDate)
      }
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { asset: { select: { ticker: true, name: true } } },
        orderBy: { date: 'desc' },
      }),
      prisma.transaction.count({ where }),
    ])

    return {
      transactions: transactions.map(formatTransaction),
      total,
    }
  },

  /**
   * Get a single transaction by ID
   * @param userId - The ID of the user
   * @param transactionId - The ID of the transaction
   * @returns The transaction
   * @throws NotFoundError if transaction doesn't exist or belongs to another user
   */
  async getById(userId: string, transactionId: string) {
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, userId },
      include: { asset: { select: { ticker: true, name: true } } },
    })

    if (!transaction) {
      throw Errors.notFound('Transaction')
    }

    return formatTransaction(transaction)
  },
}
