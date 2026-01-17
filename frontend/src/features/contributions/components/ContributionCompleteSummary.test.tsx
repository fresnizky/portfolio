import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContributionCompleteSummary } from './ContributionCompleteSummary'

describe('ContributionCompleteSummary', () => {
  const mockOnViewTransactions = vi.fn()
  const mockOnClose = vi.fn()

  it('should display completion title', () => {
    render(
      <ContributionCompleteSummary
        totalAmount={1000}
        recordedCount={2}
        skippedCount={0}
        onViewTransactions={mockOnViewTransactions}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText(/aporte registrado/i)).toBeInTheDocument()
  })

  it('should display total amount', () => {
    render(
      <ContributionCompleteSummary
        totalAmount={1000}
        recordedCount={2}
        skippedCount={0}
        onViewTransactions={mockOnViewTransactions}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText(/\$1,000/)).toBeInTheDocument()
  })

  it('should display recorded count', () => {
    render(
      <ContributionCompleteSummary
        totalAmount={1000}
        recordedCount={2}
        skippedCount={0}
        onViewTransactions={mockOnViewTransactions}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText(/2 registradas/i)).toBeInTheDocument()
  })

  it('should display skipped count when present', () => {
    render(
      <ContributionCompleteSummary
        totalAmount={1000}
        recordedCount={1}
        skippedCount={1}
        onViewTransactions={mockOnViewTransactions}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText(/1 omitida/i)).toBeInTheDocument()
  })

  it('should call onViewTransactions when button is clicked', async () => {
    const user = userEvent.setup()

    render(
      <ContributionCompleteSummary
        totalAmount={1000}
        recordedCount={2}
        skippedCount={0}
        onViewTransactions={mockOnViewTransactions}
        onClose={mockOnClose}
      />
    )

    await user.click(screen.getByRole('button', { name: /ver transacciones/i }))

    expect(mockOnViewTransactions).toHaveBeenCalled()
  })

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup()

    render(
      <ContributionCompleteSummary
        totalAmount={1000}
        recordedCount={2}
        skippedCount={0}
        onViewTransactions={mockOnViewTransactions}
        onClose={mockOnClose}
      />
    )

    await user.click(screen.getByRole('button', { name: /cerrar/i }))

    expect(mockOnClose).toHaveBeenCalled()
  })
})
