import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CreateTransactionModal } from './CreateTransactionModal'
import { api } from '@/lib/api'
import type { Asset } from '@/types/api'

vi.mock('@/lib/api', () => ({
  api: {
    transactions: {
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
  {
    id: 'asset-2',
    ticker: 'BTC',
    name: 'Bitcoin',
    category: 'CRYPTO',
    currency: 'USD',
    targetPercentage: '20.00',
    createdAt: '2026-01-07T00:00:00.000Z',
    updatedAt: '2026-01-07T00:00:00.000Z',
    userId: 'user-1',
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

describe('CreateTransactionModal', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not render when closed', () => {
    renderWithClient(
      <CreateTransactionModal
        isOpen={false}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        assets={mockAssets}
      />
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should render modal with form when open', () => {
    renderWithClient(
      <CreateTransactionModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        assets={mockAssets}
      />
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Record Transaction' })).toBeInTheDocument()
    expect(screen.getByLabelText('Type')).toBeInTheDocument()
    expect(screen.getByLabelText('Asset')).toBeInTheDocument()
  })

  it('should call onClose when cancel is clicked', async () => {
    const user = userEvent.setup()
    renderWithClient(
      <CreateTransactionModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        assets={mockAssets}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should create transaction and call onSuccess on successful submission', async () => {
    const user = userEvent.setup()
    vi.mocked(api.transactions.create).mockResolvedValue({
      id: 'tx-1',
      type: 'BUY',
      date: '2026-01-07T00:00:00.000Z',
      quantity: '10',
      price: '150.00',
      commission: '5.00',
      totalCost: '1505.00',
      assetId: 'asset-1',
      createdAt: '2026-01-07T00:00:00.000Z',
      asset: { ticker: 'VOO', name: 'Vanguard S&P 500 ETF' },
    })

    renderWithClient(
      <CreateTransactionModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        assets={mockAssets}
      />
    )

    await user.selectOptions(screen.getByLabelText('Asset'), 'asset-1')
    await user.clear(screen.getByLabelText('Quantity'))
    await user.type(screen.getByLabelText('Quantity'), '10')
    await user.clear(screen.getByLabelText(/Price per unit/))
    await user.type(screen.getByLabelText(/Price per unit/), '150')
    await user.click(screen.getByRole('button', { name: 'Record Transaction' }))

    await waitFor(() => {
      expect(api.transactions.create).toHaveBeenCalled()
      expect(mockOnClose).toHaveBeenCalled()
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  it('should show error message on failed submission', async () => {
    const user = userEvent.setup()
    vi.mocked(api.transactions.create).mockRejectedValue(
      new Error('Insufficient quantity to sell')
    )

    renderWithClient(
      <CreateTransactionModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        assets={mockAssets}
      />
    )

    await user.selectOptions(screen.getByLabelText('Type'), 'sell')
    await user.selectOptions(screen.getByLabelText('Asset'), 'asset-1')
    await user.clear(screen.getByLabelText('Quantity'))
    await user.type(screen.getByLabelText('Quantity'), '1000')
    await user.clear(screen.getByLabelText(/Price per unit/))
    await user.type(screen.getByLabelText(/Price per unit/), '150')
    await user.click(screen.getByRole('button', { name: 'Record Transaction' }))

    await waitFor(() => {
      expect(screen.getByText('Insufficient quantity to sell')).toBeInTheDocument()
    })
    expect(mockOnClose).not.toHaveBeenCalled()
  })
})
