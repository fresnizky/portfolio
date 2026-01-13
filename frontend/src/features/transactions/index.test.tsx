import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TransactionsPage } from './index'
import { api } from '@/lib/api'
import type { Asset, Transaction } from '@/types/api'

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

describe('TransactionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
      // Check for transaction card content
      expect(screen.getByText('Vanguard S&P 500 ETF')).toBeInTheDocument()
      expect(screen.getByText('BUY')).toBeInTheDocument()
      // Total appears in both summary and card
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
})
