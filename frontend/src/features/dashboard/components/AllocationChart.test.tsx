import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AllocationChart } from './AllocationChart'
import type { DashboardPosition } from '@/types/api'

// Mock ResizeObserver for Recharts ResponsiveContainer
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

describe('AllocationChart', () => {
  const mockPositions: DashboardPosition[] = [
    {
      assetId: 'asset-1',
      ticker: 'VOO',
      name: 'Vanguard S&P 500 ETF',
      category: 'ETF',
      quantity: '10',
      currentPrice: '450.00',
      originalValue: '4500.00',
      originalCurrency: 'USD',
      value: '4500.00',
      displayCurrency: 'USD',
      targetPercentage: '60.00',
      actualPercentage: '45.00',
      deviation: '-15.00',
      priceUpdatedAt: '2026-01-10T12:00:00.000Z',
    },
    {
      assetId: 'asset-2',
      ticker: 'BTC',
      name: 'Bitcoin',
      category: 'CRYPTO',
      quantity: '0.1',
      currentPrice: '55000.00',
      originalValue: '5500.00',
      originalCurrency: 'USD',
      value: '5500.00',
      displayCurrency: 'USD',
      targetPercentage: '40.00',
      actualPercentage: '55.00',
      deviation: '15.00',
      priceUpdatedAt: '2026-01-10T12:00:00.000Z',
    },
  ]

  it('should render chart container with positions', () => {
    const { container } = render(<AllocationChart positions={mockPositions} />)
    // ResponsiveContainer creates a div with recharts-responsive-container class
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument()
  })

  it('should show empty state for no positions', () => {
    render(<AllocationChart positions={[]} />)
    expect(screen.getByText('No assets to display')).toBeInTheDocument()
  })

  it('should not show empty state when positions exist', () => {
    render(<AllocationChart positions={mockPositions} />)
    expect(screen.queryByText('No assets to display')).not.toBeInTheDocument()
  })
})
