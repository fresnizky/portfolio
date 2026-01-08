import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AssetForm } from './AssetForm'
import type { Asset } from '@/types/api'

const mockAsset: Asset = {
  id: 'asset-1',
  ticker: 'VOO',
  name: 'Vanguard S&P 500 ETF',
  category: 'ETF',
  targetPercentage: '60.00',
  createdAt: '2026-01-07T00:00:00.000Z',
  updatedAt: '2026-01-07T00:00:00.000Z',
  userId: 'user-1',
}

describe('AssetForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Create Mode (no asset prop)', () => {
    it('should render empty form fields', () => {
      render(<AssetForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      expect(screen.getByLabelText('Ticker')).toHaveValue('')
      expect(screen.getByLabelText('Name')).toHaveValue('')
      expect(screen.getByLabelText('Category')).toHaveValue('ETF')
      expect(screen.getByRole('button', { name: 'Create Asset' })).toBeInTheDocument()
    })

    it('should show validation errors for required fields', async () => {
      const user = userEvent.setup()
      render(<AssetForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      await user.click(screen.getByRole('button', { name: 'Create Asset' }))

      await waitFor(() => {
        expect(screen.getByText('Ticker is required')).toBeInTheDocument()
        expect(screen.getByText('Name is required')).toBeInTheDocument()
      })
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should submit form with valid data', async () => {
      const user = userEvent.setup()
      render(<AssetForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      await user.type(screen.getByLabelText('Ticker'), 'btc')
      await user.type(screen.getByLabelText('Name'), 'Bitcoin')
      await user.selectOptions(screen.getByLabelText('Category'), 'CRYPTO')

      await user.click(screen.getByRole('button', { name: 'Create Asset' }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
        const calledWith = mockOnSubmit.mock.calls[0][0]
        expect(calledWith).toEqual({
          ticker: 'BTC', // uppercase transform
          name: 'Bitcoin',
          category: 'CRYPTO',
        })
      })
    })

    it('should transform ticker to uppercase', async () => {
      const user = userEvent.setup()
      render(<AssetForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      await user.type(screen.getByLabelText('Ticker'), 'voo')
      await user.type(screen.getByLabelText('Name'), 'Test Asset')

      await user.click(screen.getByRole('button', { name: 'Create Asset' }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
        const calledWith = mockOnSubmit.mock.calls[0][0]
        expect(calledWith.ticker).toBe('VOO')
      })
    })
  })

  describe('Edit Mode (with asset prop)', () => {
    it('should render form prefilled with asset data', () => {
      render(<AssetForm asset={mockAsset} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      expect(screen.getByLabelText('Ticker')).toHaveValue('VOO')
      expect(screen.getByLabelText('Name')).toHaveValue('Vanguard S&P 500 ETF')
      expect(screen.getByLabelText('Category')).toHaveValue('ETF')
      expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument()
    })

    it('should submit edited data', async () => {
      const user = userEvent.setup()
      render(<AssetForm asset={mockAsset} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      await user.clear(screen.getByLabelText('Name'))
      await user.type(screen.getByLabelText('Name'), 'Updated Name')

      await user.click(screen.getByRole('button', { name: 'Save Changes' }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
        const calledWith = mockOnSubmit.mock.calls[0][0]
        expect(calledWith.name).toBe('Updated Name')
      })
    })
  })

  describe('Validation', () => {
    it('should show error for ticker too long', async () => {
      const user = userEvent.setup()
      render(<AssetForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      await user.type(screen.getByLabelText('Ticker'), 'A'.repeat(21))
      await user.type(screen.getByLabelText('Name'), 'Test')
      await user.click(screen.getByRole('button', { name: 'Create Asset' }))

      await waitFor(() => {
        expect(screen.getByText('Ticker must be 20 characters or less')).toBeInTheDocument()
      })
    })

    it('should show error for name too long', async () => {
      const user = userEvent.setup()
      render(<AssetForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      await user.type(screen.getByLabelText('Ticker'), 'TEST')
      await user.type(screen.getByLabelText('Name'), 'A'.repeat(101))
      await user.click(screen.getByRole('button', { name: 'Create Asset' }))

      await waitFor(() => {
        expect(screen.getByText('Name must be 100 characters or less')).toBeInTheDocument()
      })
    })

    it('should not include targetPercentage field (managed via TargetEditor)', async () => {
      const user = userEvent.setup()
      render(<AssetForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      await user.type(screen.getByLabelText('Ticker'), 'TEST')
      await user.type(screen.getByLabelText('Name'), 'Test Asset')
      await user.click(screen.getByRole('button', { name: 'Create Asset' }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
        const calledWith = mockOnSubmit.mock.calls[0][0]
        expect(calledWith).not.toHaveProperty('targetPercentage')
      })
    })
  })

  describe('UI States', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<AssetForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('should disable form fields when submitting', () => {
      render(
        <AssetForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting={true}
        />
      )

      expect(screen.getByLabelText('Ticker')).toBeDisabled()
      expect(screen.getByLabelText('Name')).toBeDisabled()
      expect(screen.getByLabelText('Category')).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Create Asset' })).toBeDisabled()
    })

    it('should show loading spinner when submitting', () => {
      render(
        <AssetForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting={true}
        />
      )

      // Check for spinner (svg with animate-spin class)
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('should have all category options', () => {
      render(<AssetForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      const select = screen.getByLabelText('Category')
      expect(select).toContainHTML('<option value="ETF">ETF</option>')
      expect(select).toContainHTML('<option value="FCI">FCI</option>')
      expect(select).toContainHTML('<option value="CRYPTO">Crypto</option>')
      expect(select).toContainHTML('<option value="CASH">Cash</option>')
    })
  })
})
