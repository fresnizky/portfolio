import { describe, it, expect } from 'vitest'
import {
  transactionSchema,
  transactionResponseSchema,
  transactionListResponseSchema,
  validateTransaction,
  safeValidateTransaction,
} from './transaction'

describe('Transaction Schema Contract Tests', () => {
  /**
   * These tests verify the contract between backend and frontend.
   * If these tests fail, it means the API response format has changed
   * and both backend and frontend need to be updated.
   */

  describe('transactionSchema', () => {
    it('should validate a valid BUY transaction', () => {
      const buyTransaction = {
        id: 'tx-123',
        type: 'BUY' as const,
        assetId: 'asset-456',
        asset: {
          ticker: 'VOO',
          name: 'Vanguard S&P 500 ETF',
        },
        date: '2026-01-07T12:00:00.000Z',
        quantity: '10.5',
        price: '450.75',
        commission: '5.00',
        totalCost: '4737.88',
        createdAt: '2026-01-07T12:00:00.000Z',
      }

      const result = transactionSchema.safeParse(buyTransaction)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.type).toBe('BUY')
        expect(result.data.totalCost).toBe('4737.88')
        expect(result.data.totalProceeds).toBeUndefined()
      }
    })

    it('should validate a valid SELL transaction', () => {
      const sellTransaction = {
        id: 'tx-789',
        type: 'SELL' as const,
        assetId: 'asset-456',
        asset: {
          ticker: 'VOO',
          name: 'Vanguard S&P 500 ETF',
        },
        date: '2026-01-08T12:00:00.000Z',
        quantity: '5.0',
        price: '460.00',
        commission: '5.00',
        totalProceeds: '2295.00',
        createdAt: '2026-01-08T12:00:00.000Z',
      }

      const result = transactionSchema.safeParse(sellTransaction)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.type).toBe('SELL')
        expect(result.data.totalProceeds).toBe('2295.00')
        expect(result.data.totalCost).toBeUndefined()
      }
    })

    it('should reject BUY transaction without totalCost', () => {
      const invalidBuy = {
        id: 'tx-123',
        type: 'BUY',
        assetId: 'asset-456',
        asset: { ticker: 'VOO', name: 'Vanguard S&P 500 ETF' },
        date: '2026-01-07T12:00:00.000Z',
        quantity: '10',
        price: '450.75',
        commission: '5.00',
        // Missing totalCost
        createdAt: '2026-01-07T12:00:00.000Z',
      }

      const result = transactionSchema.safeParse(invalidBuy)
      expect(result.success).toBe(false)
    })

    it('should reject SELL transaction without totalProceeds', () => {
      const invalidSell = {
        id: 'tx-789',
        type: 'SELL',
        assetId: 'asset-456',
        asset: { ticker: 'VOO', name: 'Vanguard S&P 500 ETF' },
        date: '2026-01-08T12:00:00.000Z',
        quantity: '5',
        price: '460.00',
        commission: '5.00',
        // Missing totalProceeds
        createdAt: '2026-01-08T12:00:00.000Z',
      }

      const result = transactionSchema.safeParse(invalidSell)
      expect(result.success).toBe(false)
    })

    it('should reject transaction with OLD field names (priceCents)', () => {
      // This is the OLD format that caused the $NaN bug
      const oldFormat = {
        id: 'tx-123',
        type: 'BUY',
        assetId: 'asset-456',
        asset: { ticker: 'VOO', name: 'Vanguard S&P 500 ETF' },
        date: '2026-01-07T12:00:00.000Z',
        quantity: '10',
        priceCents: '45075', // OLD field name - should fail
        commissionCents: '500', // OLD field name - should fail
        totalCents: '473788', // OLD field name - should fail
        createdAt: '2026-01-07T12:00:00.000Z',
      }

      const result = transactionSchema.safeParse(oldFormat)
      expect(result.success).toBe(false)
    })
  })

  describe('transactionResponseSchema', () => {
    it('should validate transaction with both totalCost and totalProceeds as optional', () => {
      const transaction = {
        id: 'tx-123',
        type: 'BUY' as const,
        assetId: 'asset-456',
        asset: { ticker: 'VOO', name: 'Vanguard S&P 500 ETF' },
        date: '2026-01-07T12:00:00.000Z',
        quantity: '10',
        price: '450.75',
        commission: '5.00',
        totalCost: '4512.50',
        createdAt: '2026-01-07T12:00:00.000Z',
      }

      const result = transactionResponseSchema.safeParse(transaction)
      expect(result.success).toBe(true)
    })
  })

  describe('transactionListResponseSchema', () => {
    it('should validate a list response', () => {
      const listResponse = {
        transactions: [
          {
            id: 'tx-1',
            type: 'BUY',
            assetId: 'asset-1',
            asset: { ticker: 'VOO', name: 'Vanguard S&P 500 ETF' },
            date: '2026-01-07T12:00:00.000Z',
            quantity: '10',
            price: '450.75',
            commission: '5.00',
            totalCost: '4512.50',
            createdAt: '2026-01-07T12:00:00.000Z',
          },
          {
            id: 'tx-2',
            type: 'SELL',
            assetId: 'asset-1',
            asset: { ticker: 'VOO', name: 'Vanguard S&P 500 ETF' },
            date: '2026-01-08T12:00:00.000Z',
            quantity: '5',
            price: '460.00',
            commission: '5.00',
            totalProceeds: '2295.00',
            createdAt: '2026-01-08T12:00:00.000Z',
          },
        ],
        total: 2,
      }

      const result = transactionListResponseSchema.safeParse(listResponse)
      expect(result.success).toBe(true)
    })
  })

  describe('validateTransaction helper', () => {
    it('should return validated transaction on success', () => {
      const validTx = {
        id: 'tx-123',
        type: 'BUY' as const,
        assetId: 'asset-456',
        asset: { ticker: 'VOO', name: 'Vanguard S&P 500 ETF' },
        date: '2026-01-07T12:00:00.000Z',
        quantity: '10',
        price: '450.75',
        commission: '5.00',
        totalCost: '4512.50',
        createdAt: '2026-01-07T12:00:00.000Z',
      }

      const result = validateTransaction(validTx)
      expect(result.id).toBe('tx-123')
    })

    it('should throw on invalid transaction', () => {
      const invalidTx = { id: 'tx-123' } // Missing required fields

      expect(() => validateTransaction(invalidTx)).toThrow()
    })
  })

  describe('safeValidateTransaction helper', () => {
    it('should return success result for valid transaction', () => {
      const validTx = {
        id: 'tx-123',
        type: 'BUY' as const,
        assetId: 'asset-456',
        asset: { ticker: 'VOO', name: 'Vanguard S&P 500 ETF' },
        date: '2026-01-07T12:00:00.000Z',
        quantity: '10',
        price: '450.75',
        commission: '5.00',
        totalCost: '4512.50',
        createdAt: '2026-01-07T12:00:00.000Z',
      }

      const result = safeValidateTransaction(validTx)
      expect(result.success).toBe(true)
    })

    it('should return error result for invalid transaction without throwing', () => {
      const invalidTx = { id: 'tx-123' }

      const result = safeValidateTransaction(invalidTx)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeDefined()
      }
    })
  })

  describe('Contract Regression Tests', () => {
    /**
     * These tests document the exact contract that frontend depends on.
     * If you need to change the API response format:
     * 1. Update the shared schema
     * 2. Update backend formatTransaction()
     * 3. Update frontend components
     * 4. Update these tests
     */

    it('should have price as string (pre-formatted), not cents', () => {
      const tx = {
        id: 'tx-1',
        type: 'BUY' as const,
        assetId: 'asset-1',
        asset: { ticker: 'VOO', name: 'Test' },
        date: '2026-01-07T12:00:00.000Z',
        quantity: '10',
        price: '450.75', // Must be string like "450.75", not number or cents
        commission: '5.00',
        totalCost: '4512.50',
        createdAt: '2026-01-07T12:00:00.000Z',
      }

      const result = transactionSchema.safeParse(tx)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(typeof result.data.price).toBe('string')
        expect(result.data.price).toMatch(/^\d+\.\d{2}$/)
      }
    })

    it('should have quantity as string for decimal precision', () => {
      const tx = {
        id: 'tx-1',
        type: 'BUY' as const,
        assetId: 'asset-1',
        asset: { ticker: 'BTC', name: 'Bitcoin' },
        date: '2026-01-07T12:00:00.000Z',
        quantity: '0.00012345', // Crypto fractional amounts
        price: '42000.00',
        commission: '0.00',
        totalCost: '5.18',
        createdAt: '2026-01-07T12:00:00.000Z',
      }

      const result = transactionSchema.safeParse(tx)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(typeof result.data.quantity).toBe('string')
      }
    })
  })
})
