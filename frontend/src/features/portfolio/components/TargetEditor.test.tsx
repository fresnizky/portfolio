import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TargetEditor } from './TargetEditor'
import { api } from '@/lib/api'
import type { Asset } from '@/types/api'

vi.mock('@/lib/api', () => ({
  api: {
    assets: {
      batchUpdateTargets: vi.fn(),
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
    ticker: 'BND',
    name: 'Vanguard Total Bond ETF',
    category: 'ETF',
    targetPercentage: '30.00',
    createdAt: '2026-01-07T00:00:00.000Z',
    updatedAt: '2026-01-07T00:00:00.000Z',
    userId: 'user-1',
  },
  {
    id: 'asset-3',
    ticker: 'CASH',
    name: 'Cash Reserve',
    category: 'CASH',
    targetPercentage: '10.00',
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
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}

describe('TargetEditor', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display all assets with their current targets', () => {
    renderWithClient(
      <TargetEditor assets={mockAssets} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )

    expect(screen.getByText('VOO')).toBeInTheDocument()
    expect(screen.getByText('BND')).toBeInTheDocument()
    expect(screen.getByLabelText('Target percentage for VOO')).toHaveValue(60)
    expect(screen.getByLabelText('Target percentage for BND')).toHaveValue(30)
  })

  it('should show TargetSumIndicator with current sum', () => {
    renderWithClient(
      <TargetEditor assets={mockAssets} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )

    expect(screen.getByTestId('sum-value')).toHaveTextContent('Sum: 100%')
  })

  it('should update sum in real-time when changing targets', async () => {
    const user = userEvent.setup()
    renderWithClient(
      <TargetEditor assets={mockAssets} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )

    const vooInput = screen.getByLabelText('Target percentage for VOO')
    await user.clear(vooInput)
    await user.type(vooInput, '50')

    expect(screen.getByTestId('sum-value')).toHaveTextContent('Sum: 90%')
  })

  it('should disable save button when sum is not 100%', async () => {
    const user = userEvent.setup()
    renderWithClient(
      <TargetEditor assets={mockAssets} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )

    const vooInput = screen.getByLabelText('Target percentage for VOO')
    await user.clear(vooInput)
    await user.type(vooInput, '50')

    expect(screen.getByRole('button', { name: 'Save Targets' })).toBeDisabled()
  })

  it('should disable save button when no changes made', () => {
    renderWithClient(
      <TargetEditor assets={mockAssets} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )

    // Sum is 100% but no changes made
    expect(screen.getByRole('button', { name: 'Save Targets' })).toBeDisabled()
  })

  it('should enable save button when sum is 100% and changes made', async () => {
    const user = userEvent.setup()
    renderWithClient(
      <TargetEditor assets={mockAssets} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )

    // Change VOO from 60 to 55
    const vooInput = screen.getByLabelText('Target percentage for VOO')
    await user.clear(vooInput)
    await user.type(vooInput, '55')

    // Change BND from 30 to 35 to keep sum at 100
    const bndInput = screen.getByLabelText('Target percentage for BND')
    await user.clear(bndInput)
    await user.type(bndInput, '35')

    expect(screen.getByTestId('sum-value')).toHaveTextContent('Sum: 100%')
    expect(screen.getByRole('button', { name: 'Save Targets' })).toBeEnabled()
  })

  it('should call batchUpdateTargets and close on successful save', async () => {
    const user = userEvent.setup()
    vi.mocked(api.assets.batchUpdateTargets).mockResolvedValue(mockAssets)

    renderWithClient(
      <TargetEditor assets={mockAssets} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )

    // Make a change that keeps sum at 100
    const vooInput = screen.getByLabelText('Target percentage for VOO')
    await user.clear(vooInput)
    await user.type(vooInput, '55')

    const bndInput = screen.getByLabelText('Target percentage for BND')
    await user.clear(bndInput)
    await user.type(bndInput, '35')

    await user.click(screen.getByRole('button', { name: 'Save Targets' }))

    await waitFor(() => {
      expect(api.assets.batchUpdateTargets).toHaveBeenCalledWith({
        targets: expect.arrayContaining([
          { assetId: 'asset-1', targetPercentage: 55 },
          { assetId: 'asset-2', targetPercentage: 35 },
          { assetId: 'asset-3', targetPercentage: 10 },
        ]),
      })
      expect(mockOnClose).toHaveBeenCalled()
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  it('should show error message on failed save', async () => {
    const user = userEvent.setup()
    vi.mocked(api.assets.batchUpdateTargets).mockRejectedValue(new Error('Save failed'))

    renderWithClient(
      <TargetEditor assets={mockAssets} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )

    // Make a change
    const vooInput = screen.getByLabelText('Target percentage for VOO')
    await user.clear(vooInput)
    await user.type(vooInput, '55')

    const bndInput = screen.getByLabelText('Target percentage for BND')
    await user.clear(bndInput)
    await user.type(bndInput, '35')

    await user.click(screen.getByRole('button', { name: 'Save Targets' }))

    await waitFor(() => {
      expect(screen.getByText('Save failed')).toBeInTheDocument()
    })
    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it('should call onClose when cancel is clicked', async () => {
    const user = userEvent.setup()
    renderWithClient(
      <TargetEditor assets={mockAssets} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should display category badges for each asset', () => {
    renderWithClient(
      <TargetEditor assets={mockAssets} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )

    const etfBadges = screen.getAllByText('ETF')
    expect(etfBadges.length).toBe(2) // VOO and BND
    // CASH appears both as ticker and category badge
    const cashElements = screen.getAllByText('CASH')
    expect(cashElements.length).toBe(2)
  })
})
