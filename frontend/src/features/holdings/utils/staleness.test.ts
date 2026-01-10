import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isPriceStale, getDaysSinceUpdate, hasAnyStalePrice } from './staleness'
import type { Position } from '@/types/api'

describe('isPriceStale', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-10T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return true when priceUpdatedAt is null', () => {
    expect(isPriceStale(null)).toBe(true)
  })

  it('should return true when price is older than 7 days', () => {
    const eightDaysAgo = new Date('2026-01-02T12:00:00.000Z').toISOString()
    expect(isPriceStale(eightDaysAgo)).toBe(true)
  })

  it('should return false when price is exactly 7 days old', () => {
    const sevenDaysAgo = new Date('2026-01-03T12:00:00.000Z').toISOString()
    expect(isPriceStale(sevenDaysAgo)).toBe(false)
  })

  it('should return false when price is less than 7 days old', () => {
    const threeDaysAgo = new Date('2026-01-07T12:00:00.000Z').toISOString()
    expect(isPriceStale(threeDaysAgo)).toBe(false)
  })

  it('should return false when price was updated today', () => {
    const today = new Date('2026-01-10T10:00:00.000Z').toISOString()
    expect(isPriceStale(today)).toBe(false)
  })

  it('should use custom threshold when provided', () => {
    const threeDaysAgo = new Date('2026-01-07T12:00:00.000Z').toISOString()
    expect(isPriceStale(threeDaysAgo, 2)).toBe(true)
    expect(isPriceStale(threeDaysAgo, 5)).toBe(false)
  })
})

describe('getDaysSinceUpdate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-10T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return null when priceUpdatedAt is null', () => {
    expect(getDaysSinceUpdate(null)).toBeNull()
  })

  it('should return 0 for today', () => {
    const today = new Date('2026-01-10T10:00:00.000Z').toISOString()
    expect(getDaysSinceUpdate(today)).toBe(0)
  })

  it('should return correct number of days', () => {
    const threeDaysAgo = new Date('2026-01-07T12:00:00.000Z').toISOString()
    expect(getDaysSinceUpdate(threeDaysAgo)).toBe(3)
  })

  it('should return correct days for older dates', () => {
    const tenDaysAgo = new Date('2025-12-31T12:00:00.000Z').toISOString()
    expect(getDaysSinceUpdate(tenDaysAgo)).toBe(10)
  })

  it('should floor partial days', () => {
    const almostTwoDays = new Date('2026-01-08T18:00:00.000Z').toISOString()
    expect(getDaysSinceUpdate(almostTwoDays)).toBe(1)
  })
})

describe('hasAnyStalePrice', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-10T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const createPosition = (priceUpdatedAt: string | null): Position => ({
    assetId: 'asset-1',
    ticker: 'VOO',
    name: 'Vanguard S&P 500 ETF',
    category: 'ETF',
    quantity: '10',
    currentPrice: '450.00',
    value: '4500.00',
    targetPercentage: '60.00',
    priceUpdatedAt,
  })

  it('should return false for empty array', () => {
    expect(hasAnyStalePrice([])).toBe(false)
  })

  it('should return true if any position has null priceUpdatedAt', () => {
    const positions = [
      createPosition('2026-01-09T12:00:00.000Z'),
      createPosition(null),
    ]
    expect(hasAnyStalePrice(positions)).toBe(true)
  })

  it('should return true if any position has stale price', () => {
    const positions = [
      createPosition('2026-01-09T12:00:00.000Z'),
      createPosition('2026-01-01T12:00:00.000Z'), // 9 days old
    ]
    expect(hasAnyStalePrice(positions)).toBe(true)
  })

  it('should return false if all prices are fresh', () => {
    const positions = [
      createPosition('2026-01-09T12:00:00.000Z'),
      createPosition('2026-01-08T12:00:00.000Z'),
      createPosition('2026-01-05T12:00:00.000Z'),
    ]
    expect(hasAnyStalePrice(positions)).toBe(false)
  })

  it('should return false if all prices are exactly 7 days old', () => {
    const positions = [
      createPosition('2026-01-03T12:00:00.000Z'),
    ]
    expect(hasAnyStalePrice(positions)).toBe(false)
  })
})
