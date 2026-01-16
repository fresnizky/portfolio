import { describe, it, expect } from 'vitest'
import {
  contributionSuggestSchema,
  type ContributionAllocation,
  type ContributionSuggestion,
} from './contribution'

describe('contributionSuggestSchema', () => {
  it('accepts valid positive integer amount', () => {
    const result = contributionSuggestSchema.parse({ amount: 1000 })
    expect(result.amount).toBe(1000)
  })

  it('accepts valid positive decimal amount', () => {
    const result = contributionSuggestSchema.parse({ amount: 123.45 })
    expect(result.amount).toBe(123.45)
  })

  it('accepts small positive amount', () => {
    const result = contributionSuggestSchema.parse({ amount: 1 })
    expect(result.amount).toBe(1)
  })

  it('accepts very small positive amount', () => {
    const result = contributionSuggestSchema.parse({ amount: 0.01 })
    expect(result.amount).toBe(0.01)
  })

  it('coerces string numbers', () => {
    const result = contributionSuggestSchema.parse({ amount: '1000' })
    expect(result.amount).toBe(1000)
  })

  it('rejects zero amount', () => {
    expect(() => contributionSuggestSchema.parse({ amount: 0 })).toThrow()
  })

  it('rejects negative amount', () => {
    expect(() => contributionSuggestSchema.parse({ amount: -100 })).toThrow()
  })

  it('rejects missing amount', () => {
    expect(() => contributionSuggestSchema.parse({})).toThrow()
  })

  it('rejects non-numeric amount', () => {
    expect(() => contributionSuggestSchema.parse({ amount: 'abc' })).toThrow()
  })

  it('rejects empty string amount', () => {
    expect(() => contributionSuggestSchema.parse({ amount: '' })).toThrow()
  })

  it('provides meaningful error message for non-positive amount', () => {
    const result = contributionSuggestSchema.safeParse({ amount: 0 })
    expect(result.success).toBe(false)
    if (!result.success) {
      const errorMessages = result.error.issues.map(i => i.message)
      expect(errorMessages.some(m => m.toLowerCase().includes('positive'))).toBe(true)
    }
  })

  it('provides meaningful error message for negative amount', () => {
    const result = contributionSuggestSchema.safeParse({ amount: -50 })
    expect(result.success).toBe(false)
    if (!result.success) {
      const errorMessages = result.error.issues.map(i => i.message)
      expect(errorMessages.some(m => m.toLowerCase().includes('positive'))).toBe(true)
    }
  })
})

describe('ContributionAllocation type', () => {
  it('allows valid allocation object', () => {
    const allocation: ContributionAllocation = {
      assetId: 'clx1234',
      ticker: 'VOO',
      name: 'Vanguard S&P 500',
      targetPercentage: '60.00',
      actualPercentage: '55.00',
      deviation: '-5.00',
      baseAllocation: '600.00',
      adjustedAllocation: '650.00',
      adjustmentReason: 'underweight',
    }
    expect(allocation.assetId).toBe('clx1234')
    expect(allocation.adjustmentReason).toBe('underweight')
  })

  it('allows null actual percentage for new assets', () => {
    const allocation: ContributionAllocation = {
      assetId: 'clx1234',
      ticker: 'VOO',
      name: 'Vanguard S&P 500',
      targetPercentage: '60.00',
      actualPercentage: null,
      deviation: null,
      baseAllocation: '600.00',
      adjustedAllocation: '600.00',
      adjustmentReason: null,
    }
    expect(allocation.actualPercentage).toBeNull()
    expect(allocation.deviation).toBeNull()
    expect(allocation.adjustmentReason).toBeNull()
  })

  it('allows overweight adjustment reason', () => {
    const allocation: ContributionAllocation = {
      assetId: 'clx1234',
      ticker: 'BTC',
      name: 'Bitcoin',
      targetPercentage: '20.00',
      actualPercentage: '25.00',
      deviation: '5.00',
      baseAllocation: '200.00',
      adjustedAllocation: '150.00',
      adjustmentReason: 'overweight',
    }
    expect(allocation.adjustmentReason).toBe('overweight')
  })
})

describe('ContributionSuggestion type', () => {
  it('allows valid suggestion object', () => {
    const suggestion: ContributionSuggestion = {
      amount: '1000.00',
      displayCurrency: 'USD',
      allocations: [
        {
          assetId: 'clx1',
          ticker: 'VOO',
          name: 'Vanguard S&P 500',
          targetPercentage: '60.00',
          actualPercentage: '55.00',
          deviation: '-5.00',
          baseAllocation: '600.00',
          adjustedAllocation: '650.00',
          adjustmentReason: 'underweight',
        },
        {
          assetId: 'clx2',
          ticker: 'GLD',
          name: 'SPDR Gold',
          targetPercentage: '20.00',
          actualPercentage: '20.00',
          deviation: '0.00',
          baseAllocation: '200.00',
          adjustedAllocation: '200.00',
          adjustmentReason: null,
        },
        {
          assetId: 'clx3',
          ticker: 'BTC',
          name: 'Bitcoin',
          targetPercentage: '20.00',
          actualPercentage: '25.00',
          deviation: '5.00',
          baseAllocation: '200.00',
          adjustedAllocation: '150.00',
          adjustmentReason: 'overweight',
        },
      ],
      summary: {
        totalAdjusted: '1000.00',
        underweightCount: 1,
        overweightCount: 1,
        balancedCount: 1,
      },
    }
    expect(suggestion.amount).toBe('1000.00')
    expect(suggestion.allocations).toHaveLength(3)
    expect(suggestion.summary.underweightCount).toBe(1)
    expect(suggestion.summary.overweightCount).toBe(1)
    expect(suggestion.summary.balancedCount).toBe(1)
  })

  it('allows empty allocations array', () => {
    const suggestion: ContributionSuggestion = {
      amount: '1000.00',
      displayCurrency: 'USD',
      allocations: [],
      summary: {
        totalAdjusted: '0.00',
        underweightCount: 0,
        overweightCount: 0,
        balancedCount: 0,
      },
    }
    expect(suggestion.allocations).toHaveLength(0)
  })
})
