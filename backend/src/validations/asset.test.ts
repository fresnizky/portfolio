import { describe, it, expect } from 'vitest'
import { createAssetSchema, updateAssetSchema, assetCategorySchema, listAssetsQuerySchema, assetIdParamSchema } from './asset'

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

  it('trims whitespace from ticker and name', () => {
    const result = createAssetSchema.parse({
      ticker: '  voo  ',
      name: '  Vanguard S&P 500 ETF  ',
      category: 'ETF',
    })

    expect(result.ticker).toBe('VOO')
    expect(result.name).toBe('Vanguard S&P 500 ETF')
  })

  it('rejects whitespace-only ticker', () => {
    expect(() =>
      createAssetSchema.parse({
        ticker: '   ',
        name: 'Test Asset',
        category: 'ETF',
      })
    ).toThrow()
  })

  it('rejects whitespace-only name', () => {
    expect(() =>
      createAssetSchema.parse({
        ticker: 'VOO',
        name: '   ',
        category: 'ETF',
      })
    ).toThrow()
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

describe('listAssetsQuerySchema', () => {
  it('accepts valid limit and offset', () => {
    const result = listAssetsQuerySchema.parse({ limit: '10', offset: '5' })
    expect(result).toEqual({ limit: 10, offset: 5 })
  })

  it('allows empty query', () => {
    const result = listAssetsQuerySchema.parse({})
    expect(result).toEqual({})
  })

  it('coerces string numbers', () => {
    const result = listAssetsQuerySchema.parse({ limit: '50' })
    expect(result.limit).toBe(50)
  })

  it('rejects limit less than 1', () => {
    expect(() => listAssetsQuerySchema.parse({ limit: '0' })).toThrow()
  })

  it('rejects limit greater than 100', () => {
    expect(() => listAssetsQuerySchema.parse({ limit: '101' })).toThrow()
  })

  it('rejects negative offset', () => {
    expect(() => listAssetsQuerySchema.parse({ offset: '-1' })).toThrow()
  })
})

describe('assetIdParamSchema', () => {
  it('accepts valid CUID', () => {
    const result = assetIdParamSchema.parse({ id: 'clx1234567890abcdefghijkl' })
    expect(result.id).toBe('clx1234567890abcdefghijkl')
  })

  it('rejects invalid ID format', () => {
    expect(() => assetIdParamSchema.parse({ id: 'invalid-id' })).toThrow()
  })

  it('rejects empty ID', () => {
    expect(() => assetIdParamSchema.parse({ id: '' })).toThrow()
  })
})
