import { describe, expect, it } from 'vitest'
import { dashboardQuerySchema } from './dashboard'

describe('dashboardQuerySchema', () => {
  it('should accept empty object (all params optional)', () => {
    const result = dashboardQuerySchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('should accept valid deviationThreshold', () => {
    const result = dashboardQuerySchema.safeParse({ deviationThreshold: '5' })
    expect(result.success).toBe(true)
    expect(result.data?.deviationThreshold).toBe(5)
  })

  it('should accept valid staleDays', () => {
    const result = dashboardQuerySchema.safeParse({ staleDays: '7' })
    expect(result.success).toBe(true)
    expect(result.data?.staleDays).toBe(7)
  })

  it('should accept both params together', () => {
    const result = dashboardQuerySchema.safeParse({
      deviationThreshold: '10',
      staleDays: '14',
    })
    expect(result.success).toBe(true)
    expect(result.data?.deviationThreshold).toBe(10)
    expect(result.data?.staleDays).toBe(14)
  })

  it('should reject deviationThreshold > 100', () => {
    const result = dashboardQuerySchema.safeParse({ deviationThreshold: '150' })
    expect(result.success).toBe(false)
  })

  it('should reject deviationThreshold < 0', () => {
    const result = dashboardQuerySchema.safeParse({ deviationThreshold: '-5' })
    expect(result.success).toBe(false)
  })

  it('should reject staleDays < 1', () => {
    const result = dashboardQuerySchema.safeParse({ staleDays: '0' })
    expect(result.success).toBe(false)
  })

  it('should coerce string numbers to numbers', () => {
    const result = dashboardQuerySchema.safeParse({
      deviationThreshold: '5.5',
      staleDays: '7',
    })
    expect(result.success).toBe(true)
    expect(result.data?.deviationThreshold).toBe(5.5)
    expect(result.data?.staleDays).toBe(7)
  })
})
