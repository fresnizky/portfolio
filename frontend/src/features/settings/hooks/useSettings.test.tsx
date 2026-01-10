import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSettings } from './useSettings'
import { api } from '@/lib/api'

// Mock the api
vi.mock('@/lib/api', () => ({
  api: {
    settings: {
      get: vi.fn(),
      update: vi.fn(),
    },
  },
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

describe('useSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch settings on mount', async () => {
    const mockSettings = {
      rebalanceThreshold: '5',
      priceAlertDays: 7,
    }
    vi.mocked(api.settings.get).mockResolvedValue(mockSettings)

    const { result } = renderHook(() => useSettings(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.settings).toEqual(mockSettings)
    expect(api.settings.get).toHaveBeenCalledTimes(1)
  })

  it('should update settings', async () => {
    const mockSettings = {
      rebalanceThreshold: '5',
      priceAlertDays: 7,
    }
    const updatedSettings = {
      rebalanceThreshold: '10',
      priceAlertDays: 14,
    }
    vi.mocked(api.settings.get).mockResolvedValue(mockSettings)
    vi.mocked(api.settings.update).mockResolvedValue(updatedSettings)

    const { result } = renderHook(() => useSettings(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await result.current.updateSettings({ rebalanceThreshold: 10, priceAlertDays: 14 })

    expect(api.settings.update).toHaveBeenCalledWith({
      rebalanceThreshold: 10,
      priceAlertDays: 14,
    })
  })

  it('should handle loading state', async () => {
    vi.mocked(api.settings.get).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ rebalanceThreshold: '5', priceAlertDays: 7 }), 100))
    )

    const { result } = renderHook(() => useSettings(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.settings).toBeUndefined()

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.settings).toBeDefined()
  })
})
