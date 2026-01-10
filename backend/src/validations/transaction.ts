import { z } from 'zod'

// Transaction type enum matching Prisma
export const transactionTypeSchema = z.enum(['buy', 'sell'])

// Quantity: positive decimal number (supports crypto fractional units)
export const quantitySchema = z.coerce
  .number()
  .positive('Quantity must be greater than 0')

// Price: positive number, rounded to 2 decimals
export const priceSchema = z.coerce
  .number()
  .positive('Price must be greater than 0')
  .transform(val => Math.round(val * 100) / 100)

// Commission: non-negative number, defaults to 0
export const commissionSchema = z.coerce
  .number()
  .min(0, 'Commission cannot be negative')
  .default(0)
  .transform(val => Math.round(val * 100) / 100)

// Create transaction schema
export const createTransactionSchema = z.object({
  type: transactionTypeSchema,
  assetId: z.string().min(1, 'Asset ID is required'),
  date: z.string().datetime({ message: 'Invalid date format. Use ISO 8601 format.' }),
  quantity: quantitySchema,
  price: priceSchema,
  commission: commissionSchema,
})

// Transaction list query schema (all fields optional for filtering)
export const transactionListQuerySchema = z.object({
  assetId: z.string().min(1).optional(),
  type: transactionTypeSchema.optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
})

// Route params for single transaction
export const transactionParamsSchema = z.object({
  id: z.string().min(1, 'Transaction ID is required'),
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type TransactionListQuery = z.infer<typeof transactionListQuerySchema>
export type TransactionParams = z.infer<typeof transactionParamsSchema>
