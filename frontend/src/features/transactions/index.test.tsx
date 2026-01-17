import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TransactionsPage } from './index'
import { api } from '@/lib/api'
import type { Asset, Transaction, ContributionAllocation } from '@/types/api'

vi.mock('@/lib/api', () => ({
  api: {
    assets: {
      list: vi.fn(),
    },
    transactions: {
      list: vi.fn(),
      create: vi.fn(),
    },
  },
}))

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
]

const mockTransactions: Transaction[] = [
  {
    id: 'tx-1',
    type: 'BUY',
    date: '2026-01-07T12:00:00.000Z',
    quantity: '10',
    price: '150.00',
    commission: '5.00',
    totalCost: '1505.00', // (10 × 150) + 5 = $1,505.00
    assetId: 'asset-1',
    createdAt: '2026-01-07T12:00:00.000Z',
    asset: { ticker: 'VOO', name: 'Vanguard S&P 500 ETF' },
  },
]

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

const mockContributionAllocations: ContributionAllocation[] = [
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

describe('TransactionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('should render page title', async () => {
    vi.mocked(api.assets.list).mockResolvedValue(mockAssets)
    vi.mocked(api.transactions.list).mockResolvedValue({
      transactions: mockTransactions,
      total: 1,
    })

    renderWithClient(<TransactionsPage />)

    expect(screen.getByRole('heading', { name: 'Transactions' })).toBeInTheDocument()
  })

  it('should render Add Transaction button', async () => {
    vi.mocked(api.assets.list).mockResolvedValue(mockAssets)
    vi.mocked(api.transactions.list).mockResolvedValue({
      transactions: mockTransactions,
      total: 1,
    })

    renderWithClient(<TransactionsPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Add Transaction' })).toBeInTheDocument()
    })
  })

  it('should render transaction summary', async () => {
    vi.mocked(api.assets.list).mockResolvedValue(mockAssets)
    vi.mocked(api.transactions.list).mockResolvedValue({
      transactions: mockTransactions,
      total: 1,
    })

    renderWithClient(<TransactionsPage />)

    await waitFor(() => {
      expect(screen.getByText('Total Invested')).toBeInTheDocument()
      expect(screen.getByText('Total Withdrawn')).toBeInTheDocument()
    })
  })

  it('should render transaction filters', async () => {
    vi.mocked(api.assets.list).mockResolvedValue(mockAssets)
    vi.mocked(api.transactions.list).mockResolvedValue({
      transactions: mockTransactions,
      total: 1,
    })

    renderWithClient(<TransactionsPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('Asset')).toBeInTheDocument()
      expect(screen.getByLabelText('Type')).toBeInTheDocument()
    })
  })

  it('should render transactions list', async () => {
    vi.mocked(api.assets.list).mockResolvedValue(mockAssets)
    vi.mocked(api.transactions.list).mockResolvedValue({
      transactions: mockTransactions,
      total: 1,
    })

    renderWithClient(<TransactionsPage />)

    await waitFor(() => {
      // Check for transaction table content (ticker appears in filter and table)
      expect(screen.getAllByText('VOO')).toHaveLength(2) // filter + table row
      expect(screen.getByText('BUY')).toBeInTheDocument()
      // Total appears in both summary and table row
      expect(screen.getAllByText('$1,505.00')).toHaveLength(2)
    })
  })

  it('should open create modal when Add Transaction is clicked', async () => {
    const user = userEvent.setup()
    vi.mocked(api.assets.list).mockResolvedValue(mockAssets)
    vi.mocked(api.transactions.list).mockResolvedValue({
      transactions: [],
      total: 0,
    })

    renderWithClient(<TransactionsPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Add Transaction' })).not.toBeDisabled()
    })

    await user.click(screen.getByRole('button', { name: 'Add Transaction' }))

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Record Transaction' })).toBeInTheDocument()
    })
  })

  it('should show error state when loading fails', async () => {
    vi.mocked(api.assets.list).mockResolvedValue(mockAssets)
    vi.mocked(api.transactions.list).mockRejectedValue(new Error('Network error'))

    renderWithClient(<TransactionsPage />)

    await waitFor(() => {
      expect(screen.getByText('Error loading transactions')).toBeInTheDocument()
    })
  })

  it('should show empty state when no transactions', async () => {
    vi.mocked(api.assets.list).mockResolvedValue(mockAssets)
    vi.mocked(api.transactions.list).mockResolvedValue({
      transactions: [],
      total: 0,
    })

    renderWithClient(<TransactionsPage />)

    await waitFor(() => {
      expect(screen.getByText('No transactions recorded yet')).toBeInTheDocument()
    })
  })

  describe('Pending Contribution Banner', () => {
    it('should show banner when pending contribution exists', async () => {
      const prefillData = {
        amount: 1000,
        allocations: mockContributionAllocations,
        timestamp: Date.now(),
        processedAssetIds: [],
        status: 'pending',
      }
      sessionStorage.setItem('contribution-prefill', JSON.stringify(prefillData))

      vi.mocked(api.assets.list).mockResolvedValue(mockAssets)
      vi.mocked(api.transactions.list).mockResolvedValue({
        transactions: [],
        total: 0,
      })

      renderWithClient(<TransactionsPage />)

      await waitFor(() => {
        expect(screen.getByText(/aporte pendiente/i)).toBeInTheDocument()
      })
    })

    it('should show count of remaining transactions', async () => {
      const prefillData = {
        amount: 1000,
        allocations: mockContributionAllocations,
        timestamp: Date.now(),
        processedAssetIds: ['asset-1'],
        status: 'in_progress',
      }
      sessionStorage.setItem('contribution-prefill', JSON.stringify(prefillData))

      vi.mocked(api.assets.list).mockResolvedValue(mockAssets)
      vi.mocked(api.transactions.list).mockResolvedValue({
        transactions: [],
        total: 0,
      })

      renderWithClient(<TransactionsPage />)

      await waitFor(() => {
        expect(screen.getByText(/1 de 2/i)).toBeInTheDocument()
      })
    })

    it('should have Continue button in banner', async () => {
      const prefillData = {
        amount: 1000,
        allocations: mockContributionAllocations,
        timestamp: Date.now(),
        processedAssetIds: [],
        status: 'pending',
      }
      sessionStorage.setItem('contribution-prefill', JSON.stringify(prefillData))

      vi.mocked(api.assets.list).mockResolvedValue(mockAssets)
      vi.mocked(api.transactions.list).mockResolvedValue({
        transactions: [],
        total: 0,
      })

      renderWithClient(<TransactionsPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /continuar/i })).toBeInTheDocument()
      })
    })

    it('should have Discard button in banner', async () => {
      const prefillData = {
        amount: 1000,
        allocations: mockContributionAllocations,
        timestamp: Date.now(),
        processedAssetIds: [],
        status: 'pending',
      }
      sessionStorage.setItem('contribution-prefill', JSON.stringify(prefillData))

      vi.mocked(api.assets.list).mockResolvedValue(mockAssets)
      vi.mocked(api.transactions.list).mockResolvedValue({
        transactions: [],
        total: 0,
      })

      renderWithClient(<TransactionsPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /descartar/i })).toBeInTheDocument()
      })
    })

    it('should show confirmation dialog when Discard is clicked', async () => {
      const user = userEvent.setup()
      const prefillData = {
        amount: 1000,
        allocations: mockContributionAllocations,
        timestamp: Date.now(),
        processedAssetIds: [],
        status: 'pending',
      }
      sessionStorage.setItem('contribution-prefill', JSON.stringify(prefillData))

      vi.mocked(api.assets.list).mockResolvedValue(mockAssets)
      vi.mocked(api.transactions.list).mockResolvedValue({
        transactions: [],
        total: 0,
      })

      renderWithClient(<TransactionsPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /descartar/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /descartar/i }))

      // Should show confirmation dialog
      await waitFor(() => {
        expect(screen.getByText(/transacciones pendientes de registrar/i)).toBeInTheDocument()
      })
    })

    it('should clear pending contribution after confirmation', async () => {
      const user = userEvent.setup()
      const prefillData = {
        amount: 1000,
        allocations: mockContributionAllocations,
        timestamp: Date.now(),
        processedAssetIds: [],
        status: 'pending',
      }
      sessionStorage.setItem('contribution-prefill', JSON.stringify(prefillData))

      vi.mocked(api.assets.list).mockResolvedValue(mockAssets)
      vi.mocked(api.transactions.list).mockResolvedValue({
        transactions: [],
        total: 0,
      })

      renderWithClient(<TransactionsPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /descartar/i })).toBeInTheDocument()
      })

      // Click discard to open dialog
      await user.click(screen.getByRole('button', { name: /descartar/i }))

      // Wait for dialog and confirm
      await waitFor(() => {
        expect(screen.getByText(/transacciones pendientes de registrar/i)).toBeInTheDocument()
      })

      // Click confirm button in dialog (there are two "Descartar" buttons now)
      const confirmButton = screen.getAllByRole('button', { name: /descartar/i })[1]
      await user.click(confirmButton)

      await waitFor(() => {
        expect(screen.queryByText(/aporte pendiente/i)).not.toBeInTheDocument()
      })
    })

    it('should not show banner when no pending contribution exists', async () => {
      vi.mocked(api.assets.list).mockResolvedValue(mockAssets)
      vi.mocked(api.transactions.list).mockResolvedValue({
        transactions: [],
        total: 0,
      })

      renderWithClient(<TransactionsPage />)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Transactions' })).toBeInTheDocument()
      })

      expect(screen.queryByText(/aporte pendiente/i)).not.toBeInTheDocument()
    })
  })
})
