import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePendingContribution } from './usePendingContribution'
import type { ContributionAllocation } from '@/types/api'

const mockAllocations: ContributionAllocation[] = [
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
]

const STORAGE_KEY = 'contribution-prefill'

describe('usePendingContribution', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return null when no pending contribution exists', () => {
    const { result } = renderHook(() => usePendingContribution())

    expect(result.current.pending).toBeNull()
    expect(result.current.hasPending).toBe(false)
  })

  it('should load pending contribution from sessionStorage', () => {
    const prefillData = {
      amount: 1000,
      allocations: mockAllocations,
      timestamp: Date.now(),
      processedAssetIds: [],
      status: 'pending' as const,
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(prefillData))

    const { result } = renderHook(() => usePendingContribution())

    expect(result.current.pending).toEqual(prefillData)
    expect(result.current.hasPending).toBe(true)
  })

  it('should migrate old format data without processedAssetIds', () => {
    const oldFormatData = {
      amount: 1000,
      allocations: mockAllocations,
      timestamp: Date.now(),
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(oldFormatData))

    const { result } = renderHook(() => usePendingContribution())

    expect(result.current.pending?.processedAssetIds).toEqual([])
    expect(result.current.pending?.status).toBe('pending')
  })

  it('should filter remaining allocations', () => {
    const prefillData = {
      amount: 1000,
      allocations: mockAllocations,
      timestamp: Date.now(),
      processedAssetIds: ['asset-1'],
      status: 'in_progress' as const,
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(prefillData))

    const { result } = renderHook(() => usePendingContribution())

    expect(result.current.remainingAllocations).toHaveLength(1)
    expect(result.current.remainingAllocations[0].assetId).toBe('asset-2')
  })

  it('should mark asset as processed', () => {
    const prefillData = {
      amount: 1000,
      allocations: mockAllocations,
      timestamp: Date.now(),
      processedAssetIds: [],
      status: 'pending' as const,
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(prefillData))

    const { result } = renderHook(() => usePendingContribution())

    act(() => {
      result.current.markAssetProcessed('asset-1')
    })

    expect(result.current.pending?.processedAssetIds).toContain('asset-1')
    expect(result.current.pending?.status).toBe('in_progress')

    // Verify sessionStorage is updated
    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY)!)
    expect(stored.processedAssetIds).toContain('asset-1')
  })

  it('should complete the contribution flow', () => {
    const prefillData = {
      amount: 1000,
      allocations: mockAllocations,
      timestamp: Date.now(),
      processedAssetIds: ['asset-1', 'asset-2'],
      status: 'in_progress' as const,
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(prefillData))

    const { result } = renderHook(() => usePendingContribution())

    act(() => {
      result.current.complete()
    })

    expect(result.current.pending?.status).toBe('completed')
    expect(result.current.hasPending).toBe(false)
  })

  it('should clear pending contribution', () => {
    const prefillData = {
      amount: 1000,
      allocations: mockAllocations,
      timestamp: Date.now(),
      processedAssetIds: [],
      status: 'pending' as const,
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(prefillData))

    const { result } = renderHook(() => usePendingContribution())

    act(() => {
      result.current.clear()
    })

    expect(result.current.pending).toBeNull()
    expect(result.current.hasPending).toBe(false)
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('should detect expired contribution (older than 24 hours)', () => {
    const twentyFiveHoursAgo = Date.now() - 25 * 60 * 60 * 1000
    const prefillData = {
      amount: 1000,
      allocations: mockAllocations,
      timestamp: twentyFiveHoursAgo,
      processedAssetIds: [],
      status: 'pending' as const,
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(prefillData))

    const { result } = renderHook(() => usePendingContribution())

    // Should clear expired data
    expect(result.current.pending).toBeNull()
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('should refresh pending state', () => {
    const { result } = renderHook(() => usePendingContribution())

    // Initially no pending
    expect(result.current.pending).toBeNull()

    // Add data to sessionStorage externally
    const prefillData = {
      amount: 1000,
      allocations: mockAllocations,
      timestamp: Date.now(),
      processedAssetIds: [],
      status: 'pending' as const,
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(prefillData))

    // Refresh should pick up the new data
    act(() => {
      result.current.refresh()
    })

    expect(result.current.pending).toEqual(prefillData)
  })
})
