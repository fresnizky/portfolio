import { prisma } from '@/config/database'
import { Errors } from '@/lib/errors'
import { countDecimalPlaces } from '@/lib/money'
import { Prisma } from '@prisma/client'
import type { CreateTransactionInput, TransactionListQuery } from '@/validations/transaction'

/**
 * Format transaction for API response
 */
function formatTransaction(tx: {
  id: string
  type: 'BUY' | 'SELL'
  assetId: string
  date: Date
  quantity: Prisma.Decimal
  price: Prisma.Decimal
  commission: Prisma.Decimal
  total: Prisma.Decimal
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
    price: tx.price.toString(),
    commission: tx.commission.toString(),
    totalCost: tx.type === 'BUY' ? tx.total.toString() : undefined,
    totalProceeds: tx.type === 'SELL' ? tx.total.toString() : undefined,
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

    // Validate quantity precision against asset's decimal places
    const quantityDecimals = countDecimalPlaces(input.quantity)
    if (quantityDecimals > asset.decimalPlaces) {
      throw Errors.validation(
        `Quantity exceeds ${asset.decimalPlaces} decimal places for ${asset.ticker}`,
        {
          decimalPlaces: asset.decimalPlaces,
          provided: quantityDecimals,
          ticker: asset.ticker,
        }
      )
    }

    // For SELL, validate sufficient holdings
    if (input.type === 'sell') {
      await this.validateSellQuantity(userId, input.assetId, input.quantity)
    }

    // Calculate amounts using Prisma Decimal
    const price = new Prisma.Decimal(input.price)
    const commission = new Prisma.Decimal(input.commission)
    const quantity = new Prisma.Decimal(input.quantity)

    // baseAmount = quantity × price
    const baseAmount = quantity.mul(price)

    // total based on type:
    // BUY: add commission to cost
    // SELL: subtract commission from proceeds
    const total =
      input.type === 'buy'
        ? baseAmount.add(commission)
        : baseAmount.sub(commission)

    // Atomic transaction: create transaction record + update holding
    const result = await prisma.$transaction(async (tx) => {
      // Create the transaction record
      const transaction = await tx.transaction.create({
        data: {
          type: input.type.toUpperCase() as 'BUY' | 'SELL',
          date: new Date(input.date),
          quantity,
          price,
          commission,
          total,
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
        const currentQty = existingHolding.quantity
        const newQty =
          input.type === 'buy'
            ? currentQty.add(quantity)
            : currentQty.sub(quantity)

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
            quantity,
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

    // Compare using Decimal
    const requestedQty = new Prisma.Decimal(quantity)
    if (holding.quantity.lt(requestedQty)) {
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
