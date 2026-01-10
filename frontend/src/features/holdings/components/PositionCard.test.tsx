import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PositionCard } from './PositionCard'
import type { Position } from '@/types/api'

describe('PositionCard', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-10T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const mockPosition: Position = {
    assetId: 'asset-1',
    ticker: 'VOO',
    name: 'Vanguard S&P 500 ETF',
    category: 'ETF',
    quantity: '10.5',
    currentPrice: '450.75',
    value: '4732.88',
    targetPercentage: '60.00',
    priceUpdatedAt: '2026-01-08T12:00:00.000Z',
  }

  it('should render ticker and name', () => {
    render(<PositionCard position={mockPosition} onUpdatePrice={vi.fn()} />)
    expect(screen.getByText('VOO')).toBeInTheDocument()
    expect(screen.getByText('Vanguard S&P 500 ETF')).toBeInTheDocument()
  })

  it('should render category badge', () => {
    render(<PositionCard position={mockPosition} onUpdatePrice={vi.fn()} />)
    expect(screen.getByText('ETF')).toBeInTheDocument()
  })

  it('should render quantity', () => {
    render(<PositionCard position={mockPosition} onUpdatePrice={vi.fn()} />)
    expect(screen.getByText('10.5')).toBeInTheDocument()
  })

  it('should render price formatted as currency', () => {
    render(<PositionCard position={mockPosition} onUpdatePrice={vi.fn()} />)
    expect(screen.getByText('$450.75')).toBeInTheDocument()
  })

  it('should render value formatted as currency', () => {
    render(<PositionCard position={mockPosition} onUpdatePrice={vi.fn()} />)
    expect(screen.getByText('$4,732.88')).toBeInTheDocument()
  })

  it('should render staleness indicator', () => {
    render(<PositionCard position={mockPosition} onUpdatePrice={vi.fn()} />)
    expect(screen.getByLabelText('Price is up to date')).toBeInTheDocument()
  })

  it('should show "No price set" when currentPrice is null', () => {
    const positionNoPrice = { ...mockPosition, currentPrice: null }
    render(<PositionCard position={positionNoPrice} onUpdatePrice={vi.fn()} />)
    expect(screen.getByText('No price set')).toBeInTheDocument()
  })

  it('should call onUpdatePrice when edit button is clicked', () => {
    const onUpdatePrice = vi.fn()
    render(<PositionCard position={mockPosition} onUpdatePrice={onUpdatePrice} />)

    fireEvent.click(screen.getByLabelText('Update price for VOO'))
    expect(onUpdatePrice).toHaveBeenCalledWith(mockPosition)
  })

  it('should render different category styles', () => {
    const cryptoPosition = { ...mockPosition, category: 'CRYPTO' as const, ticker: 'BTC' }
    render(<PositionCard position={cryptoPosition} onUpdatePrice={vi.fn()} />)
    expect(screen.getByText('CRYPTO')).toBeInTheDocument()
  })
})
