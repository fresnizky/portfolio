import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BatchPriceUpdateModal } from './BatchPriceUpdateModal'
import type { Position } from '@/types/api'

describe('BatchPriceUpdateModal', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-10T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const mockPositions: Position[] = [
    {
      assetId: 'asset-1',
      ticker: 'VOO',
      name: 'Vanguard S&P 500 ETF',
      category: 'ETF',
      quantity: '10.5',
      currentPrice: '450.75',
      value: '4732.88',
      targetPercentage: '60.00',
      priceUpdatedAt: '2025-12-31T12:00:00.000Z', // stale
    },
    {
      assetId: 'asset-2',
      ticker: 'BTC',
      name: 'Bitcoin',
      category: 'CRYPTO',
      quantity: '0.5',
      currentPrice: null,
      value: '0',
      targetPercentage: '20.00',
      priceUpdatedAt: null, // no price
    },
  ]

  it('should not render when not open', () => {
    const { container } = render(
      <BatchPriceUpdateModal
        isOpen={false}
        onClose={vi.fn()}
        positions={mockPositions}
        onSubmit={vi.fn()}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('should render modal with stale positions', () => {
    render(
      <BatchPriceUpdateModal
        isOpen={true}
        onClose={vi.fn()}
        positions={mockPositions}
        onSubmit={vi.fn()}
      />
    )
    expect(screen.getByText('Update Stale Prices')).toBeInTheDocument()
    expect(screen.getByText('VOO')).toBeInTheDocument()
    expect(screen.getByText('BTC')).toBeInTheDocument()
  })

  it('should only show stale positions', () => {
    const mixedPositions: Position[] = [
      ...mockPositions,
      {
        assetId: 'asset-3',
        ticker: 'FRESH',
        name: 'Fresh Asset',
        category: 'ETF',
        quantity: '5',
        currentPrice: '100.00',
        value: '500.00',
        targetPercentage: '10.00',
        priceUpdatedAt: '2026-01-09T12:00:00.000Z', // fresh
      },
    ]
    render(
      <BatchPriceUpdateModal
        isOpen={true}
        onClose={vi.fn()}
        positions={mixedPositions}
        onSubmit={vi.fn()}
      />
    )
    expect(screen.getByText('VOO')).toBeInTheDocument()
    expect(screen.getByText('BTC')).toBeInTheDocument()
    expect(screen.queryByText('FRESH')).not.toBeInTheDocument()
  })

  it('should call onSubmit with all prices', async () => {
    vi.useRealTimers() // Use real timers for this test
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    render(
      <BatchPriceUpdateModal
        isOpen={true}
        onClose={vi.fn()}
        positions={mockPositions}
        onSubmit={onSubmit}
      />
    )

    const inputs = screen.getAllByRole('spinbutton')
    await user.clear(inputs[0])
    await user.type(inputs[0], '455.00')
    await user.clear(inputs[1])
    await user.type(inputs[1], '46000.00')

    fireEvent.click(screen.getByText('Save All'))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith([
        { assetId: 'asset-1', price: 455 },
        { assetId: 'asset-2', price: 46000 },
      ])
    })
    vi.useFakeTimers() // Restore fake timers
    vi.setSystemTime(new Date('2026-01-10T12:00:00.000Z'))
  })

  it('should show validation error for empty prices', async () => {
    vi.useRealTimers() // Use real timers for this test
    const user = userEvent.setup()

    render(
      <BatchPriceUpdateModal
        isOpen={true}
        onClose={vi.fn()}
        positions={mockPositions}
        onSubmit={vi.fn()}
      />
    )

    const inputs = screen.getAllByRole('spinbutton')
    await user.clear(inputs[0])

    fireEvent.click(screen.getByText('Save All'))

    await waitFor(() => {
      expect(screen.getByText('All prices must be greater than 0')).toBeInTheDocument()
    })
    vi.useFakeTimers() // Restore fake timers
    vi.setSystemTime(new Date('2026-01-10T12:00:00.000Z'))
  })

  it('should disable submit when loading', () => {
    render(
      <BatchPriceUpdateModal
        isOpen={true}
        onClose={vi.fn()}
        positions={mockPositions}
        onSubmit={vi.fn()}
        isLoading={true}
      />
    )

    expect(screen.getByText('Saving...')).toBeDisabled()
  })
})
