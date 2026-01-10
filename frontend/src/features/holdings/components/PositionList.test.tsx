import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PositionList } from './PositionList'
import type { Position } from '@/types/api'

describe('PositionList', () => {
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
      priceUpdatedAt: '2026-01-08T12:00:00.000Z',
    },
    {
      assetId: 'asset-2',
      ticker: 'BTC',
      name: 'Bitcoin',
      category: 'CRYPTO',
      quantity: '0.5',
      currentPrice: '45000.00',
      value: '22500.00',
      targetPercentage: '20.00',
      priceUpdatedAt: '2026-01-09T12:00:00.000Z',
    },
  ]

  it('should render all positions', () => {
    render(<PositionList positions={mockPositions} onUpdatePrice={vi.fn()} />)
    expect(screen.getByText('VOO')).toBeInTheDocument()
    expect(screen.getByText('BTC')).toBeInTheDocument()
  })

  it('should render empty state when no positions', () => {
    render(<PositionList positions={[]} onUpdatePrice={vi.fn()} />)
    expect(screen.getByText('No holdings yet')).toBeInTheDocument()
  })

  it('should call onUpdatePrice with correct position', () => {
    const onUpdatePrice = vi.fn()
    render(<PositionList positions={mockPositions} onUpdatePrice={onUpdatePrice} />)

    fireEvent.click(screen.getByLabelText('Update price for VOO'))
    expect(onUpdatePrice).toHaveBeenCalledWith(mockPositions[0])
  })

  it('should render positions in a grid', () => {
    const { container } = render(<PositionList positions={mockPositions} onUpdatePrice={vi.fn()} />)
    const grid = container.querySelector('.grid')
    expect(grid).toBeInTheDocument()
  })
})
