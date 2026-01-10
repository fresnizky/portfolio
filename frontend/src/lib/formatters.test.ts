import { describe, it, expect } from 'vitest'
import { formatCurrency, formatPercentage, formatDate, formatGrowth } from './formatters'

describe('formatCurrency', () => {
  it('should format number to currency string', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56')
  })

  it('should format string to currency string', () => {
    expect(formatCurrency('1234.56')).toBe('$1,234.56')
  })

  it('should handle zero', () => {
    expect(formatCurrency(0)).toBe('$0.00')
  })
})

describe('formatPercentage', () => {
  it('should format number to percentage string', () => {
    expect(formatPercentage(45.5)).toBe('45.50%')
  })

  it('should format string to percentage string', () => {
    expect(formatPercentage('45.5')).toBe('45.50%')
  })

  it('should respect decimals parameter', () => {
    expect(formatPercentage(45.567, 1)).toBe('45.6%')
  })
})

describe('formatDate', () => {
  it('should format date with short style', () => {
    const result = formatDate('2026-01-15T12:00:00.000Z', 'short')
    expect(result).toBe('15/01')
  })

  it('should format date with medium style (default)', () => {
    const result = formatDate('2026-01-15T12:00:00.000Z', 'medium')
    // Spanish locale abbreviates January as "ene" or "ene."
    expect(result).toMatch(/15 ene/i)
    expect(result).toMatch(/2026/)
  })

  it('should format date with long style', () => {
    const result = formatDate('2026-01-15T12:00:00.000Z', 'long')
    expect(result).toMatch(/15 enero 2026/i)
  })

  it('should use medium style by default', () => {
    const result = formatDate('2026-01-15T12:00:00.000Z')
    expect(result).toMatch(/15 ene/i)
    expect(result).toMatch(/2026/)
  })
})

describe('formatGrowth', () => {
  it('should calculate positive growth', () => {
    const result = formatGrowth(100, 150)
    expect(result.absolute).toBe(50)
    expect(result.percentage).toBe(50)
    expect(result.isPositive).toBe(true)
  })

  it('should calculate negative growth', () => {
    const result = formatGrowth(100, 80)
    expect(result.absolute).toBe(-20)
    expect(result.percentage).toBe(-20)
    expect(result.isPositive).toBe(false)
  })

  it('should handle zero starting value', () => {
    const result = formatGrowth(0, 100)
    expect(result.absolute).toBe(100)
    expect(result.percentage).toBe(0)
    expect(result.isPositive).toBe(true)
  })

  it('should handle no change', () => {
    const result = formatGrowth(100, 100)
    expect(result.absolute).toBe(0)
    expect(result.percentage).toBe(0)
    expect(result.isPositive).toBe(true)
  })
})
