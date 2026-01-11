import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PortfolioSummaryCard } from './PortfolioSummaryCard'

vi.mock('@/lib/api', () => ({
  api: {
    exchangeRates: {
      getCurrent: vi.fn(),
    },
  },
}))

describe('PortfolioSummaryCard', () => {
  it('should display formatted total value', () => {
    render(<PortfolioSummaryCard totalValue="10000.00" />)
    expect(screen.getByText('$10,000.00')).toBeInTheDocument()
  })

  it('should show loading skeleton when isLoading=true', () => {
    render(<PortfolioSummaryCard totalValue="0" isLoading />)
    expect(screen.getByTestId('summary-skeleton')).toBeInTheDocument()
    expect(screen.queryByText('$0.00')).not.toBeInTheDocument()
  })

  it('should handle zero value', () => {
    render(<PortfolioSummaryCard totalValue="0" />)
    expect(screen.getByText('$0.00')).toBeInTheDocument()
  })

  it('should display title', () => {
    render(<PortfolioSummaryCard totalValue="5000.00" />)
    expect(screen.getByText('Total Portfolio Value')).toBeInTheDocument()
  })

  it('should handle large values with proper formatting', () => {
    render(<PortfolioSummaryCard totalValue="1234567.89" />)
    expect(screen.getByText('$1,234,567.89')).toBeInTheDocument()
  })

  it('should format value in ARS when displayCurrency is ARS', () => {
    render(<PortfolioSummaryCard totalValue="1500.00" displayCurrency="ARS" />)
    // ARS format may use non-breaking space
    expect(screen.getByText(/ARS\s*1,500\.00/)).toBeInTheDocument()
  })

  it('should display exchange rate indicator when exchangeRate is provided', () => {
    const exchangeRate = {
      usdToArs: 1050.50,
      fetchedAt: new Date().toISOString(),
      isStale: false,
    }
    render(
      <PortfolioSummaryCard
        totalValue="10000.00"
        exchangeRate={exchangeRate}
      />
    )
    expect(screen.getByTestId('exchange-rate-indicator')).toBeInTheDocument()
    expect(screen.getByText('USD/ARS: $1050.50')).toBeInTheDocument()
  })

  it('should hide exchange rate indicator when exchangeRate is null', () => {
    render(
      <PortfolioSummaryCard
        totalValue="10000.00"
        exchangeRate={null}
      />
    )
    expect(screen.queryByTestId('exchange-rate-indicator')).not.toBeInTheDocument()
  })
})
