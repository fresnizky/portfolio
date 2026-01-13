import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ExchangeRateSection } from './ExchangeRateSection'
import { useExchangeRate } from '@/features/exchange-rates/hooks/useExchangeRate'
import { useExchangeRateRefresh } from '@/features/exchange-rates/hooks/useExchangeRateRefresh'

// Mock the hooks
vi.mock('@/features/exchange-rates/hooks/useExchangeRate', () => ({
  useExchangeRate: vi.fn(),
}))

vi.mock('@/features/exchange-rates/hooks/useExchangeRateRefresh', () => ({
  useExchangeRateRefresh: vi.fn(),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const mockExchangeRate = {
  baseCurrency: 'USD' as const,
  quoteCurrency: 'ARS' as const,
  rate: 1105.5,
  fetchedAt: '2026-01-12T14:30:00.000Z',
  isStale: false,
  source: 'bluelytics',
}

const mockRefreshMutation = {
  mutateAsync: vi.fn(),
  mutate: vi.fn(),
  isPending: false,
  isIdle: true,
  isSuccess: false,
  isError: false,
  data: undefined,
  error: null,
  variables: undefined,
  reset: vi.fn(),
  context: undefined,
  failureCount: 0,
  failureReason: null,
  status: 'idle' as const,
  submittedAt: 0,
  isPaused: false,
}

describe('ExchangeRateSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useExchangeRateRefresh).mockReturnValue(mockRefreshMutation as ReturnType<typeof useExchangeRateRefresh>)
  })

  it('should render current exchange rate', () => {
    vi.mocked(useExchangeRate).mockReturnValue({
      data: mockExchangeRate,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useExchangeRate>)

    render(<ExchangeRateSection />, { wrapper: createWrapper() })

    expect(screen.getByText('Tipo de Cambio')).toBeInTheDocument()
    expect(screen.getByText('Cotizacion USD/ARS')).toBeInTheDocument()
    expect(screen.getByText(/1 USD =/)).toBeInTheDocument()
    expect(screen.getByText(/1\.105,50/)).toBeInTheDocument()
  })

  it('should display fetch date and source', () => {
    vi.mocked(useExchangeRate).mockReturnValue({
      data: mockExchangeRate,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useExchangeRate>)

    render(<ExchangeRateSection />, { wrapper: createWrapper() })

    expect(screen.getByText(/Actualizado:/)).toBeInTheDocument()
    expect(screen.getByText(/12 ene 2026/)).toBeInTheDocument()
    expect(screen.getByText('Fuente: Bluelytics')).toBeInTheDocument()
  })

  it('should show stale warning when rate is stale', () => {
    vi.mocked(useExchangeRate).mockReturnValue({
      data: { ...mockExchangeRate, isStale: true },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useExchangeRate>)

    render(<ExchangeRateSection />, { wrapper: createWrapper() })

    expect(screen.getByText('Desactualizado')).toBeInTheDocument()
  })

  it('should not show stale warning when rate is fresh', () => {
    vi.mocked(useExchangeRate).mockReturnValue({
      data: { ...mockExchangeRate, isStale: false },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useExchangeRate>)

    render(<ExchangeRateSection />, { wrapper: createWrapper() })

    expect(screen.queryByText('Desactualizado')).not.toBeInTheDocument()
  })

  it('should show loading state', () => {
    vi.mocked(useExchangeRate).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as ReturnType<typeof useExchangeRate>)

    render(<ExchangeRateSection />, { wrapper: createWrapper() })

    // Check for loading skeleton (animate-pulse class)
    const loadingContainer = document.querySelector('.animate-pulse')
    expect(loadingContainer).toBeInTheDocument()
  })

  it('should show error state', () => {
    vi.mocked(useExchangeRate).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
    } as ReturnType<typeof useExchangeRate>)

    render(<ExchangeRateSection />, { wrapper: createWrapper() })

    expect(screen.getByText('Error al cargar tipo de cambio')).toBeInTheDocument()
  })

  it('should display source name correctly for bluelytics', () => {
    vi.mocked(useExchangeRate).mockReturnValue({
      data: { ...mockExchangeRate, source: 'bluelytics' },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useExchangeRate>)

    render(<ExchangeRateSection />, { wrapper: createWrapper() })

    expect(screen.getByText('Fuente: Bluelytics')).toBeInTheDocument()
  })

  it('should display source name as-is for other sources', () => {
    vi.mocked(useExchangeRate).mockReturnValue({
      data: { ...mockExchangeRate, source: 'bcra' },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useExchangeRate>)

    render(<ExchangeRateSection />, { wrapper: createWrapper() })

    expect(screen.getByText('Fuente: bcra')).toBeInTheDocument()
  })

  // Refresh button tests
  it('should render refresh button', () => {
    vi.mocked(useExchangeRate).mockReturnValue({
      data: mockExchangeRate,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useExchangeRate>)

    render(<ExchangeRateSection />, { wrapper: createWrapper() })

    expect(screen.getByRole('button', { name: /actualizar ahora/i })).toBeInTheDocument()
  })

  it('should call refresh mutation on button click', async () => {
    const user = userEvent.setup()
    vi.mocked(useExchangeRate).mockReturnValue({
      data: mockExchangeRate,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useExchangeRate>)
    mockRefreshMutation.mutateAsync.mockResolvedValue(mockExchangeRate)

    render(<ExchangeRateSection />, { wrapper: createWrapper() })

    const button = screen.getByRole('button', { name: /actualizar ahora/i })
    await user.click(button)

    expect(mockRefreshMutation.mutateAsync).toHaveBeenCalled()
  })

  it('should show loading state during refresh', () => {
    vi.mocked(useExchangeRate).mockReturnValue({
      data: mockExchangeRate,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useExchangeRate>)
    vi.mocked(useExchangeRateRefresh).mockReturnValue({
      ...mockRefreshMutation,
      isPending: true,
      status: 'pending',
    } as ReturnType<typeof useExchangeRateRefresh>)

    render(<ExchangeRateSection />, { wrapper: createWrapper() })

    const button = screen.getByRole('button', { name: /actualizando/i })
    expect(button).toBeDisabled()
  })

  it('should disable button during refresh', () => {
    vi.mocked(useExchangeRate).mockReturnValue({
      data: mockExchangeRate,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useExchangeRate>)
    vi.mocked(useExchangeRateRefresh).mockReturnValue({
      ...mockRefreshMutation,
      isPending: true,
      status: 'pending',
    } as ReturnType<typeof useExchangeRateRefresh>)

    render(<ExchangeRateSection />, { wrapper: createWrapper() })

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('should show success message on successful refresh', async () => {
    const user = userEvent.setup()
    vi.mocked(useExchangeRate).mockReturnValue({
      data: mockExchangeRate,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useExchangeRate>)
    mockRefreshMutation.mutateAsync.mockResolvedValue(mockExchangeRate)

    render(<ExchangeRateSection />, { wrapper: createWrapper() })

    const button = screen.getByRole('button', { name: /actualizar ahora/i })
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText('Tipo de cambio actualizado')).toBeInTheDocument()
    })
  })

  it('should show error message on failed refresh', async () => {
    const user = userEvent.setup()
    vi.mocked(useExchangeRate).mockReturnValue({
      data: mockExchangeRate,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useExchangeRate>)
    mockRefreshMutation.mutateAsync.mockRejectedValue(new Error('API Error'))

    render(<ExchangeRateSection />, { wrapper: createWrapper() })

    const button = screen.getByRole('button', { name: /actualizar ahora/i })
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText('No se pudo actualizar el tipo de cambio')).toBeInTheDocument()
    })
  })
})
