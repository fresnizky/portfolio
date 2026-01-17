import type { ContributionAllocation } from '@/types/api'
import { formatCurrency } from '@/lib/formatters'

interface ContributionTransactionFlowProps {
  allocations: ContributionAllocation[]
  processedAssetIds: string[]
  onSkip: (assetId: string) => void
  onCancel: () => void
  displayCurrency: string
  isSubmitting?: boolean
  renderForm?: (currentAllocation: ContributionAllocation) => React.ReactNode
}

export function ContributionTransactionFlow({
  allocations,
  processedAssetIds,
  onSkip,
  onCancel,
  displayCurrency,
  isSubmitting = false,
  renderForm,
}: ContributionTransactionFlowProps) {
  // Filter out already processed assets
  const remainingAllocations = allocations.filter(
    (a) => !processedAssetIds.includes(a.assetId)
  )

  // If all assets processed, return null
  if (remainingAllocations.length === 0) {
    return null
  }

  const currentAllocation = remainingAllocations[0]
  const totalCount = allocations.length
  const processedCount = processedAssetIds.length
  const currentIndex = processedCount + 1

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="rounded-lg bg-blue-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-blue-900">{currentAllocation.ticker}</p>
            <p className="text-sm text-blue-700">{currentAllocation.name}</p>
            <p className="mt-1 text-sm text-blue-600">
              Monto sugerido: {formatCurrency(currentAllocation.adjustedAllocation, displayCurrency)}
            </p>
          </div>
          <span className="text-sm font-medium text-blue-600">
            {currentIndex} de {totalCount}
          </span>
        </div>
      </div>

      {/* Form slot - render prop pattern */}
      {renderForm && renderForm(currentAllocation)}

      {/* Action buttons */}
      <div className="flex items-center justify-between border-t pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
        >
          Cancelar
        </button>

        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400">
            Pendiente: {remainingAllocations.length}
          </span>
          <button
            type="button"
            onClick={() => onSkip(currentAllocation.assetId)}
            disabled={isSubmitting}
            className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            Omitir este activo
          </button>
        </div>
      </div>
    </div>
  )
}
