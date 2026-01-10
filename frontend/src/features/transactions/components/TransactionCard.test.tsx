import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TransactionCard } from './TransactionCard'
import type { Transaction } from '@/types/api'

describe('TransactionCard', () => {
  const mockBuyTransaction: Transaction = {
    id: 'tx-1',
    type: 'BUY',
    date: '2026-01-07T00:00:00.000Z',
    quantity: '10.5',
    priceCents: '45075',
    commissionCents: '500',
    totalCents: '473788',
    assetId: 'asset-1',
    userId: 'user-1',
    createdAt: '2026-01-07T12:00:00.000Z',
    updatedAt: '2026-01-07T12:00:00.000Z',
    asset: {
      ticker: 'VOO',
      name: 'Vanguard S&P 500 ETF',
    },
  }

  const mockSellTransaction: Transaction = {
    ...mockBuyTransaction,
    id: 'tx-2',
    type: 'SELL',
    quantity: '5.0',
    totalCents: '225375',
  }

  it('should render ticker and asset name', () => {
    render(<TransactionCard transaction={mockBuyTransaction} />)
    expect(screen.getByText('VOO')).toBeInTheDocument()
    expect(screen.getByText('Vanguard S&P 500 ETF')).toBeInTheDocument()
  })

  it('should render BUY type badge with green styling', () => {
    render(<TransactionCard transaction={mockBuyTransaction} />)
    const badge = screen.getByText('BUY')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-green-100', 'text-green-800')
  })

  it('should render SELL type badge with red styling', () => {
    render(<TransactionCard transaction={mockSellTransaction} />)
    const badge = screen.getByText('SELL')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-red-100', 'text-red-800')
  })

  it('should render formatted date', () => {
    // Use a date at noon UTC to avoid timezone edge cases
    const txWithNoonDate = {
      ...mockBuyTransaction,
      date: '2026-01-07T12:00:00.000Z',
    }
    render(<TransactionCard transaction={txWithNoonDate} />)
    // Date format es-AR: DD/MM/YYYY
    expect(screen.getByText('07/01/2026')).toBeInTheDocument()
  })

  it('should render quantity', () => {
    render(<TransactionCard transaction={mockBuyTransaction} />)
    expect(screen.getByText('10.5')).toBeInTheDocument()
  })

  it('should render price converted from cents', () => {
    render(<TransactionCard transaction={mockBuyTransaction} />)
    // 45075 cents = $450.75
    expect(screen.getByText('$450.75')).toBeInTheDocument()
  })

  it('should render commission converted from cents', () => {
    render(<TransactionCard transaction={mockBuyTransaction} />)
    // 500 cents = $5.00
    expect(screen.getByText('$5.00')).toBeInTheDocument()
  })

  it('should render total cost for BUY transactions', () => {
    render(<TransactionCard transaction={mockBuyTransaction} />)
    expect(screen.getByText('Total Cost')).toBeInTheDocument()
    // 473788 cents = $4,737.88
    expect(screen.getByText('$4,737.88')).toBeInTheDocument()
  })

  it('should render total proceeds for SELL transactions', () => {
    render(<TransactionCard transaction={mockSellTransaction} />)
    expect(screen.getByText('Total Proceeds')).toBeInTheDocument()
    // 225375 cents = $2,253.75
    expect(screen.getByText('$2,253.75')).toBeInTheDocument()
  })

  it('should handle integer quantities without decimals', () => {
    const integerQtyTransaction = { ...mockBuyTransaction, quantity: '10' }
    render(<TransactionCard transaction={integerQtyTransaction} />)
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('should handle zero commission', () => {
    const noCommissionTx = { ...mockBuyTransaction, commissionCents: '0' }
    render(<TransactionCard transaction={noCommissionTx} />)
    expect(screen.getByText('$0.00')).toBeInTheDocument()
  })
})
