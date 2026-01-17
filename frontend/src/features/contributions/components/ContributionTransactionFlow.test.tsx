import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContributionTransactionFlow } from './ContributionTransactionFlow'
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

describe('ContributionTransactionFlow', () => {
  const mockOnSkip = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display current asset being processed', () => {
    render(
      <ContributionTransactionFlow
        allocations={mockAllocations}
        processedAssetIds={[]}
        onSkip={mockOnSkip}
        onCancel={mockOnCancel}
        displayCurrency="USD"
      />
    )

    expect(screen.getByText('VOO')).toBeInTheDocument()
    expect(screen.getByText('Vanguard S&P 500 ETF')).toBeInTheDocument()
    expect(screen.getByText(/\$650/)).toBeInTheDocument()
  })

  it('should show progress indicator', () => {
    render(
      <ContributionTransactionFlow
        allocations={mockAllocations}
        processedAssetIds={[]}
        onSkip={mockOnSkip}
        onCancel={mockOnCancel}
        displayCurrency="USD"
      />
    )

    expect(screen.getByText('1 de 2')).toBeInTheDocument()
  })

  it('should show progress for second asset after first is processed', () => {
    render(
      <ContributionTransactionFlow
        allocations={mockAllocations}
        processedAssetIds={['asset-1']}
        onSkip={mockOnSkip}
        onCancel={mockOnCancel}
        displayCurrency="USD"
      />
    )

    expect(screen.getByText('2 de 2')).toBeInTheDocument()
    expect(screen.getByText('BTC')).toBeInTheDocument()
  })

  it('should call onSkip when skip button is clicked', async () => {
    const user = userEvent.setup()

    render(
      <ContributionTransactionFlow
        allocations={mockAllocations}
        processedAssetIds={[]}
        onSkip={mockOnSkip}
        onCancel={mockOnCancel}
        displayCurrency="USD"
      />
    )

    await user.click(screen.getByRole('button', { name: /omitir/i }))

    expect(mockOnSkip).toHaveBeenCalledWith('asset-1')
  })

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()

    render(
      <ContributionTransactionFlow
        allocations={mockAllocations}
        processedAssetIds={[]}
        onSkip={mockOnSkip}
        onCancel={mockOnCancel}
        displayCurrency="USD"
      />
    )

    await user.click(screen.getByRole('button', { name: /cancelar/i }))

    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('should show remaining assets count', () => {
    render(
      <ContributionTransactionFlow
        allocations={mockAllocations}
        processedAssetIds={['asset-1']}
        onSkip={mockOnSkip}
        onCancel={mockOnCancel}
        displayCurrency="USD"
      />
    )

    expect(screen.getByText(/pendiente.*1/i)).toBeInTheDocument()
  })

  it('should render null when all assets are processed', () => {
    const { container } = render(
      <ContributionTransactionFlow
        allocations={mockAllocations}
        processedAssetIds={['asset-1', 'asset-2']}
        onSkip={mockOnSkip}
        onCancel={mockOnCancel}
        displayCurrency="USD"
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it('should render form using renderForm prop', () => {
    render(
      <ContributionTransactionFlow
        allocations={mockAllocations}
        processedAssetIds={[]}
        onSkip={mockOnSkip}
        onCancel={mockOnCancel}
        displayCurrency="USD"
        renderForm={(allocation) => (
          <div data-testid="custom-form">Form for {allocation.ticker}</div>
        )}
      />
    )

    expect(screen.getByTestId('custom-form')).toBeInTheDocument()
    expect(screen.getByText('Form for VOO')).toBeInTheDocument()
  })
})
