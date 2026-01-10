import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AttentionRequiredSection } from './AttentionRequiredSection'
import type { DashboardAlert } from '@/types/api'

const mockAlerts: DashboardAlert[] = [
  {
    type: 'stale_price',
    assetId: 'asset-1',
    ticker: 'VOO',
    message: 'Update prices - last updated 10 days ago',
    severity: 'warning',
    data: { daysOld: 10 },
  },
  {
    type: 'rebalance_needed',
    assetId: 'asset-1',
    ticker: 'VOO',
    message: 'VOO is 7% overweight - consider rebalancing',
    severity: 'warning',
    data: { deviation: '7', direction: 'overweight' },
  },
  {
    type: 'stale_price',
    assetId: 'asset-2',
    ticker: 'BND',
    message: 'Update prices - last updated 8 days ago',
    severity: 'warning',
    data: { daysOld: 8 },
  },
]

describe('AttentionRequiredSection', () => {
  it('should return null when no alerts', () => {
    const { container } = render(<AttentionRequiredSection alerts={[]} />)

    expect(container.firstChild).toBeNull()
  })

  it('should group alerts by asset', () => {
    render(<AttentionRequiredSection alerts={mockAlerts} />)

    // VOO should have 2 alerts grouped together
    const vooSection = screen.getByText('VOO').closest('div')
    expect(vooSection).toBeInTheDocument()

    // BND should have 1 alert
    expect(screen.getByText('BND')).toBeInTheDocument()
  })

  it('should display alert count summary', () => {
    render(<AttentionRequiredSection alerts={mockAlerts} />)

    // 3 alerts for 2 assets
    expect(screen.getByText(/3 alerts/)).toBeInTheDocument()
    expect(screen.getByText(/2 assets/)).toBeInTheDocument()
  })

  it('should show all alerts for each asset', () => {
    render(<AttentionRequiredSection alerts={mockAlerts} />)

    // All messages should be visible
    expect(screen.getByText(/Update prices - last updated 10 days ago/)).toBeInTheDocument()
    expect(screen.getByText(/VOO is 7% overweight/)).toBeInTheDocument()
    expect(screen.getByText(/Update prices - last updated 8 days ago/)).toBeInTheDocument()
  })

  it('should display section title', () => {
    render(<AttentionRequiredSection alerts={mockAlerts} />)

    expect(screen.getByText('Attention Required')).toBeInTheDocument()
  })

  it('should handle single alert singular text', () => {
    const singleAlert: DashboardAlert[] = [
      {
        type: 'stale_price',
        assetId: 'asset-1',
        ticker: 'VOO',
        message: 'Update prices',
        severity: 'warning',
      },
    ]

    render(<AttentionRequiredSection alerts={singleAlert} />)

    expect(screen.getByText(/1 alert/)).toBeInTheDocument()
    expect(screen.getByText(/1 asset/)).toBeInTheDocument()
  })
})
