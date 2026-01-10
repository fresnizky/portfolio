import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TransactionFilters } from './TransactionFilters'
import type { Asset, TransactionListFilters } from '@/types/api'

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
    ticker: 'BTC',
    name: 'Bitcoin',
    category: 'CRYPTO',
    targetPercentage: '20.00',
    createdAt: '2026-01-07T00:00:00.000Z',
    updatedAt: '2026-01-07T00:00:00.000Z',
    userId: 'user-1',
  },
]

describe('TransactionFilters', () => {
  const mockOnFiltersChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render all filter controls', () => {
    render(
      <TransactionFilters
        assets={mockAssets}
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    expect(screen.getByLabelText('Asset')).toBeInTheDocument()
    expect(screen.getByLabelText('Type')).toBeInTheDocument()
    expect(screen.getByLabelText('From Date')).toBeInTheDocument()
    expect(screen.getByLabelText('To Date')).toBeInTheDocument()
  })

  it('should render all assets in dropdown', () => {
    render(
      <TransactionFilters
        assets={mockAssets}
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    expect(screen.getByText('All Assets')).toBeInTheDocument()
    expect(screen.getByText('VOO')).toBeInTheDocument()
    expect(screen.getByText('BTC')).toBeInTheDocument()
  })

  it('should call onFiltersChange when asset is selected', async () => {
    const user = userEvent.setup()
    render(
      <TransactionFilters
        assets={mockAssets}
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    await user.selectOptions(screen.getByLabelText('Asset'), 'asset-1')

    expect(mockOnFiltersChange).toHaveBeenCalledWith({ assetId: 'asset-1' })
  })

  it('should call onFiltersChange when type is selected', async () => {
    const user = userEvent.setup()
    render(
      <TransactionFilters
        assets={mockAssets}
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    await user.selectOptions(screen.getByLabelText('Type'), 'buy')

    expect(mockOnFiltersChange).toHaveBeenCalledWith({ type: 'buy' })
  })

  it('should call onFiltersChange when from date is changed', async () => {
    const user = userEvent.setup()
    render(
      <TransactionFilters
        assets={mockAssets}
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    await user.type(screen.getByLabelText('From Date'), '2026-01-01')

    expect(mockOnFiltersChange).toHaveBeenCalledWith({ fromDate: '2026-01-01' })
  })

  it('should call onFiltersChange when to date is changed', async () => {
    const user = userEvent.setup()
    render(
      <TransactionFilters
        assets={mockAssets}
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    await user.type(screen.getByLabelText('To Date'), '2026-01-31')

    expect(mockOnFiltersChange).toHaveBeenCalledWith({ toDate: '2026-01-31' })
  })

  it('should show reset button when filters are active', () => {
    const filters: TransactionListFilters = { assetId: 'asset-1' }
    render(
      <TransactionFilters
        assets={mockAssets}
        filters={filters}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    expect(screen.getByRole('button', { name: 'Reset Filters' })).toBeInTheDocument()
  })

  it('should not show reset button when no filters are active', () => {
    render(
      <TransactionFilters
        assets={mockAssets}
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    expect(screen.queryByRole('button', { name: 'Reset Filters' })).not.toBeInTheDocument()
  })

  it('should reset all filters when reset button is clicked', async () => {
    const user = userEvent.setup()
    const filters: TransactionListFilters = {
      assetId: 'asset-1',
      type: 'buy',
      fromDate: '2026-01-01',
      toDate: '2026-01-31',
    }
    render(
      <TransactionFilters
        assets={mockAssets}
        filters={filters}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Reset Filters' }))

    expect(mockOnFiltersChange).toHaveBeenCalledWith({})
  })

  it('should preserve existing filters when changing one filter', async () => {
    const user = userEvent.setup()
    const filters: TransactionListFilters = { assetId: 'asset-1' }
    render(
      <TransactionFilters
        assets={mockAssets}
        filters={filters}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    await user.selectOptions(screen.getByLabelText('Type'), 'sell')

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      assetId: 'asset-1',
      type: 'sell',
    })
  })
})
