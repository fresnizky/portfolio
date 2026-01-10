import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SettingsForm } from './SettingsForm'
import { api } from '@/lib/api'

// Mock the api
vi.mock('@/lib/api', () => ({
  api: {
    settings: {
      get: vi.fn(),
      update: vi.fn(),
    },
  },
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('SettingsForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display current settings', async () => {
    vi.mocked(api.settings.get).mockResolvedValue({
      rebalanceThreshold: '10',
      priceAlertDays: 14,
    })

    render(<SettingsForm />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByLabelText(/umbral de rebalanceo/i)).toHaveValue(10)
    })
    expect(screen.getByLabelText(/dias para alerta/i)).toHaveValue(14)
  })

  it('should show loading state', () => {
    vi.mocked(api.settings.get).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    render(<SettingsForm />, { wrapper: createWrapper() })

    expect(screen.queryByLabelText(/umbral/i)).not.toBeInTheDocument()
  })

  it('should submit updated settings', async () => {
    const user = userEvent.setup()
    vi.mocked(api.settings.get).mockResolvedValue({
      rebalanceThreshold: '5',
      priceAlertDays: 7,
    })
    vi.mocked(api.settings.update).mockResolvedValue({
      rebalanceThreshold: '15',
      priceAlertDays: 7,
    })

    render(<SettingsForm />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByLabelText(/umbral de rebalanceo/i)).toHaveValue(5)
    })

    const thresholdInput = screen.getByLabelText(/umbral de rebalanceo/i)
    await user.clear(thresholdInput)
    await user.type(thresholdInput, '15')

    const submitButton = screen.getByRole('button', { name: /guardar cambios/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(api.settings.update).toHaveBeenCalled()
    })
  })

  it('should disable submit button when form is not dirty', async () => {
    vi.mocked(api.settings.get).mockResolvedValue({
      rebalanceThreshold: '5',
      priceAlertDays: 7,
    })

    render(<SettingsForm />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByLabelText(/umbral de rebalanceo/i)).toHaveValue(5)
    })

    const submitButton = screen.getByRole('button', { name: /guardar cambios/i })
    expect(submitButton).toBeDisabled()
  })

  it('should show success message after save', async () => {
    const user = userEvent.setup()
    vi.mocked(api.settings.get).mockResolvedValue({
      rebalanceThreshold: '5',
      priceAlertDays: 7,
    })
    vi.mocked(api.settings.update).mockResolvedValue({
      rebalanceThreshold: '10',
      priceAlertDays: 7,
    })

    render(<SettingsForm />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByLabelText(/umbral de rebalanceo/i)).toHaveValue(5)
    })

    const thresholdInput = screen.getByLabelText(/umbral de rebalanceo/i)
    await user.clear(thresholdInput)
    await user.type(thresholdInput, '10')

    const submitButton = screen.getByRole('button', { name: /guardar cambios/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/guardado correctamente/i)).toBeInTheDocument()
    })
  })
})
