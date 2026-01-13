import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TransactionSummary } from './TransactionSummary'
import type { Transaction } from '@/types/api'

describe('TransactionSummary', () => {
  /**
   * Mocks using the CORRECT field names that match the real API response.
   * See: backend/src/services/transactionService.ts formatTransaction()
   */
  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      type: 'BUY',
      date: '2026-01-07T12:00:00.000Z',
      quantity: '10',
      price: '150.00',
      commission: '5.00',
      totalCost: '1505.00', // (10 × 150) + 5 = $1,505.00
      assetId: 'asset-1',
      createdAt: '2026-01-07T12:00:00.000Z',
      asset: { ticker: 'VOO', name: 'Vanguard S&P 500 ETF' },
    },
    {
      id: 'tx-2',
      type: 'BUY',
      date: '2026-01-08T12:00:00.000Z',
      quantity: '5',
      price: '450.00',
      commission: '10.00',
      totalCost: '2260.00', // (5 × 450) + 10 = $2,260.00
      assetId: 'asset-2',
      createdAt: '2026-01-08T12:00:00.000Z',
      asset: { ticker: 'BTC', name: 'Bitcoin' },
    },
    {
      id: 'tx-3',
      type: 'SELL',
      date: '2026-01-09T12:00:00.000Z',
      quantity: '3',
      price: '160.00',
      commission: '5.00',
      totalProceeds: '475.00', // (3 × 160) - 5 = $475.00
      assetId: 'asset-1',
      createdAt: '2026-01-09T12:00:00.000Z',
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

  /**
   * CRITICAL: Tests using REAL API response format
   *
   * These tests simulate what the backend actually returns.
   * Backend sends totalCost/totalProceeds as pre-formatted strings, NOT totalCents.
   * See: backend/src/services/transactionService.ts formatTransaction()
   */
  describe('with real API response format', () => {
    // This is what the backend ACTUALLY returns
    const realApiTransactions = [
      {
        id: 'tx-real-1',
        type: 'BUY' as const,
        date: '2026-01-07T12:00:00.000Z',
        quantity: '10',
        price: '150.00',
        commission: '5.00',
        totalCost: '1505.00', // Pre-formatted, NOT cents
        assetId: 'asset-1',
        createdAt: '2026-01-07T12:00:00.000Z',
        asset: { ticker: 'VOO', name: 'Vanguard S&P 500 ETF' },
      },
      {
        id: 'tx-real-2',
        type: 'BUY' as const,
        date: '2026-01-08T12:00:00.000Z',
        quantity: '5',
        price: '450.00',
        commission: '10.00',
        totalCost: '2260.00',
        assetId: 'asset-2',
        createdAt: '2026-01-08T12:00:00.000Z',
        asset: { ticker: 'BTC', name: 'Bitcoin' },
      },
      {
        id: 'tx-real-3',
        type: 'SELL' as const,
        date: '2026-01-09T12:00:00.000Z',
        quantity: '3',
        price: '160.00',
        commission: '5.00',
        totalProceeds: '475.00', // SELL uses totalProceeds, not totalCost
        assetId: 'asset-1',
        createdAt: '2026-01-09T12:00:00.000Z',
        asset: { ticker: 'VOO', name: 'Vanguard S&P 500 ETF' },
      },
    ]

    it('should calculate total invested correctly from real API response', () => {
      render(<TransactionSummary transactions={realApiTransactions as any} />)

      // Should NOT show NaN
      const container = document.body
      expect(container.textContent).not.toContain('NaN')

      // Should show $3,765.00 (1505 + 2260)
      expect(screen.getByText('$3,765.00')).toBeInTheDocument()
    })

    it('should calculate total withdrawn correctly from real API response', () => {
      render(<TransactionSummary transactions={realApiTransactions as any} />)

      // Should NOT show NaN
      expect(document.body.textContent).not.toContain('NaN')

      // Should show $475.00
      expect(screen.getByText('$475.00')).toBeInTheDocument()
    })

    it('should never render NaN for any monetary value', () => {
      render(<TransactionSummary transactions={realApiTransactions as any} />)

      // Get all rendered text
      const allText = document.body.textContent || ''

      expect(allText).not.toContain('NaN')
      expect(allText).not.toContain('undefined')
    })
  })
})
