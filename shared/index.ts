/**
 * Shared Schemas and Types
 *
 * This module exports Zod schemas and TypeScript types that are shared
 * between the backend and frontend. This ensures type safety and
 * contract consistency across the entire application.
 *
 * Usage:
 *   import { Transaction, validateTransaction } from '@shared'
 */

// Transaction schemas and types
export {
  // Schemas
  transactionSchema,
  transactionResponseSchema,
  transactionListResponseSchema,
  transactionAssetSchema,
  buyTransactionSchema,
  sellTransactionSchema,
  // Types
  type Transaction,
  type TransactionResponse,
  type TransactionListResponse,
  type TransactionAsset,
  type BuyTransaction,
  type SellTransaction,
  // Validators
  validateTransaction,
  validateTransactionList,
  safeValidateTransaction,
  safeValidateTransactionList,
} from './schemas/transaction'
