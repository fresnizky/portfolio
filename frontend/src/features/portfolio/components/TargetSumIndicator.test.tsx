import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TargetSumIndicator } from './TargetSumIndicator'
import type { Asset } from '@/types/api'

const createMockAsset = (id: string, targetPercentage: string): Asset => ({
  id,
  ticker: `TICK${id}`,
  name: `Asset ${id}`,
  category: 'ETF',
  targetPercentage,
  createdAt: '2026-01-07T00:00:00.000Z',
  updatedAt: '2026-01-07T00:00:00.000Z',
  userId: 'user-1',
})

describe('TargetSumIndicator', () => {
  it('should display green checkmark and valid state when sum equals 100%', () => {
    const assets = [
      createMockAsset('1', '60.00'),
      createMockAsset('2', '30.00'),
      createMockAsset('3', '10.00'),
    ]

    render(<TargetSumIndicator assets={assets} />)

    const indicator = screen.getByRole('status')
    expect(indicator).toHaveClass('text-green-600')
    expect(screen.getByTestId('icon-checkmark')).toBeInTheDocument()
    expect(screen.getByTestId('sum-value')).toHaveTextContent('Sum: 100%')
    expect(screen.queryByTestId('difference-value')).not.toBeInTheDocument()
  })

  it('should display amber warning and negative difference when sum is below 100%', () => {
    const assets = [
      createMockAsset('1', '50.00'),
      createMockAsset('2', '30.00'),
    ]

    render(<TargetSumIndicator assets={assets} />)

    const indicator = screen.getByRole('status')
    expect(indicator).toHaveClass('text-amber-600')
    expect(screen.getByTestId('icon-warning')).toBeInTheDocument()
    expect(screen.getByTestId('sum-value')).toHaveTextContent('Sum: 80%')
    expect(screen.getByTestId('difference-value')).toHaveTextContent('(-20%)')
  })

  it('should display red error and positive difference when sum is above 100%', () => {
    const assets = [
      createMockAsset('1', '60.00'),
      createMockAsset('2', '50.00'),
    ]

    render(<TargetSumIndicator assets={assets} />)

    const indicator = screen.getByRole('status')
    expect(indicator).toHaveClass('text-red-600')
    expect(screen.getByTestId('icon-error')).toBeInTheDocument()
    expect(screen.getByTestId('sum-value')).toHaveTextContent('Sum: 110%')
    expect(screen.getByTestId('difference-value')).toHaveTextContent('(+10%)')
  })

  it('should handle empty asset list with amber warning', () => {
    render(<TargetSumIndicator assets={[]} />)

    const indicator = screen.getByRole('status')
    expect(indicator).toHaveClass('text-amber-600')
    expect(screen.getByTestId('icon-warning')).toBeInTheDocument()
    expect(screen.getByTestId('sum-value')).toHaveTextContent('Sum: 0%')
    expect(screen.getByTestId('difference-value')).toHaveTextContent('(-100%)')
  })

  it('should use pendingChanges over stored values when provided', () => {
    const assets = [
      createMockAsset('1', '60.00'),
      createMockAsset('2', '30.00'),
      createMockAsset('3', '10.00'),
    ]
    
    // Override asset 1 from 60% to 50%
    const pendingChanges = new Map([['1', 50]])

    render(<TargetSumIndicator assets={assets} pendingChanges={pendingChanges} />)

    expect(screen.getByTestId('sum-value')).toHaveTextContent('Sum: 90%')
    expect(screen.getByTestId('difference-value')).toHaveTextContent('(-10%)')
  })

  it('should handle decimal values correctly', () => {
    const assets = [
      createMockAsset('1', '33.33'),
      createMockAsset('2', '33.33'),
      createMockAsset('3', '33.34'),
    ]

    render(<TargetSumIndicator assets={assets} />)

    const indicator = screen.getByRole('status')
    expect(indicator).toHaveClass('text-green-600')
    expect(screen.getByTestId('sum-value')).toHaveTextContent('Sum: 100%')
  })

  it('should round display values to 2 decimal places', () => {
    const assets = [
      createMockAsset('1', '33.333'),
      createMockAsset('2', '33.333'),
    ]

    render(<TargetSumIndicator assets={assets} />)

    // 66.666 rounds to 66.67
    expect(screen.getByTestId('sum-value')).toHaveTextContent('Sum: 66.67%')
    expect(screen.getByTestId('difference-value')).toHaveTextContent('(-33.33%)')
  })

  it('should have accessible role and aria-live', () => {
    const assets = [createMockAsset('1', '100.00')]

    render(<TargetSumIndicator assets={assets} />)

    const indicator = screen.getByRole('status')
    expect(indicator).toHaveAttribute('aria-live', 'polite')
  })
})
