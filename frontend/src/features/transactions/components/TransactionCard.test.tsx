import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TransactionCard } from './TransactionCard'
import type { Transaction } from '@/types/api'

describe('TransactionCard', () => {
  /**
   * Mocks using the CORRECT field names that match the real API response.
   * See: backend/src/services/transactionService.ts formatTransaction()
   */
  const mockBuyTransaction: Transaction = {
    id: 'tx-1',
    type: 'BUY',
    date: '2026-01-07T00:00:00.000Z',
    quantity: '10.5',
    price: '450.75',
    commission: '5.00',
    totalCost: '4737.88', // (10.5 × 450.75) + 5.00
    assetId: 'asset-1',
    createdAt: '2026-01-07T12:00:00.000Z',
    asset: {
      ticker: 'VOO',
      name: 'Vanguard S&P 500 ETF',
    },
  }

  const mockSellTransaction: Transaction = {
    id: 'tx-2',
    type: 'SELL',
    date: '2026-01-07T00:00:00.000Z',
    quantity: '5.0',
    price: '450.75',
    commission: '5.00',
    totalProceeds: '2253.75', // (5.0 × 450.75) - 5.00
    assetId: 'asset-1',
    createdAt: '2026-01-07T12:00:00.000Z',
    asset: {
      ticker: 'VOO',
      name: 'Vanguard S&P 500 ETF',
    },
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

  it('should render price', () => {
    render(<TransactionCard transaction={mockBuyTransaction} />)
    expect(screen.getByText('$450.75')).toBeInTheDocument()
  })

  it('should render commission', () => {
    render(<TransactionCard transaction={mockBuyTransaction} />)
    expect(screen.getByText('$5.00')).toBeInTheDocument()
  })

  it('should render total cost for BUY transactions', () => {
    render(<TransactionCard transaction={mockBuyTransaction} />)
    expect(screen.getByText('Total Cost')).toBeInTheDocument()
    expect(screen.getByText('$4,737.88')).toBeInTheDocument()
  })

  it('should render total proceeds for SELL transactions', () => {
    render(<TransactionCard transaction={mockSellTransaction} />)
    expect(screen.getByText('Total Proceeds')).toBeInTheDocument()
    expect(screen.getByText('$2,253.75')).toBeInTheDocument()
  })

  it('should handle integer quantities without decimals', () => {
    const integerQtyTransaction = { ...mockBuyTransaction, quantity: '10' }
    render(<TransactionCard transaction={integerQtyTransaction} />)
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('should handle zero commission', () => {
    const noCommissionTx = { ...mockBuyTransaction, commission: '0.00' }
    render(<TransactionCard transaction={noCommissionTx} />)
    expect(screen.getByText('$0.00')).toBeInTheDocument()
  })

  /**
   * CRITICAL: Tests using REAL API response format
   *
   * These tests simulate what the backend actually returns.
   * They SHOULD PASS after fixing the type mismatch bug.
   * They WILL FAIL with current implementation (showing $NaN).
   */
  describe('with real API response format', () => {
    // This is what the backend ACTUALLY returns (see transactionService.ts)
    const realApiResponse = {
      id: 'tx-real-1',
      type: 'BUY' as const,
      date: '2026-01-07T12:00:00.000Z',
      quantity: '10',
      // Backend returns pre-formatted values, NOT cents
      price: '450.75',
      commission: '5.00',
      totalCost: '4512.50', // (10 × 450.75) + 5.00
      assetId: 'asset-1',
      createdAt: '2026-01-07T12:00:00.000Z',
      asset: {
        ticker: 'VOO',
        name: 'Vanguard S&P 500 ETF',
      },
    }

    it('should display price correctly from real API response', () => {
      // Using 'as any' to bypass TypeScript - this simulates the runtime mismatch
      render(<TransactionCard transaction={realApiResponse as any} />)

      // Should show $450.75, NOT $NaN
      expect(screen.queryByText('$NaN')).not.toBeInTheDocument()
      expect(screen.getByText('$450.75')).toBeInTheDocument()
    })

    it('should display commission correctly from real API response', () => {
      render(<TransactionCard transaction={realApiResponse as any} />)

      // Should show $5.00, NOT $NaN
      expect(screen.queryByText('$NaN')).not.toBeInTheDocument()
      expect(screen.getByText('$5.00')).toBeInTheDocument()
    })

    it('should display total cost correctly from real API response', () => {
      render(<TransactionCard transaction={realApiResponse as any} />)

      // Should show $4,512.50, NOT $NaN
      expect(screen.queryByText('$NaN')).not.toBeInTheDocument()
      expect(screen.getByText('$4,512.50')).toBeInTheDocument()
    })

    it('should never render NaN for any monetary value', () => {
      render(<TransactionCard transaction={realApiResponse as any} />)

      // Get all text content and verify no NaN anywhere
      const container = screen.getByText('VOO').closest('div')?.parentElement
      expect(container?.textContent).not.toContain('NaN')
      expect(container?.textContent).not.toContain('undefined')
    })

    it('should handle SELL transaction from real API response', () => {
      const sellResponse = {
        ...realApiResponse,
        id: 'tx-real-2',
        type: 'SELL' as const,
        quantity: '5',
        price: '125.50',
        commission: '2.50',
        totalCost: undefined, // SELL doesn't have totalCost
        totalProceeds: '625.00', // (5 × 125.50) - 2.50
      }

      render(<TransactionCard transaction={sellResponse as any} />)

      expect(screen.queryByText('$NaN')).not.toBeInTheDocument()
      expect(screen.getByText('$125.50')).toBeInTheDocument()
      expect(screen.getByText('$625.00')).toBeInTheDocument()
    })
  })
})
