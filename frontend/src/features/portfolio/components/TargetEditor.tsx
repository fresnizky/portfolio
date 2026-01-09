import { useState, useMemo } from 'react'
import { TargetSumIndicator } from './TargetSumIndicator'
import { useBatchUpdateTargets } from '../hooks/useAssets'
import type { Asset, AssetCategory } from '@/types/api'

const categoryStyles: Record<AssetCategory, string> = {
  ETF: 'bg-blue-100 text-blue-800',
  FCI: 'bg-green-100 text-green-800',
  CRYPTO: 'bg-orange-100 text-orange-800',
  CASH: 'bg-gray-100 text-gray-800',
}

interface TargetEditorProps {
  assets: Asset[]
  onClose: () => void
  onSuccess?: () => void
}

export function TargetEditor({ assets, onClose, onSuccess }: TargetEditorProps) {
  const [pendingChanges, setPendingChanges] = useState<Map<string, number>>(() => {
    // Initialize with current values
    const initial = new Map<string, number>()
    assets.forEach(asset => {
      initial.set(asset.id, Number(asset.targetPercentage))
    })
    return initial
  })

  // Track validation errors for each input
  const [inputErrors, setInputErrors] = useState<Map<string, string>>(new Map())

  const batchUpdate = useBatchUpdateTargets()

  const handleTargetChange = (assetId: string, value: string) => {
    // Clear previous error for this field
    setInputErrors(prev => {
      const next = new Map(prev)
      next.delete(assetId)
      return next
    })

    // Validate input
    const trimmedValue = value.trim()
    
    // Empty string defaults to 0
    if (trimmedValue === '') {
      setPendingChanges(prev => {
        const next = new Map(prev)
        next.set(assetId, 0)
        return next
      })
      return
    }

    const numValue = parseFloat(trimmedValue)

    // Check for invalid number
    if (isNaN(numValue)) {
      setInputErrors(prev => {
        const next = new Map(prev)
        next.set(assetId, 'Must be a valid number')
        return next
      })
      return
    }

    // Check for negative values
    if (numValue < 0) {
      setInputErrors(prev => {
        const next = new Map(prev)
        next.set(assetId, 'Target must be >= 0')
        return next
      })
      return
    }

    setPendingChanges(prev => {
      const next = new Map(prev)
      next.set(assetId, numValue)
      return next
    })
  }

  const sum = useMemo(() => {
    let total = 0
    pendingChanges.forEach(value => {
      total += value
    })
    return Math.round(total * 100) / 100
  }, [pendingChanges])

  const hasInputErrors = inputErrors.size > 0
  const isValid = sum <= 100 && !hasInputErrors
  const hasChanges = useMemo(() => {
    for (const asset of assets) {
      const pending = pendingChanges.get(asset.id)
      const original = Number(asset.targetPercentage)
      if (pending !== original) {
        return true
      }
    }
    return false
  }, [assets, pendingChanges])

  const handleSave = async () => {
    if (!isValid) return

    const targets = Array.from(pendingChanges.entries()).map(([assetId, targetPercentage]) => ({
      assetId,
      targetPercentage,
    }))

    try {
      await batchUpdate.mutateAsync({ targets })
      onSuccess?.()
      onClose()
    } catch {
      // Error handled by mutation
    }
  }

  const handleCancel = () => {
    if (!batchUpdate.isPending) {
      onClose()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <TargetSumIndicator assets={assets} pendingChanges={pendingChanges} />
      </div>

      <div className="space-y-3">
        {assets.map(asset => (
          <div
            key={asset.id}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
          >
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${categoryStyles[asset.category]}`}
              >
                {asset.category}
              </span>
              <div>
                <span className="font-medium text-gray-900">{asset.ticker}</span>
                <span className="ml-2 text-sm text-gray-500">{asset.name}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={pendingChanges.get(asset.id) ?? 0}
                  onChange={(e) => handleTargetChange(asset.id, e.target.value)}
                  disabled={batchUpdate.isPending}
                  className={`w-20 rounded-md border px-2 py-1 text-right text-sm focus:outline-none focus:ring-1 disabled:bg-gray-100 ${
                    inputErrors.has(asset.id)
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  aria-label={`Target percentage for ${asset.ticker}`}
                  aria-invalid={inputErrors.has(asset.id)}
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
              {inputErrors.has(asset.id) && (
                <span className="text-xs text-red-600" role="alert">
                  {inputErrors.get(asset.id)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {batchUpdate.isError && (
        <p className="text-sm text-red-600">
          {batchUpdate.error?.message ?? 'Failed to update targets'}
        </p>
      )}

      {sum > 100 && (
        <p className="text-sm text-red-600">
          Targets cannot exceed 100%. Current sum: {sum}%
        </p>
      )}

      {sum < 100 && hasChanges && (
        <p className="text-sm text-amber-600">
          Warning: Targets sum to {sum}%. You have {Math.round((100 - sum) * 100) / 100}% unallocated.
        </p>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={handleCancel}
          disabled={batchUpdate.isPending}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!isValid || !hasChanges || batchUpdate.isPending}
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {batchUpdate.isPending && (
            <svg className="-ml-1 mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          Save Targets
        </button>
      </div>
    </div>
  )
}
