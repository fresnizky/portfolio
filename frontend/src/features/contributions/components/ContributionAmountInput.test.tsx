import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContributionAmountInput } from './ContributionAmountInput'

describe('ContributionAmountInput', () => {
  const mockOnCalculate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render input and calculate button', () => {
    render(
      <ContributionAmountInput
        onCalculate={mockOnCalculate}
        isLoading={false}
      />
    )

    expect(screen.getByLabelText(/Monto del Aporte/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Calcular/i })).toBeInTheDocument()
  })

  it('should call onCalculate with entered amount', async () => {
    const user = userEvent.setup()
    render(
      <ContributionAmountInput
        onCalculate={mockOnCalculate}
        isLoading={false}
      />
    )

    await user.type(screen.getByLabelText(/Monto del Aporte/i), '1000')
    await user.click(screen.getByRole('button', { name: /Calcular/i }))

    expect(mockOnCalculate).toHaveBeenCalledWith(1000)
  })

  it('should disable button when loading', () => {
    render(
      <ContributionAmountInput
        onCalculate={mockOnCalculate}
        isLoading={true}
      />
    )

    expect(screen.getByRole('button', { name: /Calculando/i })).toBeDisabled()
  })

  it('should disable input when loading', () => {
    render(
      <ContributionAmountInput
        onCalculate={mockOnCalculate}
        isLoading={true}
      />
    )

    expect(screen.getByLabelText(/Monto del Aporte/i)).toBeDisabled()
  })

  it('should validate empty input on submit', async () => {
    const user = userEvent.setup()
    render(
      <ContributionAmountInput
        onCalculate={mockOnCalculate}
        isLoading={false}
      />
    )

    // Button is disabled when empty, but let's test the validation message
    // by submitting the form via Enter key after clearing
    const input = screen.getByLabelText(/Monto del Aporte/i)
    await user.type(input, '100')
    await user.clear(input)

    // The button should be disabled when input is empty
    expect(screen.getByRole('button', { name: /Calcular/i })).toBeDisabled()
    expect(mockOnCalculate).not.toHaveBeenCalled()
  })

  it('should validate zero input', async () => {
    const user = userEvent.setup()
    render(
      <ContributionAmountInput
        onCalculate={mockOnCalculate}
        isLoading={false}
      />
    )

    await user.type(screen.getByLabelText(/Monto del Aporte/i), '0')
    await user.click(screen.getByRole('button', { name: /Calcular/i }))

    expect(screen.getByRole('alert')).toHaveTextContent(/monto mayor a 0/i)
    expect(mockOnCalculate).not.toHaveBeenCalled()
  })

  it('should disable button when input is empty', () => {
    render(
      <ContributionAmountInput
        onCalculate={mockOnCalculate}
        isLoading={false}
      />
    )

    expect(screen.getByRole('button', { name: /Calcular/i })).toBeDisabled()
  })

  it('should show spinner when loading', () => {
    render(
      <ContributionAmountInput
        onCalculate={mockOnCalculate}
        isLoading={true}
      />
    )

    expect(screen.getByRole('button', { name: /Calculando/i })).toBeInTheDocument()
  })

  it('should accept decimal amounts', async () => {
    const user = userEvent.setup()
    render(
      <ContributionAmountInput
        onCalculate={mockOnCalculate}
        isLoading={false}
      />
    )

    await user.type(screen.getByLabelText(/Monto del Aporte/i), '1500.50')
    await user.click(screen.getByRole('button', { name: /Calcular/i }))

    expect(mockOnCalculate).toHaveBeenCalledWith(1500.5)
  })

  it('should clear error when user types', async () => {
    const user = userEvent.setup()
    render(
      <ContributionAmountInput
        onCalculate={mockOnCalculate}
        isLoading={false}
      />
    )

    // First trigger an error
    await user.type(screen.getByLabelText(/Monto del Aporte/i), '0')
    await user.click(screen.getByRole('button', { name: /Calcular/i }))
    expect(screen.getByRole('alert')).toBeInTheDocument()

    // Clear and type new value - error should disappear
    await user.clear(screen.getByLabelText(/Monto del Aporte/i))
    await user.type(screen.getByLabelText(/Monto del Aporte/i), '100')

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
