import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ExchangeRateSection } from './ExchangeRateSection'
import { useExchangeRate } from '@/features/exchange-rates/hooks/useExchangeRate'

// Mock the hook
vi.mock('@/features/exchange-rates/hooks/useExchangeRate', () => ({
  useExchangeRate: vi.fn(),
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

describe('ExchangeRateSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
})
