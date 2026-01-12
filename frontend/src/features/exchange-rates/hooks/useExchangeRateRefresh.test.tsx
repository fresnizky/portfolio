import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useExchangeRateRefresh } from './useExchangeRateRefresh'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'

// Mock the api
vi.mock('@/lib/api', () => ({
  api: {
    exchangeRates: {
      refresh: vi.fn(),
    },
  },
}))

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

const createWrapper = (queryClient: QueryClient) => {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useExchangeRateRefresh', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call api.exchangeRates.refresh', async () => {
    const mockResponse = {
      baseCurrency: 'USD' as const,
      quoteCurrency: 'ARS' as const,
      rate: 1105.5,
      fetchedAt: '2026-01-12T14:30:00.000Z',
      isStale: false,
      source: 'bluelytics',
    }
    vi.mocked(api.exchangeRates.refresh).mockResolvedValue(mockResponse)

    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useExchangeRateRefresh(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync()
    })

    expect(api.exchangeRates.refresh).toHaveBeenCalledTimes(1)
  })

  it('should update exchange rate query cache on success', async () => {
    const mockResponse = {
      baseCurrency: 'USD' as const,
      quoteCurrency: 'ARS' as const,
      rate: 1105.5,
      fetchedAt: '2026-01-12T14:30:00.000Z',
      isStale: false,
      source: 'bluelytics',
    }
    vi.mocked(api.exchangeRates.refresh).mockResolvedValue(mockResponse)

    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useExchangeRateRefresh(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync()
    })

    // Verify cache was updated
    const cachedData = queryClient.getQueryData(queryKeys.exchangeRates.current())
    expect(cachedData).toEqual(mockResponse)
  })

  it('should handle errors', async () => {
    const error = new Error('API Error')
    vi.mocked(api.exchangeRates.refresh).mockRejectedValue(error)

    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useExchangeRateRefresh(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      try {
        await result.current.mutateAsync()
      } catch {
        // Expected to throw
      }
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })

  it('should track pending state', async () => {
    let resolvePromise: (value: unknown) => void
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve
    })
    vi.mocked(api.exchangeRates.refresh).mockReturnValue(pendingPromise as Promise<never>)

    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useExchangeRateRefresh(), {
      wrapper: createWrapper(queryClient),
    })

    expect(result.current.isPending).toBe(false)

    act(() => {
      result.current.mutate()
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(true)
    })

    // Resolve the promise
    const mockResponse = {
      baseCurrency: 'USD' as const,
      quoteCurrency: 'ARS' as const,
      rate: 1105.5,
      fetchedAt: '2026-01-12T14:30:00.000Z',
      isStale: false,
      source: 'bluelytics',
    }
    act(() => {
      resolvePromise!(mockResponse)
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })
  })
})
