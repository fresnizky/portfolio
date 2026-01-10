import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StalenessIndicator } from './StalenessIndicator'

describe('StalenessIndicator', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-10T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should show warning when priceUpdatedAt is null', () => {
    render(<StalenessIndicator priceUpdatedAt={null} />)
    expect(screen.getByText('No price set')).toBeInTheDocument()
  })

  it('should show green checkmark when price is fresh', () => {
    const twoDaysAgo = new Date('2026-01-08T12:00:00.000Z').toISOString()
    render(<StalenessIndicator priceUpdatedAt={twoDaysAgo} />)
    expect(screen.getByLabelText('Price is up to date')).toBeInTheDocument()
  })

  it('should show yellow warning when price is stale', () => {
    const tenDaysAgo = new Date('2025-12-31T12:00:00.000Z').toISOString()
    render(<StalenessIndicator priceUpdatedAt={tenDaysAgo} />)
    expect(screen.getByText(/10 days old/)).toBeInTheDocument()
  })

  it('should show days when showDays is true and price is fresh', () => {
    const twoDaysAgo = new Date('2026-01-08T12:00:00.000Z').toISOString()
    render(<StalenessIndicator priceUpdatedAt={twoDaysAgo} showDays />)
    expect(screen.getByText('2 days ago')).toBeInTheDocument()
  })

  it('should show "Today" when updated today', () => {
    const today = new Date('2026-01-10T10:00:00.000Z').toISOString()
    render(<StalenessIndicator priceUpdatedAt={today} showDays />)
    expect(screen.getByText('Today')).toBeInTheDocument()
  })

  it('should show "1 day ago" for singular', () => {
    const oneDayAgo = new Date('2026-01-09T12:00:00.000Z').toISOString()
    render(<StalenessIndicator priceUpdatedAt={oneDayAgo} showDays />)
    expect(screen.getByText('1 day ago')).toBeInTheDocument()
  })
})
