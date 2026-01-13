import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DeleteAssetDialog } from './DeleteAssetDialog'
import { api } from '@/lib/api'
import type { Asset } from '@/types/api'

vi.mock('@/lib/api', () => ({
  api: {
    assets: {
      delete: vi.fn(),
    },
  },
}))

const mockAsset: Asset = {
  id: 'asset-1',
  ticker: 'VOO',
  name: 'Vanguard S&P 500 ETF',
  category: 'ETF',
    currency: 'USD',
  targetPercentage: '60.00',
  createdAt: '2026-01-07T00:00:00.000Z',
  updatedAt: '2026-01-07T00:00:00.000Z',
  userId: 'user-1',
}

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

describe('DeleteAssetDialog', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not render when asset is null', () => {
    renderWithClient(
      <DeleteAssetDialog asset={null} isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('should not render when closed', () => {
    renderWithClient(
      <DeleteAssetDialog asset={mockAsset} isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('should render confirmation dialog when open', () => {
    renderWithClient(
      <DeleteAssetDialog asset={mockAsset} isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText('Delete VOO?')).toBeInTheDocument()
    expect(screen.getByText(/Vanguard S&P 500 ETF/)).toBeInTheDocument()
  })

  it('should warn about data loss including snapshots and calculations', () => {
    renderWithClient(
      <DeleteAssetDialog asset={mockAsset} isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )
    expect(screen.getByText(/holdings, transactions, portfolio snapshots, and historical calculations/)).toBeInTheDocument()
    expect(screen.getByText(/cannot be undone/)).toBeInTheDocument()
  })

  it('should call onClose when cancel is clicked', async () => {
    const user = userEvent.setup()
    renderWithClient(
      <DeleteAssetDialog asset={mockAsset} isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should delete asset and call onSuccess on confirmation', async () => {
    const user = userEvent.setup()
    vi.mocked(api.assets.delete).mockResolvedValue(undefined)

    renderWithClient(
      <DeleteAssetDialog asset={mockAsset} isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )

    await user.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(api.assets.delete).toHaveBeenCalledWith('asset-1')
      expect(mockOnClose).toHaveBeenCalled()
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  it('should not close on failed deletion', async () => {
    const user = userEvent.setup()
    vi.mocked(api.assets.delete).mockRejectedValue(new Error('Delete failed'))

    renderWithClient(
      <DeleteAssetDialog asset={mockAsset} isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )

    await user.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(api.assets.delete).toHaveBeenCalled()
    })
    // Should not close on error
    expect(mockOnClose).not.toHaveBeenCalled()
  })
})
