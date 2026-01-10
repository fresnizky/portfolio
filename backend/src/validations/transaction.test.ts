import { describe, it, expect } from 'vitest'
import {
  transactionTypeSchema,
  quantitySchema,
  priceSchema,
  commissionSchema,
  createTransactionSchema,
  transactionListQuerySchema,
  transactionParamsSchema,
} from './transaction'

describe('transactionTypeSchema', () => {
  it('accepts "buy"', () => {
    expect(transactionTypeSchema.parse('buy')).toBe('buy')
  })

  it('accepts "sell"', () => {
    expect(transactionTypeSchema.parse('sell')).toBe('sell')
  })

  it('rejects invalid types', () => {
    expect(() => transactionTypeSchema.parse('hold')).toThrow()
    expect(() => transactionTypeSchema.parse('BUY')).toThrow()
    expect(() => transactionTypeSchema.parse('SELL')).toThrow()
    expect(() => transactionTypeSchema.parse('')).toThrow()
  })
})

describe('quantitySchema', () => {
  it('accepts positive integers', () => {
    expect(quantitySchema.parse(1)).toBe(1)
    expect(quantitySchema.parse(10)).toBe(10)
    expect(quantitySchema.parse(100)).toBe(100)
  })

  it('accepts positive decimals (crypto fractional units)', () => {
    expect(quantitySchema.parse(0.5)).toBe(0.5)
    expect(quantitySchema.parse(0.00001)).toBe(0.00001)
    expect(quantitySchema.parse(10.12345678)).toBe(10.12345678)
  })

  it('coerces string numbers', () => {
    expect(quantitySchema.parse('10')).toBe(10)
    expect(quantitySchema.parse('0.5')).toBe(0.5)
  })

  it('rejects zero', () => {
    expect(() => quantitySchema.parse(0)).toThrow()
    expect(() => quantitySchema.parse('0')).toThrow()
  })

  it('rejects negative values', () => {
    expect(() => quantitySchema.parse(-1)).toThrow()
    expect(() => quantitySchema.parse(-0.5)).toThrow()
  })

  it('rejects non-numeric values', () => {
    expect(() => quantitySchema.parse('abc')).toThrow()
    expect(() => quantitySchema.parse('')).toThrow()
  })
})

describe('priceSchema', () => {
  it('accepts positive numbers', () => {
    expect(priceSchema.parse(100)).toBe(100)
    expect(priceSchema.parse(450.75)).toBe(450.75)
  })

  it('rounds to 2 decimal places', () => {
    expect(priceSchema.parse(100.999)).toBe(101)
    expect(priceSchema.parse(100.994)).toBe(100.99)
    expect(priceSchema.parse(10.123)).toBe(10.12)
  })

  it('coerces string numbers', () => {
    expect(priceSchema.parse('100')).toBe(100)
    expect(priceSchema.parse('450.75')).toBe(450.75)
  })

  it('rejects zero', () => {
    expect(() => priceSchema.parse(0)).toThrow()
  })

  it('rejects negative values', () => {
    expect(() => priceSchema.parse(-10)).toThrow()
  })
})

describe('commissionSchema', () => {
  it('accepts zero', () => {
    expect(commissionSchema.parse(0)).toBe(0)
  })

  it('accepts positive values', () => {
    expect(commissionSchema.parse(5)).toBe(5)
    expect(commissionSchema.parse(10.50)).toBe(10.5)
  })

  it('rounds to 2 decimal places', () => {
    expect(commissionSchema.parse(5.999)).toBe(6)
    expect(commissionSchema.parse(5.994)).toBe(5.99)
  })

  it('defaults to 0 when undefined', () => {
    expect(commissionSchema.parse(undefined)).toBe(0)
  })

  it('rejects negative values', () => {
    expect(() => commissionSchema.parse(-1)).toThrow()
  })

  it('provides meaningful error for negative', () => {
    const result = commissionSchema.safeParse(-5)
    expect(result.success).toBe(false)
    if (!result.success) {
      const errorMessages = result.error.issues.map(i => i.message)
      expect(errorMessages).toContain('Commission cannot be negative')
    }
  })
})

describe('createTransactionSchema', () => {
  const validTransaction = {
    type: 'buy',
    assetId: 'clx1234567890',
    date: '2026-01-10T10:00:00.000Z',
    quantity: 10,
    price: 450.75,
    commission: 5,
  }

  it('validates complete buy transaction', () => {
    const result = createTransactionSchema.parse(validTransaction)
    expect(result.type).toBe('buy')
    expect(result.assetId).toBe('clx1234567890')
    expect(result.quantity).toBe(10)
    expect(result.price).toBe(450.75)
    expect(result.commission).toBe(5)
  })

  it('validates complete sell transaction', () => {
    const result = createTransactionSchema.parse({
      ...validTransaction,
      type: 'sell',
    })
    expect(result.type).toBe('sell')
  })

  it('defaults commission to 0 when not provided', () => {
    const { commission, ...withoutCommission } = validTransaction
    const result = createTransactionSchema.parse(withoutCommission)
    expect(result.commission).toBe(0)
  })

  it('accepts fractional quantity (crypto)', () => {
    const result = createTransactionSchema.parse({
      ...validTransaction,
      quantity: 0.00012345,
    })
    expect(result.quantity).toBe(0.00012345)
  })

  it('rounds price and commission to 2 decimals', () => {
    const result = createTransactionSchema.parse({
      ...validTransaction,
      price: 100.999,
      commission: 5.555,
    })
    expect(result.price).toBe(101)
    expect(result.commission).toBe(5.56)
  })

  it('rejects missing type', () => {
    const { type, ...withoutType } = validTransaction
    expect(() => createTransactionSchema.parse(withoutType)).toThrow()
  })

  it('rejects invalid type', () => {
    expect(() =>
      createTransactionSchema.parse({
        ...validTransaction,
        type: 'hold',
      })
    ).toThrow()
  })

  it('rejects missing assetId', () => {
    const { assetId, ...withoutAssetId } = validTransaction
    expect(() => createTransactionSchema.parse(withoutAssetId)).toThrow()
  })

  it('rejects empty assetId', () => {
    expect(() =>
      createTransactionSchema.parse({
        ...validTransaction,
        assetId: '',
      })
    ).toThrow()
  })

  it('rejects missing date', () => {
    const { date, ...withoutDate } = validTransaction
    expect(() => createTransactionSchema.parse(withoutDate)).toThrow()
  })

  it('rejects invalid date format', () => {
    expect(() =>
      createTransactionSchema.parse({
        ...validTransaction,
        date: '2026-01-10',
      })
    ).toThrow()

    expect(() =>
      createTransactionSchema.parse({
        ...validTransaction,
        date: 'not-a-date',
      })
    ).toThrow()
  })

  it('rejects missing quantity', () => {
    const { quantity, ...withoutQuantity } = validTransaction
    expect(() => createTransactionSchema.parse(withoutQuantity)).toThrow()
  })

  it('rejects zero quantity', () => {
    expect(() =>
      createTransactionSchema.parse({
        ...validTransaction,
        quantity: 0,
      })
    ).toThrow()
  })

  it('rejects negative quantity', () => {
    expect(() =>
      createTransactionSchema.parse({
        ...validTransaction,
        quantity: -10,
      })
    ).toThrow()
  })

  it('rejects missing price', () => {
    const { price, ...withoutPrice } = validTransaction
    expect(() => createTransactionSchema.parse(withoutPrice)).toThrow()
  })

  it('rejects zero price', () => {
    expect(() =>
      createTransactionSchema.parse({
        ...validTransaction,
        price: 0,
      })
    ).toThrow()
  })

  it('rejects negative commission', () => {
    expect(() =>
      createTransactionSchema.parse({
        ...validTransaction,
        commission: -5,
      })
    ).toThrow()
  })

  it('provides meaningful error for missing required field', () => {
    const { assetId, ...withoutAssetId } = validTransaction
    const result = createTransactionSchema.safeParse(withoutAssetId)
    expect(result.success).toBe(false)
  })

  it('provides meaningful error for invalid date', () => {
    const result = createTransactionSchema.safeParse({
      ...validTransaction,
      date: 'invalid-date',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const errorMessages = result.error.issues.map(i => i.message)
      expect(errorMessages.some(m => m.includes('date') || m.includes('ISO'))).toBe(true)
    }
  })
})

describe('transactionListQuerySchema', () => {
  it('accepts empty query (all optional)', () => {
    const result = transactionListQuerySchema.parse({})
    expect(result).toEqual({})
  })

  it('accepts assetId filter', () => {
    const result = transactionListQuerySchema.parse({ assetId: 'clx1234' })
    expect(result.assetId).toBe('clx1234')
  })

  it('accepts type filter', () => {
    const result = transactionListQuerySchema.parse({ type: 'buy' })
    expect(result.type).toBe('buy')

    const result2 = transactionListQuerySchema.parse({ type: 'sell' })
    expect(result2.type).toBe('sell')
  })

  it('accepts date range filters', () => {
    const result = transactionListQuerySchema.parse({
      fromDate: '2026-01-01T00:00:00.000Z',
      toDate: '2026-12-31T23:59:59.999Z',
    })
    expect(result.fromDate).toBe('2026-01-01T00:00:00.000Z')
    expect(result.toDate).toBe('2026-12-31T23:59:59.999Z')
  })

  it('accepts all filters combined', () => {
    const result = transactionListQuerySchema.parse({
      assetId: 'clx1234',
      type: 'buy',
      fromDate: '2026-01-01T00:00:00.000Z',
      toDate: '2026-12-31T23:59:59.999Z',
    })
    expect(result.assetId).toBe('clx1234')
    expect(result.type).toBe('buy')
    expect(result.fromDate).toBe('2026-01-01T00:00:00.000Z')
    expect(result.toDate).toBe('2026-12-31T23:59:59.999Z')
  })

  it('rejects invalid type filter', () => {
    expect(() =>
      transactionListQuerySchema.parse({ type: 'invalid' })
    ).toThrow()
  })

  it('rejects invalid date format', () => {
    expect(() =>
      transactionListQuerySchema.parse({ fromDate: '2026-01-01' })
    ).toThrow()
  })

  it('rejects empty assetId', () => {
    expect(() =>
      transactionListQuerySchema.parse({ assetId: '' })
    ).toThrow()
  })
})

describe('transactionParamsSchema', () => {
  it('accepts valid transaction id', () => {
    const result = transactionParamsSchema.parse({ id: 'clx1234567890' })
    expect(result.id).toBe('clx1234567890')
  })

  it('rejects empty id', () => {
    expect(() => transactionParamsSchema.parse({ id: '' })).toThrow()
  })

  it('rejects missing id', () => {
    expect(() => transactionParamsSchema.parse({})).toThrow()
  })

  it('provides meaningful error message', () => {
    const result = transactionParamsSchema.safeParse({ id: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const errorMessages = result.error.issues.map(i => i.message)
      expect(errorMessages).toContain('Transaction ID is required')
    }
  })
})
