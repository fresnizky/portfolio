import { describe, it, expect } from 'vitest'
import { countDecimalPlaces } from './money'

describe('countDecimalPlaces', () => {
  describe('integers', () => {
    it('returns 0 for integer 10', () => {
      expect(countDecimalPlaces(10)).toBe(0)
    })

    it('returns 0 for integer 0', () => {
      expect(countDecimalPlaces(0)).toBe(0)
    })

    it('returns 0 for negative integer', () => {
      expect(countDecimalPlaces(-5)).toBe(0)
    })
  })

  describe('decimal numbers', () => {
    it('returns 1 for 10.5', () => {
      expect(countDecimalPlaces(10.5)).toBe(1)
    })

    it('returns 2 for 10.25', () => {
      expect(countDecimalPlaces(10.25)).toBe(2)
    })

    it('returns 3 for 10.123', () => {
      expect(countDecimalPlaces(10.123)).toBe(3)
    })
  })

  describe('trailing zeros (JS behavior)', () => {
    // Note: JavaScript removes trailing zeros, so 10.00 becomes 10
    it('returns 0 for 10.00 (JS removes trailing zeros)', () => {
      expect(countDecimalPlaces(10.0)).toBe(0)
    })

    it('returns 1 for 10.10 (JS removes trailing zero)', () => {
      expect(countDecimalPlaces(10.1)).toBe(1)
    })
  })

  describe('scientific notation (small numbers)', () => {
    it('returns 8 for 0.00000001 (BTC satoshi)', () => {
      expect(countDecimalPlaces(0.00000001)).toBe(8)
    })

    it('returns 9 for 0.000000001', () => {
      expect(countDecimalPlaces(0.000000001)).toBe(9)
    })

    it('returns 7 for 0.0000001', () => {
      expect(countDecimalPlaces(0.0000001)).toBe(7)
    })

    it('returns 6 for 1e-6', () => {
      expect(countDecimalPlaces(1e-6)).toBe(6)
    })
  })

  describe('combined scientific notation', () => {
    it('returns 8 for 1.2e-8 (12 * 10^-9 = 0.000000012)', () => {
      // 1.2e-8 = 0.000000012 which has 9 significant decimal places
      expect(countDecimalPlaces(1.2e-8)).toBe(9)
    })

    it('returns 10 for 1.23e-8', () => {
      // 1.23e-8 = 0.0000000123 which has 10 decimal places
      expect(countDecimalPlaces(1.23e-8)).toBe(10)
    })
  })

  describe('edge cases', () => {
    it('handles very small positive numbers', () => {
      expect(countDecimalPlaces(0.1)).toBe(1)
      expect(countDecimalPlaces(0.01)).toBe(2)
      expect(countDecimalPlaces(0.001)).toBe(3)
    })

    it('handles negative decimals', () => {
      expect(countDecimalPlaces(-0.123)).toBe(3)
      expect(countDecimalPlaces(-0.00000001)).toBe(8)
    })
  })
})
