import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TransactionSummary } from './TransactionSummary'
import type { Transaction } from '@/types/api'

describe('TransactionSummary', () => {
  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      type: 'BUY',
      date: '2026-01-07T12:00:00.000Z',
      quantity: '10',
      priceCents: '15000',
      commissionCents: '500',
      totalCents: '150500', // $1,505.00
      assetId: 'asset-1',
      userId: 'user-1',
      createdAt: '2026-01-07T12:00:00.000Z',
      updatedAt: '2026-01-07T12:00:00.000Z',
      asset: { ticker: 'VOO', name: 'Vanguard S&P 500 ETF' },
    },
    {
      id: 'tx-2',
      type: 'BUY',
      date: '2026-01-08T12:00:00.000Z',
      quantity: '5',
      priceCents: '45000',
      commissionCents: '1000',
      totalCents: '226000', // $2,260.00
      assetId: 'asset-2',
      userId: 'user-1',
      createdAt: '2026-01-08T12:00:00.000Z',
      updatedAt: '2026-01-08T12:00:00.000Z',
      asset: { ticker: 'BTC', name: 'Bitcoin' },
    },
    {
      id: 'tx-3',
      type: 'SELL',
      date: '2026-01-09T12:00:00.000Z',
      quantity: '3',
      priceCents: '16000',
      commissionCents: '500',
      totalCents: '47500', // $475.00
      assetId: 'asset-1',
      userId: 'user-1',
      createdAt: '2026-01-09T12:00:00.000Z',
      updatedAt: '2026-01-09T12:00:00.000Z',
      asset: { ticker: 'VOO', name: 'Vanguard S&P 500 ETF' },
    },
  ]

  it('should render total invested label', () => {
    render(<TransactionSummary transactions={mockTransactions} />)
    expect(screen.getByText('Total Invested')).toBeInTheDocument()
  })

  it('should render total withdrawn label', () => {
    render(<TransactionSummary transactions={mockTransactions} />)
    expect(screen.getByText('Total Withdrawn')).toBeInTheDocument()
  })

  it('should calculate total invested from BUY transactions', () => {
    render(<TransactionSummary transactions={mockTransactions} />)
    // $1,505.00 + $2,260.00 = $3,765.00
    expect(screen.getByText('$3,765.00')).toBeInTheDocument()
  })

  it('should calculate total withdrawn from SELL transactions', () => {
    render(<TransactionSummary transactions={mockTransactions} />)
    // $475.00
    expect(screen.getByText('$475.00')).toBeInTheDocument()
  })

  it('should show $0.00 for both when no transactions', () => {
    render(<TransactionSummary transactions={[]} />)
    const zeroAmounts = screen.getAllByText('$0.00')
    expect(zeroAmounts).toHaveLength(2)
  })

  it('should show $0.00 for withdrawn when only BUY transactions', () => {
    const buyOnly = mockTransactions.filter((tx) => tx.type === 'BUY')
    render(<TransactionSummary transactions={buyOnly} />)
    expect(screen.getByText('$0.00')).toBeInTheDocument() // withdrawn
    expect(screen.getByText('$3,765.00')).toBeInTheDocument() // invested
  })

  it('should show $0.00 for invested when only SELL transactions', () => {
    const sellOnly = mockTransactions.filter((tx) => tx.type === 'SELL')
    render(<TransactionSummary transactions={sellOnly} />)
    expect(screen.getByText('$0.00')).toBeInTheDocument() // invested
    expect(screen.getByText('$475.00')).toBeInTheDocument() // withdrawn
  })
})
