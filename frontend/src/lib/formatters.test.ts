import { describe, it, expect } from 'vitest'
import { formatCurrency, formatPercentage, formatDate, formatGrowth, formatQuantity } from './formatters'

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

  it('should default to USD', () => {
    expect(formatCurrency(1500)).toBe('$1,500.00')
  })

  it('should format ARS with es-AR locale', () => {
    // es-AR locale uses $ symbol, period thousands separator, comma decimal
    // May have non-breaking spaces
    expect(formatCurrency(1500, 'ARS')).toMatch(/\$\s*1\.500,00/)
  })

  it('should format large ARS values correctly', () => {
    expect(formatCurrency(1000000, 'ARS')).toMatch(/\$\s*1\.000\.000,00/)
  })

  it('should handle string input with ARS currency', () => {
    expect(formatCurrency('1234.56', 'ARS')).toMatch(/\$\s*1\.234,56/)
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

  it('should format date with full style including time', () => {
    const result = formatDate('2026-01-15T14:30:00.000Z', 'full')
    expect(result).toMatch(/15 ene/i)
    expect(result).toMatch(/2026/)
    // Time component (may vary by timezone)
    expect(result).toMatch(/\d{2}:\d{2}/)
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

describe('formatQuantity', () => {
  it('should format integer quantities without decimals', () => {
    expect(formatQuantity('10')).toBe('10')
    expect(formatQuantity('100')).toBe('100')
    expect(formatQuantity('0')).toBe('0')
  })

  it('should preserve 2 decimal precision', () => {
    expect(formatQuantity('10.50')).toBe('10.50')
    expect(formatQuantity('0.25')).toBe('0.25')
  })

  it('should preserve 4 decimal precision', () => {
    expect(formatQuantity('0.0001')).toBe('0.0001')
    expect(formatQuantity('1.2345')).toBe('1.2345')
  })

  it('should preserve 8 decimal precision for BTC/crypto', () => {
    expect(formatQuantity('0.00000001')).toBe('0.00000001')
    expect(formatQuantity('0.00012345')).toBe('0.00012345')
    expect(formatQuantity('1.23456789')).toBe('1.23456789')
  })

  it('should handle trailing zeros correctly', () => {
    expect(formatQuantity('1.10')).toBe('1.10')
    expect(formatQuantity('0.50000000')).toBe('0.50000000')
  })

  it('should handle invalid input', () => {
    expect(formatQuantity('')).toBe('0')
    expect(formatQuantity('invalid')).toBe('0')
  })

  it('should limit precision to 8 decimals maximum', () => {
    // Input has more than 8 decimals
    expect(formatQuantity('0.123456789012')).toBe('0.12345679')
  })
})
