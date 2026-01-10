import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PositionsList } from './PositionsList'
import type { DashboardPosition } from '@/types/api'

describe('PositionsList', () => {
  const createPosition = (overrides: Partial<DashboardPosition> = {}): DashboardPosition => ({
    assetId: 'asset-1',
    ticker: 'VOO',
    name: 'Vanguard S&P 500 ETF',
    category: 'ETF',
    quantity: '10',
    currentPrice: '450.00',
    value: '4500.00',
    targetPercentage: '50.00',
    actualPercentage: '45.00',
    deviation: '-5.00',
    priceUpdatedAt: '2026-01-10T12:00:00.000Z',
    ...overrides,
  })

  it('should display all positions', () => {
    const positions = [
      createPosition({ ticker: 'VOO', name: 'Vanguard S&P 500' }),
      createPosition({ assetId: 'asset-2', ticker: 'BTC', name: 'Bitcoin' }),
    ]
    render(<PositionsList positions={positions} />)

    expect(screen.getByText('VOO')).toBeInTheDocument()
    expect(screen.getByText('BTC')).toBeInTheDocument()
  })

  it('should show green for balanced positions (deviation <= 1)', () => {
    const positions = [createPosition({ deviation: '0.50' })]
    render(<PositionsList positions={positions} />)

    const badge = screen.getByText('Balanced')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-green-100')
  })

  it('should show orange for overweight positions (deviation > 1)', () => {
    const positions = [createPosition({ deviation: '5.00' })]
    render(<PositionsList positions={positions} />)

    const badge = screen.getByText('Overweight')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-orange-100')
  })

  it('should show blue for underweight positions (deviation < -1)', () => {
    const positions = [createPosition({ deviation: '-5.00' })]
    render(<PositionsList positions={positions} />)

    const badge = screen.getByText('Underweight')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-blue-100')
  })

  it('should show actual and target percentages side by side', () => {
    const positions = [createPosition({ actualPercentage: '45.00', targetPercentage: '50.00' })]
    render(<PositionsList positions={positions} />)

    expect(screen.getByText('45.00%')).toBeInTheDocument()
    expect(screen.getByText('50.00%')).toBeInTheDocument()
  })

  it('should show empty state when no positions', () => {
    render(<PositionsList positions={[]} />)
    expect(screen.getByText('No positions to display')).toBeInTheDocument()
  })

  it('should handle position without target percentage', () => {
    const positions = [createPosition({ targetPercentage: null })]
    render(<PositionsList positions={positions} />)

    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
