import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSnapshots } from './useSnapshots'
import { api } from '@/lib/api'
import type { ReactNode } from 'react'
import type { SnapshotListResponse } from '@/types/api'

vi.mock('@/lib/api', () => ({
  api: {
    snapshots: {
      list: vi.fn(),
    },
  },
}))

describe('useSnapshots', () => {
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

  const mockSnapshotsResponse: SnapshotListResponse = {
    snapshots: [
      {
        id: 'snapshot-1',
        date: '2026-01-01T00:00:00.000Z',
        totalValue: '10000.00',
        assets: [
          {
            assetId: 'asset-1',
            ticker: 'VOO',
            name: 'Vanguard S&P 500 ETF',
            quantity: '10',
            price: '450.00',
            value: '4500.00',
            percentage: '45.00',
          },
        ],
        createdAt: '2026-01-01T15:00:00.000Z',
      },
      {
        id: 'snapshot-2',
        date: '2026-01-10T00:00:00.000Z',
        totalValue: '12000.00',
        assets: [
          {
            assetId: 'asset-1',
            ticker: 'VOO',
            name: 'Vanguard S&P 500 ETF',
            quantity: '10',
            price: '540.00',
            value: '5400.00',
            percentage: '45.00',
          },
        ],
        createdAt: '2026-01-10T15:00:00.000Z',
      },
    ],
    total: 2,
  }

  it('should fetch snapshots without filters', async () => {
    vi.mocked(api.snapshots.list).mockResolvedValue(mockSnapshotsResponse)

    const { result } = renderHook(() => useSnapshots(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(api.snapshots.list).toHaveBeenCalledWith(undefined)
    expect(result.current.data).toEqual(mockSnapshotsResponse)
  })

  it('should pass date filters to API', async () => {
    const filters = {
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-01-10T00:00:00.000Z',
    }
    vi.mocked(api.snapshots.list).mockResolvedValue(mockSnapshotsResponse)

    const { result } = renderHook(() => useSnapshots(filters), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(api.snapshots.list).toHaveBeenCalledWith(filters)
  })

  it('should return loading state initially', async () => {
    vi.mocked(api.snapshots.list).mockImplementation(
      () => new Promise(() => {}) // Never resolves - stays loading
    )

    const { result } = renderHook(() => useSnapshots(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  it('should return data on success', async () => {
    vi.mocked(api.snapshots.list).mockResolvedValue(mockSnapshotsResponse)

    const { result } = renderHook(() => useSnapshots(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.snapshots).toHaveLength(2)
    expect(result.current.data?.total).toBe(2)
  })

  it('should handle API errors', async () => {
    vi.mocked(api.snapshots.list).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useSnapshots(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })
})
