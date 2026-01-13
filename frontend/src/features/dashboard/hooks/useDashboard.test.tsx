import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useDashboard } from './useDashboard'
import { api } from '@/lib/api'
import type { ReactNode } from 'react'
import type { DashboardResponse } from '@/types/api'

vi.mock('@/lib/api', () => ({
  api: {
    dashboard: {
      get: vi.fn(),
    },
  },
}))

describe('useDashboard', () => {
  let queryClient: QueryClient

  const createWrapper = () => {
    return function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )
    }
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    vi.clearAllMocks()
  })

  const mockDashboardResponse: DashboardResponse = {
    totalValue: '10000.00',
    displayCurrency: 'USD',
    exchangeRate: null,
    positions: [
      {
        assetId: 'asset-1',
        ticker: 'VOO',
        name: 'Vanguard S&P 500 ETF',
        category: 'ETF',
        quantity: '10',
        currentPrice: '450.00',
        originalValue: '4500.00',
        originalCurrency: 'USD',
        value: '4500.00',
        displayCurrency: 'USD',
        targetPercentage: '60.00',
        actualPercentage: '45.00',
        deviation: '-15.00',
        priceUpdatedAt: '2026-01-10T12:00:00.000Z',
      },
      {
        assetId: 'asset-2',
        ticker: 'BTC',
        name: 'Bitcoin',
        category: 'CRYPTO',
        quantity: '0.1',
        currentPrice: '55000.00',
        originalValue: '5500.00',
        originalCurrency: 'USD',
        value: '5500.00',
        displayCurrency: 'USD',
        targetPercentage: '40.00',
        actualPercentage: '55.00',
        deviation: '15.00',
        priceUpdatedAt: '2026-01-10T12:00:00.000Z',
      },
    ],
    alerts: [],
  }

  it('should fetch dashboard data', async () => {
    vi.mocked(api.dashboard.get).mockResolvedValue(mockDashboardResponse)

    const { result } = renderHook(() => useDashboard(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(api.dashboard.get).toHaveBeenCalledWith(undefined)
    expect(result.current.data).toEqual(mockDashboardResponse)
  })

  it('should return loading state initially', async () => {
    vi.mocked(api.dashboard.get).mockImplementation(
      () => new Promise(() => {}) // Never resolves - stays loading
    )

    const { result } = renderHook(() => useDashboard(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  it('should handle API errors', async () => {
    vi.mocked(api.dashboard.get).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useDashboard(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })

  it('should fetch with params when provided', async () => {
    const params = { deviationThreshold: 5, staleDays: 7 }
    vi.mocked(api.dashboard.get).mockResolvedValue(mockDashboardResponse)

    const { result } = renderHook(() => useDashboard(params), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(api.dashboard.get).toHaveBeenCalledWith(params)
  })
})
