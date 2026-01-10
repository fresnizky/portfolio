import { describe, it, expect } from 'vitest'
import { snapshotQuerySchema, snapshotIdParamSchema } from './snapshot'

describe('snapshotQuerySchema', () => {
  it('accepts empty query (all optional)', () => {
    const result = snapshotQuerySchema.parse({})
    expect(result).toEqual({})
  })

  it('accepts from date filter', () => {
    const result = snapshotQuerySchema.parse({
      from: '2026-01-01T00:00:00.000Z',
    })
    expect(result.from).toBe('2026-01-01T00:00:00.000Z')
  })

  it('accepts to date filter', () => {
    const result = snapshotQuerySchema.parse({
      to: '2026-12-31T23:59:59.999Z',
    })
    expect(result.to).toBe('2026-12-31T23:59:59.999Z')
  })

  it('accepts both from and to date filters', () => {
    const result = snapshotQuerySchema.parse({
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-03-31T23:59:59.999Z',
    })
    expect(result.from).toBe('2026-01-01T00:00:00.000Z')
    expect(result.to).toBe('2026-03-31T23:59:59.999Z')
  })

  it('accepts date-only format (YYYY-MM-DD)', () => {
    const result = snapshotQuerySchema.parse({
      from: '2026-01-01',
      to: '2026-03-31',
    })
    expect(result.from).toBe('2026-01-01')
    expect(result.to).toBe('2026-03-31')
  })

  it('rejects invalid from date format', () => {
    expect(() =>
      snapshotQuerySchema.parse({ from: 'not-a-date' })
    ).toThrow()
  })

  it('rejects invalid to date format', () => {
    expect(() =>
      snapshotQuerySchema.parse({ to: 'invalid' })
    ).toThrow()
  })

  it('rejects partial date format', () => {
    expect(() =>
      snapshotQuerySchema.parse({ from: '2026-01' })
    ).toThrow()
  })
})

describe('snapshotIdParamSchema', () => {
  it('accepts valid snapshot id', () => {
    const result = snapshotIdParamSchema.parse({ id: 'clx1234567890abcdef' })
    expect(result.id).toBe('clx1234567890abcdef')
  })

  it('rejects empty id', () => {
    expect(() => snapshotIdParamSchema.parse({ id: '' })).toThrow()
  })

  it('rejects missing id', () => {
    expect(() => snapshotIdParamSchema.parse({})).toThrow()
  })

  it('provides meaningful error message for empty id', () => {
    const result = snapshotIdParamSchema.safeParse({ id: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const errorMessages = result.error.issues.map(i => i.message)
      expect(errorMessages).toContain('Snapshot ID is required')
    }
  })
})
