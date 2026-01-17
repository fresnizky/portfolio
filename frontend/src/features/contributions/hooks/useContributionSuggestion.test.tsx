import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useContributionSuggestion } from './useContributionSuggestion'
import { api } from '@/lib/api'
import type { ReactNode } from 'react'
import type { ContributionSuggestion } from '@/types/api'

vi.mock('@/lib/api', () => ({
  api: {
    contributions: {
      suggest: vi.fn(),
    },
  },
}))

describe('useContributionSuggestion', () => {
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

  const mockSuggestionResponse: ContributionSuggestion = {
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

  it('should call API with correct amount', async () => {
    vi.mocked(api.contributions.suggest).mockResolvedValue(mockSuggestionResponse)

    const { result } = renderHook(() => useContributionSuggestion(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate(1000)
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(api.contributions.suggest).toHaveBeenCalledWith(1000)
  })

  it('should return suggestion data on success', async () => {
    vi.mocked(api.contributions.suggest).mockResolvedValue(mockSuggestionResponse)

    const { result } = renderHook(() => useContributionSuggestion(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate(1000)
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockSuggestionResponse)
    expect(result.current.data?.allocations).toHaveLength(2)
    expect(result.current.data?.summary.underweightCount).toBe(1)
    expect(result.current.data?.summary.overweightCount).toBe(1)
  })

  it('should handle API errors', async () => {
    vi.mocked(api.contributions.suggest).mockRejectedValue(new Error('Targets must sum to 100%'))

    const { result } = renderHook(() => useContributionSuggestion(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate(1000)
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.message).toBe('Targets must sum to 100%')
  })

  it('should return idle state initially', () => {
    const { result } = renderHook(() => useContributionSuggestion(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isIdle).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  it('should return pending state while loading', async () => {
    vi.mocked(api.contributions.suggest).mockImplementation(
      () => new Promise(() => {}) // Never resolves - stays loading
    )

    const { result } = renderHook(() => useContributionSuggestion(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.mutate(1000)
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(true)
    })
  })
})
