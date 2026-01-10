import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PortfolioSummaryCard } from './PortfolioSummaryCard'

describe('PortfolioSummaryCard', () => {
  it('should render total value formatted as currency', () => {
    render(<PortfolioSummaryCard totalValue="10350.50" />)
    expect(screen.getByText('$10,350.50')).toBeInTheDocument()
  })

  it('should render label', () => {
    render(<PortfolioSummaryCard totalValue="10350.50" />)
    expect(screen.getByText('Total Portfolio Value')).toBeInTheDocument()
  })

  it('should handle zero value', () => {
    render(<PortfolioSummaryCard totalValue="0" />)
    expect(screen.getByText('$0.00')).toBeInTheDocument()
  })

  it('should handle large values', () => {
    render(<PortfolioSummaryCard totalValue="1234567.89" />)
    expect(screen.getByText('$1,234,567.89')).toBeInTheDocument()
  })

  it('should show loading state when isLoading is true', () => {
    render(<PortfolioSummaryCard totalValue="0" isLoading />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })
})
