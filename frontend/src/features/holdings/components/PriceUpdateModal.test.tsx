import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PriceUpdateModal } from './PriceUpdateModal'
import type { Position } from '@/types/api'

describe('PriceUpdateModal', () => {
  const mockPosition: Position = {
    assetId: 'asset-1',
    ticker: 'VOO',
    name: 'Vanguard S&P 500 ETF',
    category: 'ETF',
    quantity: '10.5',
    currentPrice: '450.75',
    value: '4732.88',
    targetPercentage: '60.00',
    priceUpdatedAt: '2026-01-08T12:00:00.000Z',
  }

  it('should not render when not open', () => {
    const { container } = render(
      <PriceUpdateModal
        isOpen={false}
        onClose={vi.fn()}
        position={mockPosition}
        onSubmit={vi.fn()}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('should render modal with position info when open', () => {
    render(
      <PriceUpdateModal
        isOpen={true}
        onClose={vi.fn()}
        position={mockPosition}
        onSubmit={vi.fn()}
      />
    )
    expect(screen.getByText('Update Price')).toBeInTheDocument()
    expect(screen.getByText('VOO')).toBeInTheDocument()
  })

  it('should prefill current price in input', () => {
    render(
      <PriceUpdateModal
        isOpen={true}
        onClose={vi.fn()}
        position={mockPosition}
        onSubmit={vi.fn()}
      />
    )
    const input = screen.getByLabelText('New Price') as HTMLInputElement
    expect(input.value).toBe('450.75')
  })

  it('should call onSubmit with new price', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    render(
      <PriceUpdateModal
        isOpen={true}
        onClose={vi.fn()}
        position={mockPosition}
        onSubmit={onSubmit}
      />
    )

    const input = screen.getByLabelText('New Price')
    await user.clear(input)
    await user.type(input, '455.50')

    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('asset-1', 455.50)
    })
  })

  it('should call onClose when cancel is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(
      <PriceUpdateModal
        isOpen={true}
        onClose={onClose}
        position={mockPosition}
        onSubmit={vi.fn()}
      />
    )

    await user.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalled()
  })

  it('should show error for empty price', async () => {
    const user = userEvent.setup()

    render(
      <PriceUpdateModal
        isOpen={true}
        onClose={vi.fn()}
        position={mockPosition}
        onSubmit={vi.fn()}
      />
    )

    const input = screen.getByLabelText('New Price')
    await user.clear(input)

    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => {
      expect(screen.getByText('Price must be greater than 0')).toBeInTheDocument()
    })
  })

  it('should disable submit when loading', () => {
    render(
      <PriceUpdateModal
        isOpen={true}
        onClose={vi.fn()}
        position={mockPosition}
        onSubmit={vi.fn()}
        isLoading={true}
      />
    )

    expect(screen.getByText('Saving...')).toBeDisabled()
  })
})
