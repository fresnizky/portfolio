import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { AlertItem } from './AlertItem'
import type { DashboardAlert } from '@/types/api'

const mockNavigate = vi.fn()

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('AlertItem', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('should display alert message and ticker', () => {
    const alert: DashboardAlert = {
      type: 'stale_price',
      assetId: 'asset-1',
      ticker: 'VOO',
      message: 'Update prices - last updated 10 days ago',
      severity: 'warning',
      data: { daysOld: 10 },
    }

    renderWithRouter(<AlertItem alert={alert} />)

    expect(screen.getByText('VOO')).toBeInTheDocument()
    expect(screen.getByText('Update prices - last updated 10 days ago')).toBeInTheDocument()
  })

  it('should show clock icon for stale_price alerts', () => {
    const alert: DashboardAlert = {
      type: 'stale_price',
      assetId: 'asset-1',
      ticker: 'VOO',
      message: 'Update prices',
      severity: 'warning',
      data: { daysOld: 10 },
    }

    renderWithRouter(<AlertItem alert={alert} />)

    expect(screen.getByTestId('alert-icon-clock')).toBeInTheDocument()
  })

  it('should show scale icon for rebalance_needed alerts', () => {
    const alert: DashboardAlert = {
      type: 'rebalance_needed',
      assetId: 'asset-2',
      ticker: 'BND',
      message: 'Consider rebalancing',
      severity: 'warning',
      data: { deviation: '7', direction: 'overweight' },
    }

    renderWithRouter(<AlertItem alert={alert} />)

    expect(screen.getByTestId('alert-icon-scale')).toBeInTheDocument()
  })

  it('should navigate to /portfolio on click', () => {
    const alert: DashboardAlert = {
      type: 'stale_price',
      assetId: 'asset-1',
      ticker: 'VOO',
      message: 'Update prices',
      severity: 'warning',
    }

    renderWithRouter(<AlertItem alert={alert} />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(mockNavigate).toHaveBeenCalledWith('/portfolio')
  })

  it('should display days old for stale price alerts', () => {
    const alert: DashboardAlert = {
      type: 'stale_price',
      assetId: 'asset-1',
      ticker: 'VOO',
      message: 'Update prices',
      severity: 'warning',
      data: { daysOld: 10 },
    }

    renderWithRouter(<AlertItem alert={alert} />)

    expect(screen.getByText('Last updated 10 days ago')).toBeInTheDocument()
  })

  it('should display deviation for rebalance alerts', () => {
    const alert: DashboardAlert = {
      type: 'rebalance_needed',
      assetId: 'asset-2',
      ticker: 'BND',
      message: 'Consider rebalancing',
      severity: 'warning',
      data: { deviation: '7', direction: 'overweight' },
    }

    renderWithRouter(<AlertItem alert={alert} />)

    expect(screen.getByText('+7% deviation')).toBeInTheDocument()
  })

  it('should show negative deviation for underweight', () => {
    const alert: DashboardAlert = {
      type: 'rebalance_needed',
      assetId: 'asset-2',
      ticker: 'BND',
      message: 'Consider rebalancing',
      severity: 'warning',
      data: { deviation: '5', direction: 'underweight' },
    }

    renderWithRouter(<AlertItem alert={alert} />)

    expect(screen.getByText('-5% deviation')).toBeInTheDocument()
  })

  it('should apply warning color for warning severity', () => {
    const alert: DashboardAlert = {
      type: 'stale_price',
      assetId: 'asset-1',
      ticker: 'VOO',
      message: 'Update prices',
      severity: 'warning',
    }

    renderWithRouter(<AlertItem alert={alert} />)

    const button = screen.getByRole('button')
    expect(button.className).toContain('bg-amber-50')
    expect(button.className).toContain('border-amber-200')
  })

  it('should apply info color for info severity', () => {
    const alert: DashboardAlert = {
      type: 'stale_price',
      assetId: 'asset-1',
      ticker: 'VOO',
      message: 'Update prices',
      severity: 'info',
    }

    renderWithRouter(<AlertItem alert={alert} />)

    const button = screen.getByRole('button')
    expect(button.className).toContain('bg-blue-50')
    expect(button.className).toContain('border-blue-200')
  })
})
