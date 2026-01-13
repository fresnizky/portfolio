import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import { DashboardPage } from './index'
import { api } from '@/lib/api'
import type { ReactNode } from 'react'
import type { DashboardResponse } from '@/types/api'

// Mock ResizeObserver for Recharts
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

vi.mock('@/lib/api', () => ({
  api: {
    dashboard: {
      get: vi.fn(),
    },
  },
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({ id: 'user-1', email: 'test@example.com' })),
}))

describe('DashboardPage', () => {
  let queryClient: QueryClient

  const createWrapper = () => {
    return function Wrapper({ children }: { children: ReactNode }) {
      return (
        <MemoryRouter>
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </MemoryRouter>
      )
    }
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
    vi.clearAllMocks()
  })

  const mockDashboardResponse: DashboardResponse = {
    totalValue: '10000.00',
    displayCurrency: 'USD',
    exchangeRate: null,
    positions: [
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
    ],
    alerts: [],
  }

  it('should display dashboard title', async () => {
    vi.mocked(api.dashboard.get).mockResolvedValue(mockDashboardResponse)

    render(<DashboardPage />, { wrapper: createWrapper() })

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('should display total portfolio value', async () => {
    vi.mocked(api.dashboard.get).mockResolvedValue(mockDashboardResponse)

    render(<DashboardPage />, { wrapper: createWrapper() })

    expect(await screen.findByText('$10,000.00')).toBeInTheDocument()
  })

  it('should show loading state initially', () => {
    vi.mocked(api.dashboard.get).mockImplementation(() => new Promise(() => {}))

    render(<DashboardPage />, { wrapper: createWrapper() })

    expect(screen.getByTestId('summary-skeleton')).toBeInTheDocument()
  })

  it('should display error state on API failure', async () => {
    vi.mocked(api.dashboard.get).mockRejectedValue(new Error('Network error'))

    render(<DashboardPage />, { wrapper: createWrapper() })

    expect(await screen.findByText(/error/i)).toBeInTheDocument()
  })

  it('should display empty state when no assets', async () => {
    vi.mocked(api.dashboard.get).mockResolvedValue({
      totalValue: '0',
      displayCurrency: 'USD',
      exchangeRate: null,
      positions: [],
      alerts: [],
    })

    render(<DashboardPage />, { wrapper: createWrapper() })

    expect(await screen.findByText('No assets to display')).toBeInTheDocument()
  })

  it('should display AlertsPanel with alerts', async () => {
    const responseWithAlerts: DashboardResponse = {
      ...mockDashboardResponse,
      alerts: [
        {
          type: 'stale_price',
          assetId: 'asset-1',
          ticker: 'VOO',
          message: 'Update prices - last updated 10 days ago',
          severity: 'warning',
          data: { daysOld: 10 },
        },
      ],
    }
    vi.mocked(api.dashboard.get).mockResolvedValue(responseWithAlerts)

    render(<DashboardPage />, { wrapper: createWrapper() })

    expect(await screen.findByText('Alerts')).toBeInTheDocument()
    expect(screen.getByText('Update prices - last updated 10 days ago')).toBeInTheDocument()
  })

  it('should display EmptyAlertsState when no alerts', async () => {
    vi.mocked(api.dashboard.get).mockResolvedValue(mockDashboardResponse)

    render(<DashboardPage />, { wrapper: createWrapper() })

    expect(await screen.findByText('Portfolio is on track!')).toBeInTheDocument()
  })

  it('should display AttentionRequiredSection when alerts exist', async () => {
    const responseWithAlerts: DashboardResponse = {
      ...mockDashboardResponse,
      alerts: [
        {
          type: 'rebalance_needed',
          assetId: 'asset-1',
          ticker: 'VOO',
          message: 'VOO is 7% overweight',
          severity: 'warning',
          data: { deviation: '7', direction: 'overweight' },
        },
      ],
    }
    vi.mocked(api.dashboard.get).mockResolvedValue(responseWithAlerts)

    render(<DashboardPage />, { wrapper: createWrapper() })

    expect(await screen.findByText('Attention Required')).toBeInTheDocument()
  })
})
