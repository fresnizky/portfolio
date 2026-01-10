import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PortfolioSummaryCard } from './PortfolioSummaryCard'

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
})
