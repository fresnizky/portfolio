import { describe, it, expect } from 'vitest'
import { createAssetSchema, updateAssetSchema, assetCategorySchema, currencySchema, listAssetsQuerySchema, assetIdParamSchema, targetPercentageSchema, batchUpdateTargetsSchema } from './asset'

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

describe('currencySchema', () => {
  it('accepts valid currency USD', () => {
    expect(currencySchema.parse('USD')).toBe('USD')
  })

  it('accepts valid currency ARS', () => {
    expect(currencySchema.parse('ARS')).toBe('ARS')
  })

  it('rejects invalid currency', () => {
    expect(() => currencySchema.parse('EUR')).toThrow()
    expect(() => currencySchema.parse('BTC')).toThrow()
    expect(() => currencySchema.parse('')).toThrow()
  })

  it('rejects lowercase currency (case sensitive)', () => {
    expect(() => currencySchema.parse('usd')).toThrow()
    expect(() => currencySchema.parse('ars')).toThrow()
  })
})

describe('createAssetSchema', () => {
  it('validates valid asset data with default currency', () => {
    const result = createAssetSchema.parse({
      ticker: 'voo',
      name: 'Vanguard S&P 500 ETF',
      category: 'ETF',
    })

    expect(result).toEqual({
      ticker: 'VOO', // transformed to uppercase
      name: 'Vanguard S&P 500 ETF',
      category: 'ETF',
      currency: 'USD', // default
    })
  })

  it('accepts explicit currency USD', () => {
    const result = createAssetSchema.parse({
      ticker: 'VOO',
      name: 'Vanguard S&P 500 ETF',
      category: 'ETF',
      currency: 'USD',
    })

    expect(result.currency).toBe('USD')
  })

  it('accepts explicit currency ARS', () => {
    const result = createAssetSchema.parse({
      ticker: 'CEDEAR',
      name: 'CEDEAR Example',
      category: 'ETF',
      currency: 'ARS',
    })

    expect(result.currency).toBe('ARS')
  })

  it('rejects invalid currency', () => {
    expect(() =>
      createAssetSchema.parse({
        ticker: 'VOO',
        name: 'Vanguard S&P 500 ETF',
        category: 'ETF',
        currency: 'EUR',
      })
    ).toThrow()
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

  it('allows updating currency to USD', () => {
    const result = updateAssetSchema.parse({ currency: 'USD' })
    expect(result.currency).toBe('USD')
  })

  it('allows updating currency to ARS', () => {
    const result = updateAssetSchema.parse({ currency: 'ARS' })
    expect(result.currency).toBe('ARS')
  })

  it('rejects invalid currency in update', () => {
    expect(() =>
      updateAssetSchema.parse({ currency: 'EUR' })
    ).toThrow()
  })

  it('allows update without currency', () => {
    const result = updateAssetSchema.parse({ name: 'New Name' })
    expect(result.currency).toBeUndefined()
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

describe('targetPercentageSchema', () => {
  it('accepts 0%', () => {
    expect(targetPercentageSchema.parse(0)).toBe(0)
  })

  it('accepts 50%', () => {
    expect(targetPercentageSchema.parse(50)).toBe(50)
  })

  it('accepts 100%', () => {
    expect(targetPercentageSchema.parse(100)).toBe(100)
  })

  it('accepts decimal values like 33.33', () => {
    expect(targetPercentageSchema.parse(33.33)).toBe(33.33)
  })

  it('rounds to 2 decimal places', () => {
    expect(targetPercentageSchema.parse(33.333)).toBe(33.33)
    expect(targetPercentageSchema.parse(33.335)).toBe(33.34)
  })

  it('coerces string numbers', () => {
    expect(targetPercentageSchema.parse('50')).toBe(50)
    expect(targetPercentageSchema.parse('33.33')).toBe(33.33)
  })

  it('rejects negative values', () => {
    expect(() => targetPercentageSchema.parse(-1)).toThrow()
    expect(() => targetPercentageSchema.parse(-0.01)).toThrow()
  })

  it('rejects negative string values after coercion', () => {
    expect(() => targetPercentageSchema.parse('-1')).toThrow()
    expect(() => targetPercentageSchema.parse('-0.5')).toThrow()
    expect(() => targetPercentageSchema.parse('-100')).toThrow()
  })

  it('rejects values over 100', () => {
    expect(() => targetPercentageSchema.parse(101)).toThrow()
    expect(() => targetPercentageSchema.parse(100.01)).toThrow()
  })

  it('rejects string values over 100 after coercion', () => {
    expect(() => targetPercentageSchema.parse('101')).toThrow()
    expect(() => targetPercentageSchema.parse('100.01')).toThrow()
    expect(() => targetPercentageSchema.parse('150')).toThrow()
  })
})

describe('updateAssetSchema with targetPercentage', () => {
  it('allows targetPercentage as optional field', () => {
    const result = updateAssetSchema.parse({ targetPercentage: 50 })
    expect(result.targetPercentage).toBe(50)
  })

  it('rounds targetPercentage to 2 decimals', () => {
    const result = updateAssetSchema.parse({ targetPercentage: 33.333 })
    expect(result.targetPercentage).toBe(33.33)
  })

  it('allows update without targetPercentage', () => {
    const result = updateAssetSchema.parse({ name: 'New Name' })
    expect(result).toEqual({ name: 'New Name' })
    expect(result.targetPercentage).toBeUndefined()
  })

  it('rejects invalid targetPercentage in update', () => {
    expect(() => updateAssetSchema.parse({ targetPercentage: 101 })).toThrow()
    expect(() => updateAssetSchema.parse({ targetPercentage: -5 })).toThrow()
  })
})

describe('batchUpdateTargetsSchema', () => {
  it('accepts valid targets array', () => {
    const result = batchUpdateTargetsSchema.parse({
      targets: [
        { assetId: 'clx1234567890abcdefghijkl', targetPercentage: 60 },
        { assetId: 'clx0987654321zyxwvutsrqpo', targetPercentage: 40 },
      ],
    })

    expect(result.targets).toHaveLength(2)
    expect(result.targets[0].assetId).toBe('clx1234567890abcdefghijkl')
    expect(result.targets[0].targetPercentage).toBe(60)
    expect(result.targets[1].targetPercentage).toBe(40)
  })

  it('accepts single item array', () => {
    const result = batchUpdateTargetsSchema.parse({
      targets: [{ assetId: 'clx1234567890abcdefghijkl', targetPercentage: 100 }],
    })

    expect(result.targets).toHaveLength(1)
  })

  it('rounds targetPercentage to 2 decimals', () => {
    const result = batchUpdateTargetsSchema.parse({
      targets: [{ assetId: 'clx1234567890abcdefghijkl', targetPercentage: 33.333 }],
    })

    expect(result.targets[0].targetPercentage).toBe(33.33)
  })

  it('rejects empty targets array', () => {
    expect(() =>
      batchUpdateTargetsSchema.parse({ targets: [] })
    ).toThrow()
  })

  it('rejects missing targets field', () => {
    expect(() =>
      batchUpdateTargetsSchema.parse({})
    ).toThrow()
  })

  it('rejects invalid assetId format', () => {
    expect(() =>
      batchUpdateTargetsSchema.parse({
        targets: [{ assetId: 'invalid-id', targetPercentage: 50 }],
      })
    ).toThrow()
  })

  it('rejects invalid targetPercentage', () => {
    expect(() =>
      batchUpdateTargetsSchema.parse({
        targets: [{ assetId: 'clx1234567890abcdefghijkl', targetPercentage: 101 }],
      })
    ).toThrow()
  })

  it('rejects negative targetPercentage', () => {
    expect(() =>
      batchUpdateTargetsSchema.parse({
        targets: [{ assetId: 'clx1234567890abcdefghijkl', targetPercentage: -5 }],
      })
    ).toThrow()
  })

  it('rejects missing assetId in target', () => {
    expect(() =>
      batchUpdateTargetsSchema.parse({
        targets: [{ targetPercentage: 50 }],
      })
    ).toThrow()
  })

  it('rejects missing targetPercentage in target', () => {
    expect(() =>
      batchUpdateTargetsSchema.parse({
        targets: [{ assetId: 'clx1234567890abcdefghijkl' }],
      })
    ).toThrow()
  })
})
