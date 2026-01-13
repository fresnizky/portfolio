import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TransactionForm } from './TransactionForm'
import type { Asset } from '@/types/api'

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

describe('TransactionForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render form fields with default values', () => {
    render(
      <TransactionForm
        assets={mockAssets}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByLabelText('Type')).toHaveValue('buy')
    expect(screen.getByLabelText('Asset')).toHaveValue('')
    expect(screen.getByLabelText('Date')).toBeInTheDocument()
    expect(screen.getByLabelText('Quantity')).toHaveValue(0)
    expect(screen.getByLabelText(/Price per unit/)).toHaveValue(0)
    expect(screen.getByLabelText(/Commission/)).toHaveValue(0)
  })

  it('should render all assets in dropdown', () => {
    render(
      <TransactionForm
        assets={mockAssets}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText('Select an asset')).toBeInTheDocument()
    expect(screen.getByText('VOO - Vanguard S&P 500 ETF')).toBeInTheDocument()
    expect(screen.getByText('BTC - Bitcoin')).toBeInTheDocument()
  })

  it('should show validation errors for required fields', async () => {
    const user = userEvent.setup()
    render(
      <TransactionForm
        assets={mockAssets}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    // Default values are 0, which should trigger positive validation errors
    await user.click(screen.getByRole('button', { name: 'Record Transaction' }))

    await waitFor(() => {
      expect(screen.getByText('Asset is required')).toBeInTheDocument()
      // Quantity and price default to 0, which is not positive
      expect(screen.getByText('Quantity must be greater than 0')).toBeInTheDocument()
      expect(screen.getByText('Price must be greater than 0')).toBeInTheDocument()
    })
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('should submit form with valid BUY transaction data and convert date to ISO 8601', async () => {
    const user = userEvent.setup()
    render(
      <TransactionForm
        assets={mockAssets}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    await user.selectOptions(screen.getByLabelText('Type'), 'buy')
    await user.selectOptions(screen.getByLabelText('Asset'), 'asset-1')
    await user.clear(screen.getByLabelText('Date'))
    await user.type(screen.getByLabelText('Date'), '2026-01-07')
    await user.type(screen.getByLabelText('Quantity'), '10')
    await user.type(screen.getByLabelText(/Price per unit/), '150')
    await user.clear(screen.getByLabelText(/Commission/))
    await user.type(screen.getByLabelText(/Commission/), '5')

    await user.click(screen.getByRole('button', { name: 'Record Transaction' }))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled()
      const calledWith = mockOnSubmit.mock.calls[0][0]
      expect(calledWith).toEqual({
        type: 'buy',
        assetId: 'asset-1',
        date: '2026-01-07T00:00:00.000Z', // Form should convert YYYY-MM-DD to ISO 8601
        quantity: 10,
        price: 150,
        commission: 5,
      })
    })
  })

  it('should convert date input (YYYY-MM-DD) to ISO 8601 format on submit', async () => {
    const user = userEvent.setup()
    render(
      <TransactionForm
        assets={mockAssets}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    await user.selectOptions(screen.getByLabelText('Asset'), 'asset-1')
    await user.clear(screen.getByLabelText('Date'))
    await user.type(screen.getByLabelText('Date'), '2026-12-25')
    await user.type(screen.getByLabelText('Quantity'), '5')
    await user.type(screen.getByLabelText(/Price per unit/), '100')

    await user.click(screen.getByRole('button', { name: 'Record Transaction' }))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled()
      const calledWith = mockOnSubmit.mock.calls[0][0]
      // Verify date is converted from YYYY-MM-DD to ISO 8601 UTC format
      expect(calledWith.date).toBe('2026-12-25T00:00:00.000Z')
    })
  })

  it('should submit form with valid SELL transaction data and ISO 8601 date', async () => {
    const user = userEvent.setup()
    render(
      <TransactionForm
        assets={mockAssets}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    await user.selectOptions(screen.getByLabelText('Type'), 'sell')
    await user.selectOptions(screen.getByLabelText('Asset'), 'asset-2')
    await user.clear(screen.getByLabelText('Date'))
    await user.type(screen.getByLabelText('Date'), '2026-01-08')
    await user.type(screen.getByLabelText('Quantity'), '5.5')
    await user.type(screen.getByLabelText(/Price per unit/), '45000')

    await user.click(screen.getByRole('button', { name: 'Record Transaction' }))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled()
      const calledWith = mockOnSubmit.mock.calls[0][0]
      expect(calledWith.type).toBe('sell')
      expect(calledWith.assetId).toBe('asset-2')
      expect(calledWith.quantity).toBe(5.5)
      expect(calledWith.date).toBe('2026-01-08T00:00:00.000Z') // ISO 8601 format
    })
  })

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <TransactionForm
        assets={mockAssets}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('should disable form when isSubmitting is true', () => {
    render(
      <TransactionForm
        assets={mockAssets}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting
      />
    )

    expect(screen.getByLabelText('Type')).toBeDisabled()
    expect(screen.getByLabelText('Asset')).toBeDisabled()
    expect(screen.getByLabelText('Date')).toBeDisabled()
    expect(screen.getByLabelText('Quantity')).toBeDisabled()
    expect(screen.getByLabelText(/Price per unit/)).toBeDisabled()
    expect(screen.getByLabelText(/Commission/)).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
  })

  it('should show spinner when isSubmitting is true', () => {
    const { container } = render(
      <TransactionForm
        assets={mockAssets}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting
      />
    )

    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('should not submit with zero quantity', async () => {
    const user = userEvent.setup()
    render(
      <TransactionForm
        assets={mockAssets}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    await user.selectOptions(screen.getByLabelText('Asset'), 'asset-1')
    // Leave quantity at 0 (default), type valid price
    await user.clear(screen.getByLabelText(/Price per unit/))
    await user.type(screen.getByLabelText(/Price per unit/), '100')

    await user.click(screen.getByRole('button', { name: 'Record Transaction' }))

    await waitFor(() => {
      expect(screen.getByText('Quantity must be greater than 0')).toBeInTheDocument()
    })
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('should show error for negative commission', async () => {
    const user = userEvent.setup()
    render(
      <TransactionForm
        assets={mockAssets}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    await user.selectOptions(screen.getByLabelText('Asset'), 'asset-1')
    await user.type(screen.getByLabelText('Quantity'), '10')
    await user.type(screen.getByLabelText(/Price per unit/), '100')
    await user.clear(screen.getByLabelText(/Commission/))
    await user.type(screen.getByLabelText(/Commission/), '-5')

    await user.click(screen.getByRole('button', { name: 'Record Transaction' }))

    await waitFor(() => {
      expect(screen.getByText('Commission cannot be negative')).toBeInTheDocument()
    })
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })
})
