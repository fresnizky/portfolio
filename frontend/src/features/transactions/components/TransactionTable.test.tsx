import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TransactionTable } from './TransactionTable'
import type { Transaction } from '@/types/api'

describe('TransactionTable', () => {
  const buyTransaction: Transaction = {
    id: 'tx-1',
    type: 'BUY',
    date: '2026-01-10T12:00:00.000Z',
    quantity: '10',
    price: '450.00',
    commission: '5.00',
    totalCost: '4505.00',
    assetId: 'asset-1',
    createdAt: '2026-01-10T12:00:00.000Z',
    asset: {
      ticker: 'VOO',
      name: 'Vanguard S&P 500 ETF',
    },
  }

  const sellTransaction: Transaction = {
    id: 'tx-2',
    type: 'SELL',
    date: '2026-01-08T12:00:00.000Z',
    quantity: '0.5',
    price: '95000.00',
    commission: '10.00',
    totalProceeds: '47490.00',
    assetId: 'asset-2',
    createdAt: '2026-01-08T12:00:00.000Z',
    asset: {
      ticker: 'BTC',
      name: 'Bitcoin',
    },
  }

  const mockTransactions: Transaction[] = [buyTransaction, sellTransaction]

  describe('Table Structure', () => {
    it('renders a semantic table element', () => {
      render(<TransactionTable transactions={mockTransactions} />)
      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('renders correct column headers', () => {
      render(<TransactionTable transactions={mockTransactions} />)

      expect(screen.getByText('Date')).toBeInTheDocument()
      expect(screen.getByText('Type')).toBeInTheDocument()
      expect(screen.getByText('Asset')).toBeInTheDocument()
      expect(screen.getByText('Quantity')).toBeInTheDocument()
      expect(screen.getByText('Price')).toBeInTheDocument()
      expect(screen.getByText('Comm.')).toBeInTheDocument()
      expect(screen.getByText('Total')).toBeInTheDocument()
    })

    it('renders table header as sticky', () => {
      const { container } = render(<TransactionTable transactions={mockTransactions} />)
      const thead = container.querySelector('thead')
      expect(thead).toHaveClass('sticky', 'top-0')
    })

    it('renders correct number of rows', () => {
      const { container } = render(<TransactionTable transactions={mockTransactions} />)
      const rows = container.querySelectorAll('tbody tr')
      expect(rows).toHaveLength(2)
    })
  })

  describe('BUY Transaction Display (AC #2)', () => {
    it('displays green badge for BUY type', () => {
      render(<TransactionTable transactions={[buyTransaction]} />)

      const badge = screen.getByText('BUY')
      expect(badge).toHaveClass('bg-green-100', 'text-green-800')
    })

    it('displays totalCost as Total', () => {
      render(<TransactionTable transactions={[buyTransaction]} />)

      // Total column header says "Total"
      expect(screen.getByText('Total')).toBeInTheDocument()
      // Total value shows cost
      expect(screen.getByText('$4,505.00')).toBeInTheDocument()
    })
  })

  describe('SELL Transaction Display (AC #3)', () => {
    it('displays red badge for SELL type', () => {
      render(<TransactionTable transactions={[sellTransaction]} />)

      const badge = screen.getByText('SELL')
      expect(badge).toHaveClass('bg-red-100', 'text-red-800')
    })

    it('displays totalProceeds as Total', () => {
      render(<TransactionTable transactions={[sellTransaction]} />)

      // Total value shows proceeds
      expect(screen.getByText('$47,490.00')).toBeInTheDocument()
    })
  })

  describe('Column Formatting', () => {
    it('shows only ticker, not full name', () => {
      render(<TransactionTable transactions={[buyTransaction]} />)

      expect(screen.getByText('VOO')).toBeInTheDocument()
      expect(screen.queryByText('Vanguard S&P 500 ETF')).not.toBeInTheDocument()
    })

    it('formats quantity correctly for whole numbers', () => {
      render(<TransactionTable transactions={[buyTransaction]} />)
      expect(screen.getByText('10')).toBeInTheDocument()
    })

    it('formats quantity correctly for decimals', () => {
      render(<TransactionTable transactions={[sellTransaction]} />)
      expect(screen.getByText('0.5')).toBeInTheDocument()
    })

    it('formats price as currency', () => {
      render(<TransactionTable transactions={[buyTransaction]} />)
      expect(screen.getByText('$450.00')).toBeInTheDocument()
    })

    it('formats commission as currency', () => {
      render(<TransactionTable transactions={[buyTransaction]} />)
      expect(screen.getByText('$5.00')).toBeInTheDocument()
    })

    it('formats date in short format (dd/mm/yy)', () => {
      render(<TransactionTable transactions={[buyTransaction]} />)
      // Date should be formatted as short date (es-AR locale: 10/01/26)
      expect(screen.getByText('10/01/26')).toBeInTheDocument()
    })
  })

  describe('Hover State (AC #8)', () => {
    it('applies hover styles to rows', () => {
      const { container } = render(<TransactionTable transactions={mockTransactions} />)
      const rows = container.querySelectorAll('tbody tr')

      rows.forEach((row) => {
        expect(row).toHaveClass('hover:bg-gray-50')
        expect(row).toHaveClass('transition-colors')
      })
    })
  })

  describe('Responsive Behavior (AC #4)', () => {
    it('has horizontal scroll wrapper', () => {
      const { container } = render(<TransactionTable transactions={mockTransactions} />)
      const wrapper = container.querySelector('.overflow-x-auto')
      expect(wrapper).toBeInTheDocument()
    })

    it('hides Price and Commission columns on mobile', () => {
      const { container } = render(<TransactionTable transactions={mockTransactions} />)

      // Price header
      const priceHeader = screen.getByText('Price').closest('th')
      expect(priceHeader).toHaveClass('hidden', 'md:table-cell')

      // Commission header
      const commHeader = screen.getByText('Comm.').closest('th')
      expect(commHeader).toHaveClass('hidden', 'md:table-cell')

      // Price cells in body
      const priceCells = container.querySelectorAll('tbody td:nth-child(5)')
      priceCells.forEach((cell) => {
        expect(cell).toHaveClass('hidden', 'md:table-cell')
      })

      // Commission cells in body
      const commCells = container.querySelectorAll('tbody td:nth-child(6)')
      commCells.forEach((cell) => {
        expect(cell).toHaveClass('hidden', 'md:table-cell')
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles crypto with high decimal precision', () => {
      const cryptoTransaction: Transaction = {
        id: 'tx-3',
        type: 'BUY',
        date: '2026-01-05T12:00:00.000Z',
        quantity: '0.00123456',
        price: '95000.00',
        commission: '1.00',
        totalCost: '117.86',
        assetId: 'asset-3',
        createdAt: '2026-01-05T12:00:00.000Z',
        asset: {
          ticker: 'BTC',
          name: 'Bitcoin',
        },
      }

      render(<TransactionTable transactions={[cryptoTransaction]} />)
      expect(screen.getByText('0.00123456')).toBeInTheDocument()
    })

    it('handles zero commission', () => {
      const zeroCommTransaction: Transaction = {
        ...buyTransaction,
        id: 'tx-4',
        commission: '0.00',
        totalCost: '4500.00',
      }

      render(<TransactionTable transactions={[zeroCommTransaction]} />)
      expect(screen.getByText('$0.00')).toBeInTheDocument()
    })

    it('handles large values', () => {
      const largeTransaction: Transaction = {
        ...sellTransaction,
        id: 'tx-5',
        totalProceeds: '1234567.89',
      }

      render(<TransactionTable transactions={[largeTransaction]} />)
      expect(screen.getByText('$1,234,567.89')).toBeInTheDocument()
    })
  })
})
