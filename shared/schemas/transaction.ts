import { z } from 'zod'

/**
 * Transaction Response Schema
 *
 * This schema defines the EXACT shape of transaction data returned by the API.
 * It is the single source of truth for both backend and frontend.
 *
 * Backend: Uses this to validate outgoing responses
 * Frontend: Uses inferred type for type safety + optional runtime validation
 *
 * @see backend/src/services/transactionService.ts formatTransaction()
 */

// Asset info embedded in transaction response
export const transactionAssetSchema = z.object({
  ticker: z.string(),
  name: z.string(),
})

// Base transaction fields (common to BUY and SELL)
const baseTransactionSchema = z.object({
  id: z.string(),
  type: z.enum(['BUY', 'SELL']),
  assetId: z.string(),
  asset: transactionAssetSchema,
  date: z.string().datetime(), // ISO 8601
  quantity: z.string(), // Decimal as string for precision
  price: z.string(), // Pre-formatted dollar amount (e.g., "450.75")
  commission: z.string(), // Pre-formatted dollar amount (e.g., "5.00")
  createdAt: z.string().datetime(),
})

// BUY transaction has totalCost
export const buyTransactionSchema = baseTransactionSchema.extend({
  type: z.literal('BUY'),
  totalCost: z.string(), // Pre-formatted total (e.g., "4512.50")
  totalProceeds: z.undefined().optional(),
})

// SELL transaction has totalProceeds
export const sellTransactionSchema = baseTransactionSchema.extend({
  type: z.literal('SELL'),
  totalCost: z.undefined().optional(),
  totalProceeds: z.string(), // Pre-formatted total (e.g., "625.00")
})

// Union of BUY and SELL transactions
export const transactionSchema = z.discriminatedUnion('type', [
  buyTransactionSchema,
  sellTransactionSchema,
])

// Simpler schema that accepts both totalCost and totalProceeds as optional
// Useful for lists where we don't want to discriminate on every item
export const transactionResponseSchema = baseTransactionSchema.extend({
  totalCost: z.string().optional(),
  totalProceeds: z.string().optional(),
})

// Transaction list response
export const transactionListResponseSchema = z.object({
  transactions: z.array(transactionResponseSchema),
  total: z.number(),
})

// ============================================
// Inferred Types (use these in your code)
// ============================================

export type TransactionAsset = z.infer<typeof transactionAssetSchema>
export type BuyTransaction = z.infer<typeof buyTransactionSchema>
export type SellTransaction = z.infer<typeof sellTransactionSchema>
export type Transaction = z.infer<typeof transactionSchema>
export type TransactionResponse = z.infer<typeof transactionResponseSchema>
export type TransactionListResponse = z.infer<typeof transactionListResponseSchema>

// ============================================
// Validation Helpers
// ============================================

/**
 * Validate a transaction response from the API.
 * Use this in development/testing to catch contract violations early.
 */
export function validateTransaction(data: unknown): Transaction {
  return transactionSchema.parse(data)
}

/**
 * Validate a transaction list response from the API.
 */
export function validateTransactionList(data: unknown): TransactionListResponse {
  return transactionListResponseSchema.parse(data)
}

/**
 * Safe validation that returns result instead of throwing.
 * Useful for runtime validation in production without crashing.
 */
export function safeValidateTransaction(data: unknown) {
  return transactionSchema.safeParse(data)
}

export function safeValidateTransactionList(data: unknown) {
  return transactionListResponseSchema.safeParse(data)
}
