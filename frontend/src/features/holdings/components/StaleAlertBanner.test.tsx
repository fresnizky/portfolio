import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StaleAlertBanner } from './StaleAlertBanner'
import type { Position } from '@/types/api'

describe('StaleAlertBanner', () => {
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

  it('should not render when no positions are stale', () => {
    const positions = [
      createPosition('2026-01-09T12:00:00.000Z'),
      createPosition('2026-01-08T12:00:00.000Z'),
    ]
    const { container } = render(<StaleAlertBanner positions={positions} />)
    expect(container.firstChild).toBeNull()
  })

  it('should render warning when any position has stale price', () => {
    const positions = [
      createPosition('2026-01-09T12:00:00.000Z'),
      createPosition('2025-12-31T12:00:00.000Z'), // stale
    ]
    render(<StaleAlertBanner positions={positions} />)
    expect(screen.getByText('Some prices need updating')).toBeInTheDocument()
  })

  it('should render warning when any position has null priceUpdatedAt', () => {
    const positions = [
      createPosition('2026-01-09T12:00:00.000Z'),
      createPosition(null),
    ]
    render(<StaleAlertBanner positions={positions} />)
    expect(screen.getByText('Some prices need updating')).toBeInTheDocument()
  })

  it('should not render when positions array is empty', () => {
    const { container } = render(<StaleAlertBanner positions={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('should call onUpdatePrices when button is clicked', () => {
    const onUpdatePrices = vi.fn()
    const positions = [createPosition(null)]
    render(<StaleAlertBanner positions={positions} onUpdatePrices={onUpdatePrices} />)

    fireEvent.click(screen.getByText('Update Now'))
    expect(onUpdatePrices).toHaveBeenCalledTimes(1)
  })

  it('should not show button when onUpdatePrices is not provided', () => {
    const positions = [createPosition(null)]
    render(<StaleAlertBanner positions={positions} />)

    expect(screen.queryByText('Update Now')).not.toBeInTheDocument()
  })
})
