import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AllocationTable } from './AllocationTable'
import type { ContributionAllocation } from '@/types/api'

const mockAllocations: ContributionAllocation[] = [
  {
    assetId: 'asset-1',
    ticker: 'VOO',
    name: 'Vanguard S&P 500 ETF',
    targetPercentage: '60.00',
    actualPercentage: '55.00',
    deviation: '-5.00',
    baseAllocation: '600.00',
    adjustedAllocation: '650.00',
    adjustmentReason: 'underweight',
  },
  {
    assetId: 'asset-2',
    ticker: 'BTC',
    name: 'Bitcoin',
    targetPercentage: '40.00',
    actualPercentage: '45.00',
    deviation: '5.00',
    baseAllocation: '400.00',
    adjustedAllocation: '350.00',
    adjustmentReason: 'overweight',
  },
]

const mockSummary = {
  totalAdjusted: '1000.00',
  underweightCount: 1,
  overweightCount: 1,
  balancedCount: 0,
}

describe('AllocationTable', () => {
  const mockOnAllocationChange = vi.fn()
  const mockOnReset = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render all allocations', () => {
    render(
      <AllocationTable
        allocations={mockAllocations}
        originalAllocations={mockAllocations}
        summary={mockSummary}
        displayCurrency="USD"
        onAllocationChange={mockOnAllocationChange}
        onReset={mockOnReset}
      />
    )

    // Both desktop and mobile views render the content
    expect(screen.getAllByText('VOO').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Bitcoin').length).toBeGreaterThan(0)
  })

  it('should show adjustment badges for deviations', () => {
    render(
      <AllocationTable
        allocations={mockAllocations}
        originalAllocations={mockAllocations}
        summary={mockSummary}
        displayCurrency="USD"
        onAllocationChange={mockOnAllocationChange}
        onReset={mockOnReset}
      />
    )

    // Underweight gets +$50 badge
    expect(screen.getAllByText('+$50.00').length).toBeGreaterThan(0)
    // Overweight gets -$50 badge
    expect(screen.getAllByText('-$50.00').length).toBeGreaterThan(0)
  })

  it('should render edit buttons for adjusted amounts', () => {
    render(
      <AllocationTable
        allocations={mockAllocations}
        originalAllocations={mockAllocations}
        summary={mockSummary}
        displayCurrency="USD"
        onAllocationChange={mockOnAllocationChange}
        onReset={mockOnReset}
      />
    )

    // Edit buttons for amounts should exist
    const editButtons = screen.getAllByRole('button', { name: /\$650.00/i })
    expect(editButtons.length).toBeGreaterThan(0)

    // Also verify $350 button exists
    const editButtons350 = screen.getAllByRole('button', { name: /\$350.00/i })
    expect(editButtons350.length).toBeGreaterThan(0)
  })

  it('should have edit buttons with title hint', () => {
    render(
      <AllocationTable
        allocations={mockAllocations}
        originalAllocations={mockAllocations}
        summary={mockSummary}
        displayCurrency="USD"
        onAllocationChange={mockOnAllocationChange}
        onReset={mockOnReset}
      />
    )

    // Check that edit buttons have helpful title
    const editButtons = screen.getAllByRole('button', { name: /\$650.00/i })
    // Desktop view button has title attribute
    expect(editButtons.some(btn => btn.getAttribute('title') === 'Click para editar')).toBe(true)
  })

  it('should calculate correct totals', () => {
    render(
      <AllocationTable
        allocations={mockAllocations}
        originalAllocations={mockAllocations}
        summary={mockSummary}
        displayCurrency="USD"
        onAllocationChange={mockOnAllocationChange}
        onReset={mockOnReset}
      />
    )

    // Total should be 650 + 350 = 1000
    expect(screen.getAllByText('$1,000.00').length).toBeGreaterThan(0)
  })

  it('should show warning when total differs from input', () => {
    const modifiedAllocations = [
      { ...mockAllocations[0], adjustedAllocation: '700.00' },
      { ...mockAllocations[1] },
    ]

    render(
      <AllocationTable
        allocations={modifiedAllocations}
        originalAllocations={mockAllocations}
        summary={mockSummary}
        displayCurrency="USD"
        onAllocationChange={mockOnAllocationChange}
        onReset={mockOnReset}
      />
    )

    // Total is now 1050, should show warning
    expect(screen.getByText(/difiere del aporte original/i)).toBeInTheDocument()
  })

  it('should show reset button when allocations have changed', () => {
    const modifiedAllocations = [
      { ...mockAllocations[0], adjustedAllocation: '700.00' },
      { ...mockAllocations[1] },
    ]

    render(
      <AllocationTable
        allocations={modifiedAllocations}
        originalAllocations={mockAllocations}
        summary={mockSummary}
        displayCurrency="USD"
        onAllocationChange={mockOnAllocationChange}
        onReset={mockOnReset}
      />
    )

    expect(screen.getByRole('button', { name: /Restaurar Sugerido/i })).toBeInTheDocument()
  })

  it('should call onReset when reset button is clicked', async () => {
    const user = userEvent.setup()
    const modifiedAllocations = [
      { ...mockAllocations[0], adjustedAllocation: '700.00' },
      { ...mockAllocations[1] },
    ]

    render(
      <AllocationTable
        allocations={modifiedAllocations}
        originalAllocations={mockAllocations}
        summary={mockSummary}
        displayCurrency="USD"
        onAllocationChange={mockOnAllocationChange}
        onReset={mockOnReset}
      />
    )

    await user.click(screen.getByRole('button', { name: /Restaurar Sugerido/i }))

    expect(mockOnReset).toHaveBeenCalled()
  })

  it('should show summary badges in header', () => {
    render(
      <AllocationTable
        allocations={mockAllocations}
        originalAllocations={mockAllocations}
        summary={mockSummary}
        displayCurrency="USD"
        onAllocationChange={mockOnAllocationChange}
        onReset={mockOnReset}
      />
    )

    expect(screen.getByText(/1 subponderado/i)).toBeInTheDocument()
    expect(screen.getByText(/1 sobreponderado/i)).toBeInTheDocument()
  })

  it('should display target and actual percentages', () => {
    render(
      <AllocationTable
        allocations={mockAllocations}
        originalAllocations={mockAllocations}
        summary={mockSummary}
        displayCurrency="USD"
        onAllocationChange={mockOnAllocationChange}
        onReset={mockOnReset}
      />
    )

    // VOO: target 60%, actual 55%
    expect(screen.getAllByText('60.00%').length).toBeGreaterThan(0)
    expect(screen.getAllByText('55.00%').length).toBeGreaterThan(0)
  })

  it('should display deviation with color coding', () => {
    render(
      <AllocationTable
        allocations={mockAllocations}
        originalAllocations={mockAllocations}
        summary={mockSummary}
        displayCurrency="USD"
        onAllocationChange={mockOnAllocationChange}
        onReset={mockOnReset}
      />
    )

    // -5% deviation for VOO (underweight)
    const negativeDeviation = screen.getAllByText('-5.00%')
    expect(negativeDeviation.length).toBeGreaterThan(0)
    expect(negativeDeviation[0].className).toContain('text-blue-600')

    // +5% deviation for BTC (overweight)
    const positiveDeviation = screen.getAllByText('+5.00%')
    expect(positiveDeviation.length).toBeGreaterThan(0)
    expect(positiveDeviation[0].className).toContain('text-orange-600')
  })
})
