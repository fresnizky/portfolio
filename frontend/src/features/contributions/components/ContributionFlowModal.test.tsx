import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ContributionFlowModal } from './ContributionFlowModal'
import { api } from '@/lib/api'
import type { ContributionAllocation, Asset } from '@/types/api'

vi.mock('@/lib/api', () => ({
  api: {
    assets: {
      list: vi.fn(),
    },
    transactions: {
      create: vi.fn(),
    },
  },
}))

const mockAllocations: ContributionAllocation[] = [
  {
    assetId: 'asset-1',
    ticker: 'VOO',
    name: 'Vanguard S&P 500 ETF',
    targetPercentage: '60.00',
    actualPercentage: '55.00',
    deviation: '-5.00',
    baseAllocation: '600.00',
    adjustedAllocation: '650.00',
    adjustmentReason: 'underweight',
  },
  {
    assetId: 'asset-2',
    ticker: 'BTC',
    name: 'Bitcoin',
    targetPercentage: '40.00',
    actualPercentage: '45.00',
    deviation: '5.00',
    baseAllocation: '400.00',
    adjustedAllocation: '350.00',
    adjustmentReason: 'overweight',
  },
]

const mockAssets: Asset[] = [
  {
    id: 'asset-1',
    ticker: 'VOO',
    name: 'Vanguard S&P 500 ETF',
    category: 'ETF',
    currency: 'USD',
    targetPercentage: '60.00',
    createdAt: '2026-01-07T00:00:00.000Z',
    updatedAt: '2026-01-07T00:00:00.000Z',
    userId: 'user-1',
  },
  {
    id: 'asset-2',
    ticker: 'BTC',
    name: 'Bitcoin',
    category: 'Crypto',
    currency: 'USD',
    targetPercentage: '40.00',
    createdAt: '2026-01-07T00:00:00.000Z',
    updatedAt: '2026-01-07T00:00:00.000Z',
    userId: 'user-1',
  },
]

const STORAGE_KEY = 'contribution-prefill'

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

function renderWithClient(ui: React.ReactElement) {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  )
}

describe('ContributionFlowModal', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    vi.mocked(api.assets.list).mockResolvedValue(mockAssets)
  })

  it('should not render when no pending contribution', () => {
    renderWithClient(<ContributionFlowModal isOpen={true} onClose={mockOnClose} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should render modal with progress indicator when open', async () => {
    const prefillData = {
      amount: 1000,
      allocations: mockAllocations,
      timestamp: Date.now(),
      processedAssetIds: [],
      status: 'pending',
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(prefillData))

    renderWithClient(<ContributionFlowModal isOpen={true} onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    expect(screen.getByText(/1\/2/)).toBeInTheDocument()
  })

  it('should show current asset info', async () => {
    const prefillData = {
      amount: 1000,
      allocations: mockAllocations,
      timestamp: Date.now(),
      processedAssetIds: [],
      status: 'pending',
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(prefillData))

    renderWithClient(<ContributionFlowModal isOpen={true} onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.getByText('VOO')).toBeInTheDocument()
      expect(screen.getByText('Vanguard S&P 500 ETF')).toBeInTheDocument()
    })
  })

  it('should show suggested amount for current asset', async () => {
    const prefillData = {
      amount: 1000,
      allocations: mockAllocations,
      timestamp: Date.now(),
      processedAssetIds: [],
      status: 'pending',
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(prefillData))

    renderWithClient(<ContributionFlowModal isOpen={true} onClose={mockOnClose} />)

    await waitFor(() => {
      // Multiple elements show 650 (header + form hint), so use getAllByText
      expect(screen.getAllByText(/650/).length).toBeGreaterThan(0)
    })
  })

  it('should have skip button', async () => {
    const prefillData = {
      amount: 1000,
      allocations: mockAllocations,
      timestamp: Date.now(),
      processedAssetIds: [],
      status: 'pending',
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(prefillData))

    renderWithClient(<ContributionFlowModal isOpen={true} onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /omitir/i })).toBeInTheDocument()
    })
  })

  it('should advance to next asset when skip is clicked', async () => {
    const user = userEvent.setup()
    const prefillData = {
      amount: 1000,
      allocations: mockAllocations,
      timestamp: Date.now(),
      processedAssetIds: [],
      status: 'pending',
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(prefillData))

    renderWithClient(<ContributionFlowModal isOpen={true} onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.getByText('VOO')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /omitir/i }))

    await waitFor(() => {
      expect(screen.getByText('BTC')).toBeInTheDocument()
    })
  })

  it('should show completion summary after all assets processed', async () => {
    const user = userEvent.setup()
    const prefillData = {
      amount: 1000,
      allocations: mockAllocations,
      timestamp: Date.now(),
      processedAssetIds: ['asset-1'],
      status: 'in_progress',
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(prefillData))

    renderWithClient(<ContributionFlowModal isOpen={true} onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.getByText('BTC')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /omitir/i }))

    await waitFor(() => {
      expect(screen.getByText('Aporte Registrado')).toBeInTheDocument()
    })
  })
})
