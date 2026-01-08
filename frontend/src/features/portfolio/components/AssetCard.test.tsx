import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AssetCard } from './AssetCard'
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

describe('AssetCard', () => {
  const mockOnEdit = vi.fn()
  const mockOnDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display asset ticker', () => {
    render(<AssetCard asset={mockAsset} onEdit={mockOnEdit} onDelete={mockOnDelete} />)
    expect(screen.getByText('VOO')).toBeInTheDocument()
  })

  it('should display asset name', () => {
    render(<AssetCard asset={mockAsset} onEdit={mockOnEdit} onDelete={mockOnDelete} />)
    expect(screen.getByText('Vanguard S&P 500 ETF')).toBeInTheDocument()
  })

  it('should display category badge', () => {
    render(<AssetCard asset={mockAsset} onEdit={mockOnEdit} onDelete={mockOnDelete} />)
    const badge = screen.getByText('ETF')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800')
  })

  it('should display target percentage', () => {
    render(<AssetCard asset={mockAsset} onEdit={mockOnEdit} onDelete={mockOnDelete} />)
    expect(screen.getByText('60.0%')).toBeInTheDocument()
  })

  it('should call onEdit when edit button is clicked', async () => {
    const user = userEvent.setup()
    render(<AssetCard asset={mockAsset} onEdit={mockOnEdit} onDelete={mockOnDelete} />)

    await user.click(screen.getByLabelText('Edit VOO'))

    expect(mockOnEdit).toHaveBeenCalledWith(mockAsset)
  })

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup()
    render(<AssetCard asset={mockAsset} onEdit={mockOnEdit} onDelete={mockOnDelete} />)

    await user.click(screen.getByLabelText('Delete VOO'))

    expect(mockOnDelete).toHaveBeenCalledWith(mockAsset)
  })

  it('should apply correct category styles for ETF', () => {
    render(<AssetCard asset={mockAsset} onEdit={mockOnEdit} onDelete={mockOnDelete} />)
    const badge = screen.getByText('ETF')
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800')
  })

  it('should apply correct category styles for CRYPTO', () => {
    const cryptoAsset = { ...mockAsset, category: 'CRYPTO' as const, ticker: 'BTC' }
    render(<AssetCard asset={cryptoAsset} onEdit={mockOnEdit} onDelete={mockOnDelete} />)
    const badge = screen.getByText('CRYPTO')
    expect(badge).toHaveClass('bg-orange-100', 'text-orange-800')
  })

  it('should apply correct category styles for FCI', () => {
    const fciAsset = { ...mockAsset, category: 'FCI' as const, ticker: 'BOND' }
    render(<AssetCard asset={fciAsset} onEdit={mockOnEdit} onDelete={mockOnDelete} />)
    const badge = screen.getByText('FCI')
    expect(badge).toHaveClass('bg-green-100', 'text-green-800')
  })

  it('should apply correct category styles for CASH', () => {
    const cashAsset = { ...mockAsset, category: 'CASH' as const, ticker: 'USD' }
    render(<AssetCard asset={cashAsset} onEdit={mockOnEdit} onDelete={mockOnDelete} />)
    const badge = screen.getByText('CASH')
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800')
  })

  it('should have accessible edit button', () => {
    render(<AssetCard asset={mockAsset} onEdit={mockOnEdit} onDelete={mockOnDelete} />)
    expect(screen.getByLabelText('Edit VOO')).toBeInTheDocument()
  })

  it('should have accessible delete button', () => {
    render(<AssetCard asset={mockAsset} onEdit={mockOnEdit} onDelete={mockOnDelete} />)
    expect(screen.getByLabelText('Delete VOO')).toBeInTheDocument()
  })
})
