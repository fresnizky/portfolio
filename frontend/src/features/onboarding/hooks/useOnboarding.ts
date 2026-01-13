import { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import type { BatchAssetCreate } from '@/types/api'

interface OnboardingAsset extends BatchAssetCreate {
  tempId: string
}

interface OnboardingData {
  assets: OnboardingAsset[]
  targets: Record<string, number> // tempId -> percentage
  holdings: Record<string, { quantity: number; price?: number }> // tempId -> data
}

export function useOnboarding() {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<OnboardingData>({
    assets: [],
    targets: {},
    holdings: {},
  })

  const queryClient = useQueryClient()

  const addAsset = useCallback((asset: BatchAssetCreate) => {
    const tempId = crypto.randomUUID()
    setData(prev => ({
      ...prev,
      assets: [...prev.assets, { ...asset, tempId }],
      targets: { ...prev.targets, [tempId]: 0 },
      holdings: { ...prev.holdings, [tempId]: { quantity: 0 } },
    }))
  }, [])

  const removeAsset = useCallback((tempId: string) => {
    setData(prev => {
      const { [tempId]: _t, ...targets } = prev.targets
      const { [tempId]: _h, ...holdings } = prev.holdings
      return {
        ...prev,
        assets: prev.assets.filter(a => a.tempId !== tempId),
        targets,
        holdings,
      }
    })
  }, [])

  const setTarget = useCallback((tempId: string, percentage: number) => {
    setData(prev => ({
      ...prev,
      targets: { ...prev.targets, [tempId]: percentage },
    }))
  }, [])

  const setHolding = useCallback((tempId: string, quantity: number, price?: number) => {
    setData(prev => ({
      ...prev,
      holdings: { ...prev.holdings, [tempId]: { quantity, price } },
    }))
  }, [])

  const targetSum = Object.values(data.targets).reduce((sum, v) => sum + v, 0)
  const isTargetValid = Math.abs(targetSum - 100) < 0.01 // Allow 0.01 tolerance

  const canProceed = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1: return data.assets.length > 0
      case 2: return isTargetValid
      case 3: return true // Holdings are optional
      default: return false
    }
  }

  const completeMutation = useMutation({
    mutationFn: async () => {
      // 1. Create assets
      const createdAssets = await api.onboarding.batchCreateAssets(
        data.assets.map(({ tempId: _tempId, ...a }) => a)
      )

      // Build tempId -> realId map
      const idMap = new Map<string, string>()
      data.assets.forEach((a, i) => {
        idMap.set(a.tempId, createdAssets[i].id)
      })

      // 2. Update targets
      const targets = data.assets.map(a => ({
        assetId: idMap.get(a.tempId)!,
        targetPercentage: data.targets[a.tempId],
      }))
      await api.onboarding.batchUpdateTargets(targets)

      // 3. Create holdings (only for assets with quantity > 0)
      const holdings = data.assets
        .filter(a => data.holdings[a.tempId].quantity > 0)
        .map(a => ({
          assetId: idMap.get(a.tempId)!,
          ...data.holdings[a.tempId],
        }))

      if (holdings.length > 0) {
        await api.onboarding.batchCreateHoldings(holdings)
      }

      // 4. Mark onboarding complete
      await api.onboarding.complete()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.holdings.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.all })
    },
  })

  const skipMutation = useMutation({
    mutationFn: () => api.onboarding.skip(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.all })
    },
  })

  return {
    step,
    setStep,
    data,
    addAsset,
    removeAsset,
    setTarget,
    setHolding,
    targetSum,
    isTargetValid,
    canProceed,
    complete: completeMutation.mutateAsync,
    skip: skipMutation.mutateAsync,
    isCompleting: completeMutation.isPending,
    isSkipping: skipMutation.isPending,
    error: completeMutation.error || skipMutation.error,
  }
}
