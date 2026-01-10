import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { usePortfolioSummary, useUpdatePrice, useBatchUpdatePrices } from './usePortfolio'
import { api } from '@/lib/api'
import type { ReactNode } from 'react'
import type { PortfolioSummary, BatchUpdatePricesResponse } from '@/types/api'

vi.mock('@/lib/api', () => ({
  api: {
    portfolio: {
      summary: vi.fn(),
    },
    prices: {
      update: vi.fn(),
      batchUpdate: vi.fn(),
    },
  },
}))

describe('usePortfolioSummary', () => {
  let queryClient: QueryClient

  const createWrapper = () => {
    return function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
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

  it('should fetch portfolio summary', async () => {
    const mockSummary: PortfolioSummary = {
      totalValue: '10350.50',
      positions: [
        {
          assetId: 'asset-1',
          ticker: 'VOO',
          name: 'Vanguard S&P 500 ETF',
          category: 'ETF',
          quantity: '10.5',
          currentPrice: '450.75',
          value: '4732.88',
          targetPercentage: '60.00',
          priceUpdatedAt: '2026-01-05T10:00:00.000Z',
        },
      ],
    }
    vi.mocked(api.portfolio.summary).mockResolvedValue(mockSummary)

    const { result } = renderHook(() => usePortfolioSummary(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(api.portfolio.summary).toHaveBeenCalled()
    expect(result.current.data).toEqual(mockSummary)
  })

  it('should handle fetch errors', async () => {
    vi.mocked(api.portfolio.summary).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => usePortfolioSummary(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.message).toBe('Network error')
  })
})

describe('useUpdatePrice', () => {
  let queryClient: QueryClient

  const createWrapper = () => {
    return function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
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

  it('should update price for an asset', async () => {
    const mockAsset = {
      id: 'asset-1',
      ticker: 'VOO',
      name: 'Vanguard S&P 500 ETF',
      category: 'ETF' as const,
      targetPercentage: '60.00',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-10T00:00:00.000Z',
      userId: 'user-1',
    }
    vi.mocked(api.prices.update).mockResolvedValue(mockAsset)

    const { result } = renderHook(() => useUpdatePrice(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ assetId: 'asset-1', price: 455.50 })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(api.prices.update).toHaveBeenCalledWith('asset-1', { price: 455.50 })
  })

  it('should invalidate portfolio queries on success', async () => {
    const mockAsset = {
      id: 'asset-1',
      ticker: 'VOO',
      name: 'Vanguard S&P 500 ETF',
      category: 'ETF' as const,
      targetPercentage: '60.00',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-10T00:00:00.000Z',
      userId: 'user-1',
    }
    vi.mocked(api.prices.update).mockResolvedValue(mockAsset)

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUpdatePrice(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ assetId: 'asset-1', price: 455.50 })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['portfolio'] })
  })

  it('should handle update errors', async () => {
    vi.mocked(api.prices.update).mockRejectedValue(new Error('Invalid price'))

    const { result } = renderHook(() => useUpdatePrice(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ assetId: 'asset-1', price: -100 })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.message).toBe('Invalid price')
  })
})

describe('useBatchUpdatePrices', () => {
  let queryClient: QueryClient

  const createWrapper = () => {
    return function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
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

  it('should batch update multiple prices', async () => {
    const mockResponse: BatchUpdatePricesResponse = {
      updated: 2,
      assets: [
        { id: 'asset-1', ticker: 'VOO', currentPrice: '455.50', priceUpdatedAt: '2026-01-10T00:00:00.000Z' },
        { id: 'asset-2', ticker: 'BTC', currentPrice: '45000.00', priceUpdatedAt: '2026-01-10T00:00:00.000Z' },
      ],
    }
    vi.mocked(api.prices.batchUpdate).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useBatchUpdatePrices(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      prices: [
        { assetId: 'asset-1', price: 455.50 },
        { assetId: 'asset-2', price: 45000.00 },
      ],
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(api.prices.batchUpdate).toHaveBeenCalledWith({
      prices: [
        { assetId: 'asset-1', price: 455.50 },
        { assetId: 'asset-2', price: 45000.00 },
      ],
    })
    expect(result.current.data).toEqual(mockResponse)
  })

  it('should invalidate portfolio queries on success', async () => {
    const mockResponse: BatchUpdatePricesResponse = {
      updated: 1,
      assets: [
        { id: 'asset-1', ticker: 'VOO', currentPrice: '455.50', priceUpdatedAt: '2026-01-10T00:00:00.000Z' },
      ],
    }
    vi.mocked(api.prices.batchUpdate).mockResolvedValue(mockResponse)

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useBatchUpdatePrices(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      prices: [{ assetId: 'asset-1', price: 455.50 }],
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['portfolio'] })
  })

  it('should handle batch update errors', async () => {
    vi.mocked(api.prices.batchUpdate).mockRejectedValue(new Error('Batch update failed'))

    const { result } = renderHook(() => useBatchUpdatePrices(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      prices: [{ assetId: 'invalid', price: 100 }],
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.message).toBe('Batch update failed')
  })
})
