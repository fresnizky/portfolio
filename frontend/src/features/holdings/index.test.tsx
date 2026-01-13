import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HoldingsPage } from './index'
import { api } from '@/lib/api'
import type { PortfolioSummary } from '@/types/api'

vi.mock('@/lib/api', () => ({
  api: {
    portfolio: {
      summary: vi.fn(),
    },
    prices: {
      update: vi.fn(),
      batchUpdate: vi.fn(),
    },
  },
}))

describe('HoldingsPage', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    vi.clearAllMocks()
  })

  const createMockSummary = (daysAgo: number = 2): PortfolioSummary => {
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    return {
      totalValue: '27232.88',
      positions: [
        {
          assetId: 'asset-1',
          ticker: 'VOO',
          name: 'Vanguard S&P 500 ETF',
          category: 'ETF',
          quantity: '10.5',
          currentPrice: '450.75',
          value: '4732.88',
          targetPercentage: '60.00',
          priceUpdatedAt: date.toISOString(),
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
          priceUpdatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago = stale
        },
      ],
    }
  }

  const renderPage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <HoldingsPage />
      </QueryClientProvider>
    )
  }

  it('should render page title', async () => {
    vi.mocked(api.portfolio.summary).mockResolvedValue(createMockSummary())
    renderPage()

    expect(screen.getByText('Holdings & Prices')).toBeInTheDocument()
  })

  it('should show loading state', () => {
    vi.mocked(api.portfolio.summary).mockImplementation(() => new Promise(() => {}))
    renderPage()

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should render total portfolio value', async () => {
    vi.mocked(api.portfolio.summary).mockResolvedValue(createMockSummary())
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('$27,232.88')).toBeInTheDocument()
    })
  })

  it('should render all positions', async () => {
    vi.mocked(api.portfolio.summary).mockResolvedValue(createMockSummary())
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('VOO')).toBeInTheDocument()
      expect(screen.getByText('BTC')).toBeInTheDocument()
    })
  })

  it('should show stale alert banner when any price is stale', async () => {
    vi.mocked(api.portfolio.summary).mockResolvedValue(createMockSummary())
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Some prices need updating')).toBeInTheDocument()
    })
  })

  it('should not show stale alert banner when all prices are fresh', async () => {
    const freshSummary: PortfolioSummary = {
      totalValue: '27232.88',
      positions: [
        {
          assetId: 'asset-1',
          ticker: 'VOO',
          name: 'Vanguard S&P 500 ETF',
          category: 'ETF',
          quantity: '10.5',
          currentPrice: '450.75',
          value: '4732.88',
          targetPercentage: '60.00',
          priceUpdatedAt: new Date().toISOString(),
        },
      ],
    }
    vi.mocked(api.portfolio.summary).mockResolvedValue(freshSummary)
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('VOO')).toBeInTheDocument()
    })

    expect(screen.queryByText('Some prices need updating')).not.toBeInTheDocument()
  })

  it('should open price update modal when edit button is clicked', async () => {
    vi.mocked(api.portfolio.summary).mockResolvedValue(createMockSummary())
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('VOO')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByLabelText('Update price for VOO'))

    await waitFor(() => {
      expect(screen.getByText('Update Price')).toBeInTheDocument()
    })
  })

  it('should update price successfully', async () => {
    const user = userEvent.setup()
    vi.mocked(api.portfolio.summary).mockResolvedValue(createMockSummary())
    vi.mocked(api.prices.update).mockResolvedValue({
      id: 'asset-1',
      ticker: 'VOO',
      name: 'Vanguard S&P 500 ETF',
      category: 'ETF',
      currency: 'USD',
      targetPercentage: '60.00',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-10T00:00:00.000Z',
      userId: 'user-1',
    })
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('VOO')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByLabelText('Update price for VOO'))

    await waitFor(() => {
      expect(screen.getByText('Update Price')).toBeInTheDocument()
    })

    const input = screen.getByLabelText('New Price')
    await user.clear(input)
    await user.type(input, '460.00')

    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => {
      expect(api.prices.update).toHaveBeenCalledWith('asset-1', { price: 460 })
    })
  })

  it('should show error state', async () => {
    vi.mocked(api.portfolio.summary).mockRejectedValue(new Error('Network error'))
    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })

  it('should show empty state when no positions', async () => {
    vi.mocked(api.portfolio.summary).mockResolvedValue({
      totalValue: '0',
      positions: [],
    })
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('No holdings yet')).toBeInTheDocument()
    })
  })
})
