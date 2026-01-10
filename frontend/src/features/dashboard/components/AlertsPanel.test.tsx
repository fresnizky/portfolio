import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { AlertsPanel } from './AlertsPanel'
import type { DashboardAlert } from '@/types/api'

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

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
    assetId: 'asset-2',
    ticker: 'BND',
    message: 'BND is 7% overweight - consider rebalancing',
    severity: 'warning',
    data: { deviation: '7', direction: 'overweight' },
  },
]

describe('AlertsPanel', () => {
  it('should display list of alerts when alerts exist', () => {
    renderWithRouter(<AlertsPanel alerts={mockAlerts} />)

    expect(screen.getByText('Alerts')).toBeInTheDocument()
    expect(screen.getByTestId('alert-item-asset-1')).toBeInTheDocument()
    expect(screen.getByTestId('alert-item-asset-2')).toBeInTheDocument()
  })

  it('should show EmptyAlertsState when no alerts', () => {
    renderWithRouter(<AlertsPanel alerts={[]} />)

    expect(screen.getByTestId('empty-alerts-state')).toBeInTheDocument()
    expect(screen.queryByText('Alerts')).not.toBeInTheDocument()
  })

  it('should render correct number of AlertItems', () => {
    renderWithRouter(<AlertsPanel alerts={mockAlerts} />)

    const alertItems = screen.getAllByTestId(/^alert-item-/)
    expect(alertItems).toHaveLength(2)
  })

  it('should display alert ticker and message', () => {
    renderWithRouter(<AlertsPanel alerts={mockAlerts} />)

    expect(screen.getByText('VOO')).toBeInTheDocument()
    expect(screen.getByText('Update prices - last updated 10 days ago')).toBeInTheDocument()
    expect(screen.getByText('BND')).toBeInTheDocument()
    expect(screen.getByText('BND is 7% overweight - consider rebalancing')).toBeInTheDocument()
  })
})
