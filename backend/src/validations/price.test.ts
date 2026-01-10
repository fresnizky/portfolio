import { describe, it, expect } from 'vitest'
import {
  priceSchema,
  updatePriceSchema,
  batchUpdatePricesSchema,
  priceParamsSchema,
} from './price'

describe('priceSchema', () => {
  it('accepts positive integers', () => {
    expect(priceSchema.parse(1)).toBe(1)
    expect(priceSchema.parse(10)).toBe(10)
    expect(priceSchema.parse(42000)).toBe(42000)
  })

  it('accepts positive decimals', () => {
    expect(priceSchema.parse(450.75)).toBe(450.75)
    expect(priceSchema.parse(0.99)).toBe(0.99)
    expect(priceSchema.parse(100.5)).toBe(100.5)
  })

  it('rounds to 2 decimal places', () => {
    expect(priceSchema.parse(100.999)).toBe(101)
    expect(priceSchema.parse(100.994)).toBe(100.99)
    expect(priceSchema.parse(100.995)).toBe(101)
    expect(priceSchema.parse(0.001)).toBe(0)
    expect(priceSchema.parse(0.005)).toBe(0.01)
    expect(priceSchema.parse(10.123456)).toBe(10.12)
  })

  it('coerces string numbers', () => {
    expect(priceSchema.parse('10')).toBe(10)
    expect(priceSchema.parse('450.75')).toBe(450.75)
    expect(priceSchema.parse('0.99')).toBe(0.99)
  })

  it('rejects zero', () => {
    expect(() => priceSchema.parse(0)).toThrow()
    expect(() => priceSchema.parse('0')).toThrow()
  })

  it('rejects negative values', () => {
    expect(() => priceSchema.parse(-1)).toThrow()
    expect(() => priceSchema.parse(-0.5)).toThrow()
    expect(() => priceSchema.parse('-10')).toThrow()
  })

  it('rejects NaN values from invalid coercion', () => {
    expect(() => priceSchema.parse('abc')).toThrow()
    expect(() => priceSchema.parse('not-a-number')).toThrow()
    expect(() => priceSchema.parse('')).toThrow()
  })

  it('provides meaningful error message for NaN', () => {
    const result = priceSchema.safeParse('abc')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].code).toBe('invalid_type')
      expect(result.error.issues[0].message).toContain('NaN')
    }
  })

  it('provides meaningful error message for non-positive', () => {
    const result = priceSchema.safeParse(-5)
    expect(result.success).toBe(false)
    if (!result.success) {
      const errorMessages = result.error.issues.map(i => i.message)
      expect(errorMessages).toContain('Price must be greater than 0')
    }
  })
})

describe('updatePriceSchema', () => {
  it('validates valid price data', () => {
    const result = updatePriceSchema.parse({ price: 450.75 })
    expect(result).toEqual({ price: 450.75 })
  })

  it('accepts integer price', () => {
    const result = updatePriceSchema.parse({ price: 100 })
    expect(result.price).toBe(100)
  })

  it('coerces string price', () => {
    const result = updatePriceSchema.parse({ price: '25.50' })
    expect(result.price).toBe(25.5)
  })

  it('rounds price to 2 decimals', () => {
    const result = updatePriceSchema.parse({ price: 100.999 })
    expect(result.price).toBe(101)
  })

  it('rejects missing price', () => {
    expect(() => updatePriceSchema.parse({})).toThrow()
  })

  it('rejects zero price', () => {
    expect(() => updatePriceSchema.parse({ price: 0 })).toThrow()
  })

  it('rejects negative price', () => {
    expect(() => updatePriceSchema.parse({ price: -5 })).toThrow()
  })

  it('ignores extra fields', () => {
    const result = updatePriceSchema.parse({
      price: 100,
      extraField: 'should be ignored',
    })
    expect(result).toEqual({ price: 100 })
    expect((result as Record<string, unknown>).extraField).toBeUndefined()
  })
})

describe('batchUpdatePricesSchema', () => {
  it('validates valid batch data', () => {
    const result = batchUpdatePricesSchema.parse({
      prices: [
        { assetId: 'clx1234', price: 450.75 },
        { assetId: 'clx5678', price: 85.30 },
      ],
    })

    expect(result.prices).toHaveLength(2)
    expect(result.prices[0]).toEqual({ assetId: 'clx1234', price: 450.75 })
    expect(result.prices[1]).toEqual({ assetId: 'clx5678', price: 85.3 })
  })

  it('rounds all prices to 2 decimals', () => {
    const result = batchUpdatePricesSchema.parse({
      prices: [
        { assetId: 'clx1234', price: 100.999 },
        { assetId: 'clx5678', price: 50.001 },
      ],
    })

    expect(result.prices[0].price).toBe(101)
    expect(result.prices[1].price).toBe(50)
  })

  it('accepts single price update', () => {
    const result = batchUpdatePricesSchema.parse({
      prices: [{ assetId: 'clx1234', price: 100 }],
    })
    expect(result.prices).toHaveLength(1)
  })

  it('rejects empty prices array', () => {
    expect(() =>
      batchUpdatePricesSchema.parse({ prices: [] })
    ).toThrow()
  })

  it('rejects missing prices field', () => {
    expect(() => batchUpdatePricesSchema.parse({})).toThrow()
  })

  it('rejects price item with missing assetId', () => {
    expect(() =>
      batchUpdatePricesSchema.parse({
        prices: [{ price: 100 }],
      })
    ).toThrow()
  })

  it('rejects price item with empty assetId', () => {
    expect(() =>
      batchUpdatePricesSchema.parse({
        prices: [{ assetId: '', price: 100 }],
      })
    ).toThrow()
  })

  it('rejects price item with missing price', () => {
    expect(() =>
      batchUpdatePricesSchema.parse({
        prices: [{ assetId: 'clx1234' }],
      })
    ).toThrow()
  })

  it('rejects price item with invalid price', () => {
    expect(() =>
      batchUpdatePricesSchema.parse({
        prices: [{ assetId: 'clx1234', price: -10 }],
      })
    ).toThrow()
  })

  it('rejects if any price in batch is invalid', () => {
    expect(() =>
      batchUpdatePricesSchema.parse({
        prices: [
          { assetId: 'clx1234', price: 100 },
          { assetId: 'clx5678', price: -5 }, // Invalid
        ],
      })
    ).toThrow()
  })

  it('provides meaningful error for empty array', () => {
    const result = batchUpdatePricesSchema.safeParse({ prices: [] })
    expect(result.success).toBe(false)
    if (!result.success) {
      const errorMessages = result.error.issues.map(i => i.message)
      expect(errorMessages).toContain('At least one price update is required')
    }
  })
})

describe('priceParamsSchema', () => {
  it('accepts valid CUID', () => {
    const result = priceParamsSchema.parse({ assetId: 'clx1234567890abcdefghijkl' })
    expect(result.assetId).toBe('clx1234567890abcdefghijkl')
  })

  it('accepts any non-empty string', () => {
    const result = priceParamsSchema.parse({ assetId: 'any-valid-id' })
    expect(result.assetId).toBe('any-valid-id')
  })

  it('rejects empty assetId', () => {
    expect(() => priceParamsSchema.parse({ assetId: '' })).toThrow()
  })

  it('rejects missing assetId', () => {
    expect(() => priceParamsSchema.parse({})).toThrow()
  })

  it('provides meaningful error message for empty string', () => {
    const result = priceParamsSchema.safeParse({ assetId: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const errorMessages = result.error.issues.map(i => i.message)
      expect(errorMessages).toContain('Asset ID is required')
    }
  })
})
