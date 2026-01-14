import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TransactionList } from './TransactionList'
import type { Transaction } from '@/types/api'

describe('TransactionList', () => {
  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      type: 'BUY',
      date: '2026-01-07T12:00:00.000Z',
      quantity: '10.5',
      price: '450.75',
      commission: '5.00',
      totalCost: '4737.88',
      assetId: 'asset-1',
      createdAt: '2026-01-07T12:00:00.000Z',
      asset: {
        ticker: 'VOO',
        name: 'Vanguard S&P 500 ETF',
      },
    },
    {
      id: 'tx-2',
      type: 'SELL',
      date: '2026-01-08T12:00:00.000Z',
      quantity: '5.0',
      price: '460.00',
      commission: '5.00',
      totalProceeds: '2295.00',
      assetId: 'asset-2',
      createdAt: '2026-01-08T12:00:00.000Z',
      asset: {
        ticker: 'BTC',
        name: 'Bitcoin',
      },
    },
  ]

  it('should render table with correct columns', () => {
    render(<TransactionList transactions={mockTransactions} />)

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText('Date')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
    expect(screen.getByText('Asset')).toBeInTheDocument()
    expect(screen.getByText('Quantity')).toBeInTheDocument()
    expect(screen.getByText('Price')).toBeInTheDocument()
    expect(screen.getByText('Comm.')).toBeInTheDocument()
    expect(screen.getByText('Total')).toBeInTheDocument()
  })

  it('should render all transactions as table rows', () => {
    render(<TransactionList transactions={mockTransactions} />)
    expect(screen.getByText('VOO')).toBeInTheDocument()
    expect(screen.getByText('BTC')).toBeInTheDocument()
  })

  it('should display transaction data in rows', () => {
    render(<TransactionList transactions={mockTransactions} />)

    // Check tickers
    expect(screen.getByText('VOO')).toBeInTheDocument()
    expect(screen.getByText('BTC')).toBeInTheDocument()

    // Check types
    expect(screen.getByText('BUY')).toBeInTheDocument()
    expect(screen.getByText('SELL')).toBeInTheDocument()
  })

  it('should apply correct styling for BUY transactions', () => {
    render(<TransactionList transactions={[mockTransactions[0]]} />)

    const badge = screen.getByText('BUY')
    expect(badge).toHaveClass('bg-green-100', 'text-green-800')
  })

  it('should apply correct styling for SELL transactions', () => {
    render(<TransactionList transactions={[mockTransactions[1]]} />)

    const badge = screen.getByText('SELL')
    expect(badge).toHaveClass('bg-red-100', 'text-red-800')
  })

  it('should render empty state when no transactions', () => {
    render(<TransactionList transactions={[]} />)
    expect(screen.getByText('No transactions recorded yet')).toBeInTheDocument()
  })

  it('should render loading skeleton when isLoading is true', () => {
    render(<TransactionList transactions={[]} isLoading />)

    // Should show table structure in skeleton
    expect(screen.getByRole('table')).toBeInTheDocument()

    // Should show skeleton animation
    const { container } = render(<TransactionList transactions={[]} isLoading />)
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should not show empty state when loading', () => {
    render(<TransactionList transactions={[]} isLoading />)
    expect(screen.queryByText('No transactions recorded yet')).not.toBeInTheDocument()
  })

  it('should format quantity correctly', () => {
    render(<TransactionList transactions={mockTransactions} />)
    // 10.5 should be displayed
    expect(screen.getByText('10.5')).toBeInTheDocument()
  })

  it('should format currency values correctly', () => {
    render(<TransactionList transactions={mockTransactions} />)
    // Total for BUY should show formatted currency
    expect(screen.getByText('$4,737.88')).toBeInTheDocument()
  })

  it('should have hover state on rows', () => {
    const { container } = render(<TransactionList transactions={mockTransactions} />)
    const rows = container.querySelectorAll('tbody tr')
    rows.forEach((row) => {
      expect(row).toHaveClass('hover:bg-gray-50')
    })
  })
})
