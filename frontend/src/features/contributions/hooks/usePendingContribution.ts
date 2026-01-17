import { useState, useCallback, useEffect } from 'react'
import type { ContributionAllocation } from '@/types/api'

const STORAGE_KEY = 'contribution-prefill'
const EXPIRY_HOURS = 24

export interface PendingContribution {
  amount: number
  allocations: ContributionAllocation[]
  timestamp: number
  processedAssetIds: string[]
  status: 'pending' | 'in_progress' | 'completed'
}

export function usePendingContribution() {
  const [pending, setPending] = useState<PendingContribution | null>(null)

  const loadPending = useCallback((): PendingContribution | null => {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (!stored) return null

    try {
      const data = JSON.parse(stored) as PendingContribution

      // Check expiry
      const hoursSinceCreated = (Date.now() - data.timestamp) / (1000 * 60 * 60)
      if (hoursSinceCreated > EXPIRY_HOURS) {
        sessionStorage.removeItem(STORAGE_KEY)
        return null
      }

      // Migrate old format (no processedAssetIds)
      if (!data.processedAssetIds) {
        data.processedAssetIds = []
        data.status = 'pending'
      }

      return data
    } catch {
      sessionStorage.removeItem(STORAGE_KEY)
      return null
    }
  }, [])

  useEffect(() => {
    setPending(loadPending())
  }, [loadPending])

  const markAssetProcessed = useCallback((assetId: string) => {
    setPending((prev) => {
      if (!prev) return null
      const updated: PendingContribution = {
        ...prev,
        processedAssetIds: [...prev.processedAssetIds, assetId],
        status: 'in_progress',
      }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const complete = useCallback(() => {
    setPending((prev) => {
      if (!prev) return null
      const updated: PendingContribution = { ...prev, status: 'completed' }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const clear = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY)
    setPending(null)
  }, [])

  const refresh = useCallback(() => {
    setPending(loadPending())
  }, [loadPending])

  const remainingAllocations =
    pending?.allocations.filter(
      (a) => !pending.processedAssetIds.includes(a.assetId)
    ) ?? []

  return {
    pending,
    remainingAllocations,
    hasPending: !!pending && pending.status !== 'completed',
    isExpired: pending
      ? (Date.now() - pending.timestamp) / (1000 * 60 * 60) > EXPIRY_HOURS
      : false,
    markAssetProcessed,
    complete,
    clear,
    refresh,
  }
}
