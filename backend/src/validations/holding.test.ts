import { describe, it, expect } from 'vitest'
import { createOrUpdateHoldingSchema, holdingParamsSchema, quantitySchema } from './holding'

describe('quantitySchema', () => {
  it('accepts positive integers', () => {
    expect(quantitySchema.parse(1)).toBe(1)
    expect(quantitySchema.parse(10)).toBe(10)
    expect(quantitySchema.parse(1000)).toBe(1000)
  })

  it('accepts positive decimals', () => {
    expect(quantitySchema.parse(0.5)).toBe(0.5)
    expect(quantitySchema.parse(10.5)).toBe(10.5)
    expect(quantitySchema.parse(0.00000001)).toBe(0.00000001)
  })

  it('coerces string numbers', () => {
    expect(quantitySchema.parse('10')).toBe(10)
    expect(quantitySchema.parse('10.5')).toBe(10.5)
    expect(quantitySchema.parse('0.5')).toBe(0.5)
  })

  it('rejects zero', () => {
    expect(() => quantitySchema.parse(0)).toThrow()
    expect(() => quantitySchema.parse('0')).toThrow()
  })

  it('rejects negative values', () => {
    expect(() => quantitySchema.parse(-1)).toThrow()
    expect(() => quantitySchema.parse(-0.5)).toThrow()
    expect(() => quantitySchema.parse('-10')).toThrow()
  })

  it('provides meaningful error message', () => {
    const result = quantitySchema.safeParse(-5)
    expect(result.success).toBe(false)
    if (!result.success) {
      const errorMessages = result.error.issues.map(i => i.message)
      expect(errorMessages).toContain('Quantity must be greater than 0')
    }
  })
})

describe('createOrUpdateHoldingSchema', () => {
  it('validates valid holding data', () => {
    const result = createOrUpdateHoldingSchema.parse({
      quantity: 10.5,
    })

    expect(result).toEqual({
      quantity: 10.5,
    })
  })

  it('accepts integer quantity', () => {
    const result = createOrUpdateHoldingSchema.parse({ quantity: 100 })
    expect(result.quantity).toBe(100)
  })

  it('accepts fractional quantity for crypto', () => {
    const result = createOrUpdateHoldingSchema.parse({ quantity: 0.00012345 })
    expect(result.quantity).toBe(0.00012345)
  })

  it('coerces string quantity', () => {
    const result = createOrUpdateHoldingSchema.parse({ quantity: '25.5' })
    expect(result.quantity).toBe(25.5)
  })

  it('rejects missing quantity', () => {
    expect(() =>
      createOrUpdateHoldingSchema.parse({})
    ).toThrow()
  })

  it('rejects zero quantity', () => {
    expect(() =>
      createOrUpdateHoldingSchema.parse({ quantity: 0 })
    ).toThrow()
  })

  it('rejects negative quantity', () => {
    expect(() =>
      createOrUpdateHoldingSchema.parse({ quantity: -5 })
    ).toThrow()
  })

  it('ignores extra fields', () => {
    const result = createOrUpdateHoldingSchema.parse({
      quantity: 10,
      extraField: 'should be ignored',
    })
    expect(result).toEqual({ quantity: 10 })
    expect((result as Record<string, unknown>).extraField).toBeUndefined()
  })
})

describe('holdingParamsSchema', () => {
  it('accepts valid CUID', () => {
    const result = holdingParamsSchema.parse({ assetId: 'clx1234567890abcdefghijkl' })
    expect(result.assetId).toBe('clx1234567890abcdefghijkl')
  })

  it('rejects invalid ID format', () => {
    expect(() => holdingParamsSchema.parse({ assetId: 'invalid-id' })).toThrow()
  })

  it('rejects empty assetId', () => {
    expect(() => holdingParamsSchema.parse({ assetId: '' })).toThrow()
  })

  it('rejects missing assetId', () => {
    expect(() => holdingParamsSchema.parse({})).toThrow()
  })

  it('provides meaningful error message for invalid format', () => {
    const result = holdingParamsSchema.safeParse({ assetId: 'bad-id' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const errorMessages = result.error.issues.map(i => i.message)
      expect(errorMessages).toContain('Invalid asset ID format')
    }
  })
})
