import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CreateAssetModal } from './CreateAssetModal'
import { api } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  api: {
    assets: {
      create: vi.fn(),
    },
  },
}))

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
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}

describe('CreateAssetModal', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not render when closed', () => {
    renderWithClient(
      <CreateAssetModal isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should render modal with form when open', () => {
    renderWithClient(
      <CreateAssetModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Add New Asset')).toBeInTheDocument()
    expect(screen.getByLabelText('Ticker')).toBeInTheDocument()
  })

  it('should call onClose when cancel is clicked', async () => {
    const user = userEvent.setup()
    renderWithClient(
      <CreateAssetModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should create asset and call onSuccess on successful submission', async () => {
    const user = userEvent.setup()
    vi.mocked(api.assets.create).mockResolvedValue({
      id: 'new-asset',
      ticker: 'BTC',
      name: 'Bitcoin',
      category: 'CRYPTO',
      targetPercentage: '0.00',
      createdAt: '2026-01-07T00:00:00.000Z',
      updatedAt: '2026-01-07T00:00:00.000Z',
      userId: 'user-1',
    })

    renderWithClient(
      <CreateAssetModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )

    await user.type(screen.getByLabelText('Ticker'), 'BTC')
    await user.type(screen.getByLabelText('Name'), 'Bitcoin')
    await user.selectOptions(screen.getByLabelText('Category'), 'CRYPTO')
    await user.click(screen.getByRole('button', { name: 'Create Asset' }))

    await waitFor(() => {
      expect(api.assets.create).toHaveBeenCalledWith({
        ticker: 'BTC',
        name: 'Bitcoin',
        category: 'CRYPTO',
        targetPercentage: 0,
      })
      expect(mockOnClose).toHaveBeenCalled()
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  it('should show error message on failed submission', async () => {
    const user = userEvent.setup()
    vi.mocked(api.assets.create).mockRejectedValue(new Error('Ticker already exists'))

    renderWithClient(
      <CreateAssetModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )

    await user.type(screen.getByLabelText('Ticker'), 'VOO')
    await user.type(screen.getByLabelText('Name'), 'Duplicate')
    await user.click(screen.getByRole('button', { name: 'Create Asset' }))

    await waitFor(() => {
      expect(screen.getByText('Ticker already exists')).toBeInTheDocument()
    })
    expect(mockOnClose).not.toHaveBeenCalled()
  })
})
