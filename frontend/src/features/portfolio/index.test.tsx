import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PortfolioPage } from './index'
import { api } from '@/lib/api'
import type { Asset } from '@/types/api'

vi.mock('@/lib/api', () => ({
  api: {
    assets: {
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
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
    targetPercentage: '40.00',
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
  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    ),
    queryClient,
  }
}

describe('PortfolioPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial Load', () => {
    it('should show loading state initially', () => {
      vi.mocked(api.assets.list).mockImplementation(() => new Promise(() => {}))

      renderWithClient(<PortfolioPage />)

      expect(screen.getByText('Portfolio Configuration')).toBeInTheDocument()
      const skeletons = document.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('should show empty state when no assets exist', async () => {
      vi.mocked(api.assets.list).mockResolvedValue([])

      renderWithClient(<PortfolioPage />)

      await waitFor(() => {
        expect(screen.getByText('No assets yet')).toBeInTheDocument()
      })
      expect(screen.getByText('Add Your First Asset')).toBeInTheDocument()
    })

    it('should display assets when loaded', async () => {
      vi.mocked(api.assets.list).mockResolvedValue(mockAssets)

      renderWithClient(<PortfolioPage />)

      await waitFor(() => {
        expect(screen.getByText('VOO')).toBeInTheDocument()
        expect(screen.getByText('BND')).toBeInTheDocument()
      })
    })

    it('should show error state when load fails', async () => {
      vi.mocked(api.assets.list).mockRejectedValue(new Error('Network error'))

      renderWithClient(<PortfolioPage />)

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })
  })

  describe('Create Flow', () => {
    it('should open create modal and create asset successfully', async () => {
      const user = userEvent.setup()
      vi.mocked(api.assets.list).mockResolvedValue([])

      const newAsset: Asset = {
        id: 'new-asset',
        ticker: 'BTC',
        name: 'Bitcoin',
        category: 'CRYPTO',
        targetPercentage: '0.00',
        createdAt: '2026-01-07T00:00:00.000Z',
        updatedAt: '2026-01-07T00:00:00.000Z',
        userId: 'user-1',
      }
      vi.mocked(api.assets.create).mockResolvedValue(newAsset)

      renderWithClient(<PortfolioPage />)

      await waitFor(() => {
        expect(screen.getByText('Add Your First Asset')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Add Your First Asset'))

      // Modal should open
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Add New Asset')).toBeInTheDocument()

      // Fill form (no Target Percentage - managed via TargetEditor)
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
      })
    })
  })

  describe('Edit Flow', () => {
    it('should open edit modal and update asset successfully', async () => {
      const user = userEvent.setup()
      vi.mocked(api.assets.list).mockResolvedValue(mockAssets)
      vi.mocked(api.assets.update).mockResolvedValue({
        ...mockAssets[0],
        name: 'Updated Name',
      })

      renderWithClient(<PortfolioPage />)

      await waitFor(() => {
        expect(screen.getByText('VOO')).toBeInTheDocument()
      })

      // Click edit on first asset
      await user.click(screen.getByLabelText('Edit VOO'))

      // Modal should open with prefilled data
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Edit VOO')).toBeInTheDocument()
      expect(screen.getByLabelText('Name')).toHaveValue('Vanguard S&P 500 ETF')

      // Update name
      await user.clear(screen.getByLabelText('Name'))
      await user.type(screen.getByLabelText('Name'), 'Updated Name')

      await user.click(screen.getByRole('button', { name: 'Save Changes' }))

      await waitFor(() => {
        expect(api.assets.update).toHaveBeenCalledWith('asset-1', expect.objectContaining({
          name: 'Updated Name',
        }))
      })
    })
  })

  describe('Delete Flow', () => {
    it('should open confirmation dialog and delete asset', async () => {
      const user = userEvent.setup()
      vi.mocked(api.assets.list).mockResolvedValue(mockAssets)
      vi.mocked(api.assets.delete).mockResolvedValue(undefined)

      renderWithClient(<PortfolioPage />)

      await waitFor(() => {
        expect(screen.getByText('VOO')).toBeInTheDocument()
      })

      // Click delete on first asset
      await user.click(screen.getByLabelText('Delete VOO'))

      // Confirmation dialog should appear
      expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      expect(screen.getByText('Delete VOO?')).toBeInTheDocument()
      expect(screen.getByText(/cannot be undone/)).toBeInTheDocument()

      // Confirm deletion
      await user.click(screen.getByRole('button', { name: 'Delete' }))

      await waitFor(() => {
        expect(api.assets.delete).toHaveBeenCalledWith('asset-1')
      })
    })

    it('should close dialog when cancel is clicked', async () => {
      const user = userEvent.setup()
      vi.mocked(api.assets.list).mockResolvedValue(mockAssets)

      renderWithClient(<PortfolioPage />)

      await waitFor(() => {
        expect(screen.getByText('VOO')).toBeInTheDocument()
      })

      await user.click(screen.getByLabelText('Delete VOO'))
      expect(screen.getByRole('alertdialog')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      })
      expect(api.assets.delete).not.toHaveBeenCalled()
    })
  })

  describe('Target Editor Flow', () => {
    it('should open target editor and show all assets', async () => {
      const user = userEvent.setup()
      vi.mocked(api.assets.list).mockResolvedValue(mockAssets)

      renderWithClient(<PortfolioPage />)

      await waitFor(() => {
        expect(screen.getByText('VOO')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Edit Targets'))

      // Target editor modal should open
      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()
      expect(within(dialog).getByLabelText('Target percentage for VOO')).toHaveValue(60)
      expect(within(dialog).getByLabelText('Target percentage for BND')).toHaveValue(40)
    })

    it('should prevent save when targets exceed 100%', async () => {
      const user = userEvent.setup()
      vi.mocked(api.assets.list).mockResolvedValue(mockAssets)

      renderWithClient(<PortfolioPage />)

      await waitFor(() => {
        expect(screen.getByText('VOO')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Edit Targets'))

      const dialog = screen.getByRole('dialog')
      const vooInput = within(dialog).getByLabelText('Target percentage for VOO')

      // Change to sum > 100% (80 + 40 = 120)
      await user.clear(vooInput)
      await user.type(vooInput, '80')

      // Save should be disabled when sum exceeds 100%
      const saveButton = within(dialog).getByRole('button', { name: 'Save Targets' })
      expect(saveButton).toBeDisabled()

      // Sum indicator should show error
      expect(within(dialog).getByTestId('sum-value')).toHaveTextContent('Sum: 120%')
    })

    it('should allow save when targets sum to less than 100% (with warning)', async () => {
      const user = userEvent.setup()
      vi.mocked(api.assets.list).mockResolvedValue(mockAssets)
      vi.mocked(api.assets.batchUpdateTargets).mockResolvedValue(mockAssets)

      renderWithClient(<PortfolioPage />)

      await waitFor(() => {
        expect(screen.getByText('VOO')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Edit Targets'))

      const dialog = screen.getByRole('dialog')
      const vooInput = within(dialog).getByLabelText('Target percentage for VOO')

      // Change to sum < 100% (50 + 40 = 90)
      await user.clear(vooInput)
      await user.type(vooInput, '50')

      // Save should be enabled when sum <= 100%
      const saveButton = within(dialog).getByRole('button', { name: 'Save Targets' })
      expect(saveButton).toBeEnabled()

      // Sum indicator should show warning
      expect(within(dialog).getByTestId('sum-value')).toHaveTextContent('Sum: 90%')
      expect(within(dialog).getByText(/Warning.*90%/)).toBeInTheDocument()
    })

    it('should save targets when sum equals 100%', async () => {
      const user = userEvent.setup()
      vi.mocked(api.assets.list).mockResolvedValue(mockAssets)
      vi.mocked(api.assets.batchUpdateTargets).mockResolvedValue(mockAssets)

      renderWithClient(<PortfolioPage />)

      await waitFor(() => {
        expect(screen.getByText('VOO')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Edit Targets'))

      const dialog = screen.getByRole('dialog')
      const vooInput = within(dialog).getByLabelText('Target percentage for VOO')
      const bndInput = within(dialog).getByLabelText('Target percentage for BND')

      // Change to valid sum (55 + 45 = 100)
      await user.clear(vooInput)
      await user.type(vooInput, '55')
      await user.clear(bndInput)
      await user.type(bndInput, '45')

      const saveButton = within(dialog).getByRole('button', { name: 'Save Targets' })
      expect(saveButton).toBeEnabled()

      await user.click(saveButton)

      await waitFor(() => {
        expect(api.assets.batchUpdateTargets).toHaveBeenCalledWith({
          targets: expect.arrayContaining([
            { assetId: 'asset-1', targetPercentage: 55 },
            { assetId: 'asset-2', targetPercentage: 45 },
          ]),
        })
      })
    })
  })

  describe('Error Handling', () => {
    it('should show error message when create fails', async () => {
      const user = userEvent.setup()
      vi.mocked(api.assets.list).mockResolvedValue([])
      vi.mocked(api.assets.create).mockRejectedValue(new Error('Ticker already exists'))

      renderWithClient(<PortfolioPage />)

      await waitFor(() => {
        expect(screen.getByText('Add Your First Asset')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Add Your First Asset'))
      await user.type(screen.getByLabelText('Ticker'), 'VOO')
      await user.type(screen.getByLabelText('Name'), 'Duplicate')
      await user.click(screen.getByRole('button', { name: 'Create Asset' }))

      await waitFor(() => {
        expect(screen.getByText('Ticker already exists')).toBeInTheDocument()
      })
    })

    it('should show error message when update fails', async () => {
      const user = userEvent.setup()
      vi.mocked(api.assets.list).mockResolvedValue(mockAssets)
      vi.mocked(api.assets.update).mockRejectedValue(new Error('Update failed'))

      renderWithClient(<PortfolioPage />)

      await waitFor(() => {
        expect(screen.getByText('VOO')).toBeInTheDocument()
      })

      await user.click(screen.getByLabelText('Edit VOO'))
      await user.click(screen.getByRole('button', { name: 'Save Changes' }))

      await waitFor(() => {
        expect(screen.getByText('Update failed')).toBeInTheDocument()
      })
    })
  })

  describe('Target Sum Indicator', () => {
    it('should show green indicator when targets sum to 100%', async () => {
      vi.mocked(api.assets.list).mockResolvedValue(mockAssets)

      renderWithClient(<PortfolioPage />)

      await waitFor(() => {
        expect(screen.getByText('VOO')).toBeInTheDocument()
      })

      const indicator = screen.getByRole('status')
      expect(indicator).toHaveClass('text-green-600')
      expect(screen.getByTestId('sum-value')).toHaveTextContent('Sum: 100%')
    })

    it('should show red indicator when targets do not sum to 100%', async () => {
      const invalidAssets: Asset[] = [
        { ...mockAssets[0], targetPercentage: '50.00' },
        { ...mockAssets[1], targetPercentage: '30.00' },
      ]
      vi.mocked(api.assets.list).mockResolvedValue(invalidAssets)

      renderWithClient(<PortfolioPage />)

      await waitFor(() => {
        expect(screen.getByText('VOO')).toBeInTheDocument()
      })

      const indicator = screen.getByRole('status')
      expect(indicator).toHaveClass('text-red-600')
      expect(screen.getByTestId('sum-value')).toHaveTextContent('Sum: 80%')
    })
  })
})
