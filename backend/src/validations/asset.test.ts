import { describe, it, expect } from 'vitest'
import { createAssetSchema, updateAssetSchema, assetCategorySchema } from './asset'

describe('assetCategorySchema', () => {
  it('accepts valid categories', () => {
    expect(assetCategorySchema.parse('ETF')).toBe('ETF')
    expect(assetCategorySchema.parse('FCI')).toBe('FCI')
    expect(assetCategorySchema.parse('CRYPTO')).toBe('CRYPTO')
    expect(assetCategorySchema.parse('CASH')).toBe('CASH')
  })

  it('rejects invalid categories', () => {
    expect(() => assetCategorySchema.parse('STOCK')).toThrow()
    expect(() => assetCategorySchema.parse('')).toThrow()
    expect(() => assetCategorySchema.parse('etf')).toThrow() // case sensitive
  })
})

describe('createAssetSchema', () => {
  it('validates valid asset data', () => {
    const result = createAssetSchema.parse({
      ticker: 'voo',
      name: 'Vanguard S&P 500 ETF',
      category: 'ETF',
    })

    expect(result).toEqual({
      ticker: 'VOO', // transformed to uppercase
      name: 'Vanguard S&P 500 ETF',
      category: 'ETF',
    })
  })

  it('transforms ticker to uppercase', () => {
    const result = createAssetSchema.parse({
      ticker: 'spy',
      name: 'SPDR S&P 500 ETF',
      category: 'ETF',
    })

    expect(result.ticker).toBe('SPY')
  })

  it('rejects missing ticker', () => {
    expect(() =>
      createAssetSchema.parse({
        name: 'Test Asset',
        category: 'ETF',
      })
    ).toThrow()
  })

  it('rejects empty ticker', () => {
    expect(() =>
      createAssetSchema.parse({
        ticker: '',
        name: 'Test Asset',
        category: 'ETF',
      })
    ).toThrow()
  })

  it('rejects ticker longer than 20 characters', () => {
    expect(() =>
      createAssetSchema.parse({
        ticker: 'A'.repeat(21),
        name: 'Test Asset',
        category: 'ETF',
      })
    ).toThrow()
  })

  it('rejects missing name', () => {
    expect(() =>
      createAssetSchema.parse({
        ticker: 'VOO',
        category: 'ETF',
      })
    ).toThrow()
  })

  it('rejects empty name', () => {
    expect(() =>
      createAssetSchema.parse({
        ticker: 'VOO',
        name: '',
        category: 'ETF',
      })
    ).toThrow()
  })

  it('rejects name longer than 100 characters', () => {
    expect(() =>
      createAssetSchema.parse({
        ticker: 'VOO',
        name: 'A'.repeat(101),
        category: 'ETF',
      })
    ).toThrow()
  })

  it('rejects missing category', () => {
    expect(() =>
      createAssetSchema.parse({
        ticker: 'VOO',
        name: 'Vanguard S&P 500 ETF',
      })
    ).toThrow()
  })

  it('rejects invalid category', () => {
    expect(() =>
      createAssetSchema.parse({
        ticker: 'VOO',
        name: 'Vanguard S&P 500 ETF',
        category: 'STOCK',
      })
    ).toThrow()
  })
})

describe('updateAssetSchema', () => {
  it('allows partial updates', () => {
    const result = updateAssetSchema.parse({
      name: 'Updated Name',
    })

    expect(result).toEqual({ name: 'Updated Name' })
  })

  it('allows empty object', () => {
    const result = updateAssetSchema.parse({})
    expect(result).toEqual({})
  })

  it('validates ticker when provided', () => {
    const result = updateAssetSchema.parse({ ticker: 'spy' })
    expect(result.ticker).toBe('SPY')
  })

  it('rejects invalid ticker when provided', () => {
    expect(() =>
      updateAssetSchema.parse({ ticker: 'A'.repeat(21) })
    ).toThrow()
  })

  it('validates category when provided', () => {
    expect(() =>
      updateAssetSchema.parse({ category: 'INVALID' })
    ).toThrow()
  })
})
