import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTransactions, useCreateTransaction } from './useTransactions'
import { api } from '@/lib/api'
import type { ReactNode } from 'react'
import type { Transaction } from '@/types/api'

vi.mock('@/lib/api', () => ({
  api: {
    transactions: {
      list: vi.fn(),
      create: vi.fn(),
    },
  },
}))

describe('useTransactions', () => {
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

  const mockTransaction: Transaction = {
    id: 'tx-1',
    type: 'BUY',
    date: '2026-01-07T12:00:00.000Z',
    quantity: '10',
    price: '150.00',
    commission: '5.00',
    totalCost: '1505.00',
    assetId: 'asset-1',
    createdAt: '2026-01-07T12:00:00.000Z',
    asset: { ticker: 'VOO', name: 'Vanguard S&P 500 ETF' },
  }

  describe('useTransactions', () => {
    it('should fetch transactions without filters', async () => {
      const mockResponse = { transactions: [mockTransaction], total: 1 }
      vi.mocked(api.transactions.list).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useTransactions(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(api.transactions.list).toHaveBeenCalledWith(undefined)
      expect(result.current.data).toEqual(mockResponse)
    })

    it('should fetch transactions with filters', async () => {
      const filters = { assetId: 'asset-1', type: 'buy' as const }
      const mockResponse = { transactions: [mockTransaction], total: 1 }
      vi.mocked(api.transactions.list).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useTransactions(filters), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(api.transactions.list).toHaveBeenCalledWith(filters)
    })

    it('should convert YYYY-MM-DD date filters to ISO 8601 format', async () => {
      const filters = {
        assetId: 'asset-1',
        fromDate: '2026-01-01',
        toDate: '2026-01-31',
      }
      const mockResponse = { transactions: [mockTransaction], total: 1 }
      vi.mocked(api.transactions.list).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useTransactions(filters), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Verify dates are converted to ISO 8601 format
      expect(api.transactions.list).toHaveBeenCalledWith({
        assetId: 'asset-1',
        fromDate: '2026-01-01T00:00:00.000Z',
        toDate: '2026-01-31T00:00:00.000Z',
      })
    })

    it('should not transform dates already in ISO 8601 format', async () => {
      const filters = {
        fromDate: '2026-01-01T00:00:00.000Z',
        toDate: '2026-01-31T00:00:00.000Z',
      }
      const mockResponse = { transactions: [mockTransaction], total: 1 }
      vi.mocked(api.transactions.list).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useTransactions(filters), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Dates should remain unchanged
      expect(api.transactions.list).toHaveBeenCalledWith({
        fromDate: '2026-01-01T00:00:00.000Z',
        toDate: '2026-01-31T00:00:00.000Z',
      })
    })

    it('should handle fetch errors', async () => {
      vi.mocked(api.transactions.list).mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useTransactions(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeDefined()
    })
  })

  describe('useCreateTransaction', () => {
    it('should create transaction and invalidate queries', async () => {
      vi.mocked(api.transactions.create).mockResolvedValue(mockTransaction)
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useCreateTransaction(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        type: 'buy',
        assetId: 'asset-1',
        date: '2026-01-07',
        quantity: 10,
        price: 150,
        commission: 5,
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(api.transactions.create).toHaveBeenCalled()
      expect(invalidateSpy).toHaveBeenCalled()
    })

    it('should handle creation errors', async () => {
      vi.mocked(api.transactions.create).mockRejectedValue(
        new Error('Insufficient quantity')
      )

      const { result } = renderHook(() => useCreateTransaction(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        type: 'sell',
        assetId: 'asset-1',
        date: '2026-01-07',
        quantity: 1000,
        price: 150,
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error?.message).toBe('Insufficient quantity')
    })
  })
})
