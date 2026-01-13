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

  it('should render all transactions', () => {
    render(<TransactionList transactions={mockTransactions} />)
    expect(screen.getByText('VOO')).toBeInTheDocument()
    expect(screen.getByText('BTC')).toBeInTheDocument()
  })

  it('should render empty state when no transactions', () => {
    render(<TransactionList transactions={[]} />)
    expect(screen.getByText('No transactions recorded yet')).toBeInTheDocument()
  })

  it('should render loading skeleton when isLoading is true', () => {
    const { container } = render(<TransactionList transactions={[]} isLoading />)
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBe(3)
  })

  it('should render transactions in a grid', () => {
    const { container } = render(<TransactionList transactions={mockTransactions} />)
    const grid = container.querySelector('.grid')
    expect(grid).toBeInTheDocument()
  })

  it('should not show empty state when loading', () => {
    render(<TransactionList transactions={[]} isLoading />)
    expect(screen.queryByText('No transactions recorded yet')).not.toBeInTheDocument()
  })
})
