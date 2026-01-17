import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ContributionAllocation } from '@/types/api'

// Must mock before importing the component
const mockNavigate = vi.fn()
vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}))

// Import after mock
import { SuggestionActions } from './SuggestionActions'

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

describe('SuggestionActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  const renderComponent = () => {
    return render(
      <SuggestionActions
        allocations={mockAllocations}
        amount={1000}
        displayCurrency="USD"
      />
    )
  }

  it('should render action buttons', () => {
    renderComponent()

    expect(screen.getByRole('button', { name: /Usar Sugerencia/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Registrar Transacciones/i })).toBeInTheDocument()
  })

  it('should have Use Suggestion button enabled', () => {
    renderComponent()

    const useSuggestionBtn = screen.getByRole('button', { name: /Usar Sugerencia/i })
    expect(useSuggestionBtn).not.toBeDisabled()
  })

  it('should display total to invest', () => {
    renderComponent()

    // Total is 650 + 350 = 1000
    expect(screen.getByText(/Total a invertir/i)).toBeInTheDocument()
    expect(screen.getByText(/\$1,000.00/)).toBeInTheDocument()
  })

  it('should store prefill data and navigate on button click', async () => {
    const user = userEvent.setup()
    renderComponent()

    await user.click(screen.getByRole('button', { name: /Registrar Transacciones/i }))

    // Verify session storage was set
    const storedData = sessionStorage.getItem('contribution-prefill')
    expect(storedData).not.toBeNull()

    const parsedData = JSON.parse(storedData!)
    expect(parsedData.amount).toBe(1000)
    expect(parsedData.allocations).toHaveLength(2)
    expect(parsedData.timestamp).toBeDefined()

    // Verify navigate was called
    expect(mockNavigate).toHaveBeenCalledWith('/transactions')
  })

  it('should show informational note', () => {
    renderComponent()

    expect(screen.getByText(/Nota:/i)).toBeInTheDocument()
    expect(screen.getByText(/serás redirigido a la página de transacciones/i)).toBeInTheDocument()
  })

  it('should call onUseSuggestion when Use Suggestion button is clicked', async () => {
    const user = userEvent.setup()
    const mockOnUseSuggestion = vi.fn()

    render(
      <SuggestionActions
        allocations={mockAllocations}
        amount={1000}
        displayCurrency="USD"
        onUseSuggestion={mockOnUseSuggestion}
      />
    )

    await user.click(screen.getByRole('button', { name: /Usar Sugerencia/i }))

    expect(mockOnUseSuggestion).toHaveBeenCalled()
  })

  it('should store prefill data when Use Suggestion is clicked', async () => {
    const user = userEvent.setup()
    const mockOnUseSuggestion = vi.fn()

    render(
      <SuggestionActions
        allocations={mockAllocations}
        amount={1000}
        displayCurrency="USD"
        onUseSuggestion={mockOnUseSuggestion}
      />
    )

    await user.click(screen.getByRole('button', { name: /Usar Sugerencia/i }))

    // Verify session storage was set
    const storedData = sessionStorage.getItem('contribution-prefill')
    expect(storedData).not.toBeNull()

    const parsedData = JSON.parse(storedData!)
    expect(parsedData.amount).toBe(1000)
    expect(parsedData.allocations).toHaveLength(2)
  })
})
