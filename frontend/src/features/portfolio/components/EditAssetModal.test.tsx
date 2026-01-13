import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { EditAssetModal } from './EditAssetModal'
import { api } from '@/lib/api'
import type { Asset } from '@/types/api'

vi.mock('@/lib/api', () => ({
  api: {
    assets: {
      update: vi.fn(),
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

describe('EditAssetModal', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not render when asset is null', () => {
    renderWithClient(
      <EditAssetModal asset={null} isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should not render when closed', () => {
    renderWithClient(
      <EditAssetModal asset={mockAsset} isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should render modal with prefilled form when open', () => {
    renderWithClient(
      <EditAssetModal asset={mockAsset} isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Edit VOO')).toBeInTheDocument()
    expect(screen.getByLabelText('Ticker')).toHaveValue('VOO')
    expect(screen.getByLabelText('Name')).toHaveValue('Vanguard S&P 500 ETF')
  })

  it('should call onClose when cancel is clicked', async () => {
    const user = userEvent.setup()
    renderWithClient(
      <EditAssetModal asset={mockAsset} isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should update asset and call onSuccess on successful submission', async () => {
    const user = userEvent.setup()
    vi.mocked(api.assets.update).mockResolvedValue({
      ...mockAsset,
      name: 'Updated Name',
    })

    renderWithClient(
      <EditAssetModal asset={mockAsset} isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )

    await user.clear(screen.getByLabelText('Name'))
    await user.type(screen.getByLabelText('Name'), 'Updated Name')
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    await waitFor(() => {
      expect(api.assets.update).toHaveBeenCalledWith('asset-1', expect.objectContaining({
        name: 'Updated Name',
      }))
      expect(mockOnClose).toHaveBeenCalled()
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  it('should show error message on failed submission', async () => {
    const user = userEvent.setup()
    vi.mocked(api.assets.update).mockRejectedValue(new Error('Update failed'))

    renderWithClient(
      <EditAssetModal asset={mockAsset} isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )

    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    await waitFor(() => {
      expect(screen.getByText('Update failed')).toBeInTheDocument()
    })
    expect(mockOnClose).not.toHaveBeenCalled()
  })
})
