import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ContributionsPage } from './index'
import { api, ApiError } from '@/lib/api'
import type { ContributionSuggestion } from '@/types/api'

// Mock react-router
vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  api: {
    contributions: {
      suggest: vi.fn(),
    },
  },
  ApiError: class ApiError extends Error {
    error: string
    constructor(message: string, error: string) {
      super(message)
      this.error = error
    }
  },
}))

const mockSuggestion: ContributionSuggestion = {
  amount: '1000.00',
  displayCurrency: 'USD',
  allocations: [
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
  ],
  summary: {
    totalAdjusted: '1000.00',
    underweightCount: 1,
    overweightCount: 1,
    balancedCount: 0,
  },
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

function renderWithClient(ui: React.ReactElement) {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  )
}

describe('ContributionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('should render contribution input form', () => {
    renderWithClient(<ContributionsPage />)

    expect(screen.getByText('Aportes')).toBeInTheDocument()
    expect(screen.getByLabelText(/Monto del Aporte/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Calcular/i })).toBeInTheDocument()
  })

  it('should calculate and display suggestion', async () => {
    vi.mocked(api.contributions.suggest).mockResolvedValue(mockSuggestion)
    const user = userEvent.setup()

    renderWithClient(<ContributionsPage />)

    await user.type(screen.getByLabelText(/Monto del Aporte/i), '1000')
    await user.click(screen.getByRole('button', { name: /Calcular/i }))

    await waitFor(() => {
      expect(screen.getByText('Distribución Sugerida')).toBeInTheDocument()
    })

    // Verify allocations are displayed
    expect(screen.getAllByText('VOO').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Bitcoin').length).toBeGreaterThan(0)
  })

  it('should show error on API failure', async () => {
    vi.mocked(api.contributions.suggest).mockRejectedValue(new Error('Network error'))
    const user = userEvent.setup()

    renderWithClient(<ContributionsPage />)

    await user.type(screen.getByLabelText(/Monto del Aporte/i), '1000')
    await user.click(screen.getByRole('button', { name: /Calcular/i }))

    await waitFor(() => {
      expect(screen.getByText(/Error/i)).toBeInTheDocument()
    })
  })

  it('should show loading state while calculating', async () => {
    vi.mocked(api.contributions.suggest).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )
    const user = userEvent.setup()

    renderWithClient(<ContributionsPage />)

    await user.type(screen.getByLabelText(/Monto del Aporte/i), '1000')
    await user.click(screen.getByRole('button', { name: /Calcular/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Calculando/i })).toBeDisabled()
    })
  })

  it('should display action buttons after calculation', async () => {
    vi.mocked(api.contributions.suggest).mockResolvedValue(mockSuggestion)
    const user = userEvent.setup()

    renderWithClient(<ContributionsPage />)

    await user.type(screen.getByLabelText(/Monto del Aporte/i), '1000')
    await user.click(screen.getByRole('button', { name: /Calcular/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Registrar Transacciones/i })).toBeInTheDocument()
    })
  })

  it('should display summary badges', async () => {
    vi.mocked(api.contributions.suggest).mockResolvedValue(mockSuggestion)
    const user = userEvent.setup()

    renderWithClient(<ContributionsPage />)

    await user.type(screen.getByLabelText(/Monto del Aporte/i), '1000')
    await user.click(screen.getByRole('button', { name: /Calcular/i }))

    await waitFor(() => {
      expect(screen.getByText(/1 subponderado/i)).toBeInTheDocument()
      expect(screen.getByText(/1 sobreponderado/i)).toBeInTheDocument()
    })
  })
})
