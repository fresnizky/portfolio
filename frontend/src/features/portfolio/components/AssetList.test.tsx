import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AssetList } from './AssetList'
import { api } from '@/lib/api'
import type { Asset } from '@/types/api'

vi.mock('@/lib/api', () => ({
  api: {
    assets: {
      list: vi.fn(),
    },
  },
}))

const mockAssets: Asset[] = [
  {
    id: 'asset-1',
    ticker: 'VOO',
    name: 'Vanguard S&P 500 ETF',
    category: 'ETF',
    targetPercentage: '60.00',
    createdAt: '2026-01-07T00:00:00.000Z',
    updatedAt: '2026-01-07T00:00:00.000Z',
    userId: 'user-1',
  },
  {
    id: 'asset-2',
    ticker: 'BTC',
    name: 'Bitcoin',
    category: 'CRYPTO',
    targetPercentage: '25.50',
    createdAt: '2026-01-07T00:00:00.000Z',
    updatedAt: '2026-01-07T00:00:00.000Z',
    userId: 'user-1',
  },
  {
    id: 'asset-3',
    ticker: 'CASH',
    name: 'Cash Reserve',
    category: 'CASH',
    targetPercentage: '14.50',
    createdAt: '2026-01-07T00:00:00.000Z',
    updatedAt: '2026-01-07T00:00:00.000Z',
    userId: 'user-1',
  },
]

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
}

function renderWithClient(ui: React.ReactElement) {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}

describe('AssetList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display loading skeleton while fetching', async () => {
    vi.mocked(api.assets.list).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    renderWithClient(<AssetList />)

    // Check for loading skeleton (animated pulse divs)
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should display assets when data is loaded', async () => {
    vi.mocked(api.assets.list).mockResolvedValue(mockAssets)

    renderWithClient(<AssetList />)

    // Wait for data to load
    expect(await screen.findByText('VOO')).toBeInTheDocument()
    expect(screen.getByText('Vanguard S&P 500 ETF')).toBeInTheDocument()
    expect(screen.getByText('ETF')).toBeInTheDocument()
    expect(screen.getByText('60.0%')).toBeInTheDocument()

    expect(screen.getByText('BTC')).toBeInTheDocument()
    expect(screen.getByText('Bitcoin')).toBeInTheDocument()
    expect(screen.getByText('CRYPTO')).toBeInTheDocument()
    expect(screen.getByText('25.5%')).toBeInTheDocument()

    // CASH appears both as ticker and category, so use getAllByText
    expect(screen.getAllByText('CASH').length).toBe(2) // ticker + category badge
    expect(screen.getByText('Cash Reserve')).toBeInTheDocument()
    expect(screen.getByText('14.5%')).toBeInTheDocument()
  })

  it('should display empty state when no assets exist', async () => {
    vi.mocked(api.assets.list).mockResolvedValue([])

    renderWithClient(<AssetList />)

    expect(
      await screen.findByText('No assets yet. Add your first asset to get started.')
    ).toBeInTheDocument()
  })

  it('should display error state when fetch fails', async () => {
    vi.mocked(api.assets.list).mockRejectedValue(new Error('Network error'))

    renderWithClient(<AssetList />)

    expect(await screen.findByText('Network error')).toBeInTheDocument()
  })

  it('should display table headers', async () => {
    vi.mocked(api.assets.list).mockResolvedValue(mockAssets)

    renderWithClient(<AssetList />)

    await screen.findByText('VOO') // Wait for load

    expect(screen.getByText('Ticker')).toBeInTheDocument()
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Category')).toBeInTheDocument()
    expect(screen.getByText('Target')).toBeInTheDocument()
  })

  it('should apply correct category badge styles', async () => {
    vi.mocked(api.assets.list).mockResolvedValue(mockAssets)

    renderWithClient(<AssetList />)

    await screen.findByText('VOO') // Wait for load

    const etfBadge = screen.getByText('ETF')
    expect(etfBadge).toHaveClass('bg-blue-100', 'text-blue-800')

    const cryptoBadge = screen.getByText('CRYPTO')
    expect(cryptoBadge).toHaveClass('bg-orange-100', 'text-orange-800')

    // CASH category badge (not the ticker)
    const cashBadges = screen.getAllByText('CASH')
    const cashCategoryBadge = cashBadges.find(el => el.classList.contains('bg-gray-100'))
    expect(cashCategoryBadge).toHaveClass('bg-gray-100', 'text-gray-800')
  })
})
