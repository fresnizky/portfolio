import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SettingsPage } from './index'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

// Mock the api
vi.mock('@/lib/api', () => ({
  api: {
    settings: {
      get: vi.fn(),
      update: vi.fn(),
      exportJson: vi.fn(),
      exportCsv: vi.fn(),
    },
    auth: {
      changePassword: vi.fn(),
    },
    exchangeRates: {
      getCurrent: vi.fn(),
      refresh: vi.fn(),
    },
  },
}))

// Mock the auth store
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(),
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

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuthStore).mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com' },
      logout: vi.fn(),
      isAuthenticated: true,
      token: 'mock-token',
      login: vi.fn(),
    } as ReturnType<typeof useAuthStore>)

    vi.mocked(api.settings.get).mockResolvedValue({
      rebalanceThreshold: '5',
      priceAlertDays: 7,
    })

    vi.mocked(api.exchangeRates.getCurrent).mockResolvedValue({
      baseCurrency: 'USD',
      quoteCurrency: 'ARS',
      rate: 1105.5,
      fetchedAt: '2026-01-12T14:30:00.000Z',
      isStale: false,
      source: 'bluelytics',
    })
  })

  it('should render page title', async () => {
    render(<SettingsPage />, { wrapper: createWrapper() })

    expect(screen.getByText('Configuracion')).toBeInTheDocument()
  })

  it('should render all sections', async () => {
    render(<SettingsPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText(/preferencias de alertas/i)).toBeInTheDocument()
    })

    expect(screen.getByText(/exportar datos/i)).toBeInTheDocument()
    expect(screen.getByText(/cuenta/i)).toBeInTheDocument()
  })

  it('should show settings form fields', async () => {
    render(<SettingsPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByLabelText(/umbral de rebalanceo/i)).toBeInTheDocument()
    })
    expect(screen.getByLabelText(/dias para alerta/i)).toBeInTheDocument()
  })

  it('should show export buttons', async () => {
    render(<SettingsPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText(/exportar json/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/exportar csv/i)).toBeInTheDocument()
  })

  it('should show user email', async () => {
    render(<SettingsPage />, { wrapper: createWrapper() })

    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument()
  })

  it('should render exchange rate section', async () => {
    render(<SettingsPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Tipo de Cambio')).toBeInTheDocument()
    })

    expect(screen.getByText(/1 USD =/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /actualizar ahora/i })).toBeInTheDocument()
  })
})
