import type { Asset } from '@/types/api'

interface TargetSumIndicatorProps {
  assets: Asset[]
  pendingChanges?: Map<string, number>  // For local edits before save
}

export function TargetSumIndicator({ assets, pendingChanges }: TargetSumIndicatorProps) {
  const sum = assets.reduce((acc, asset) => {
    const target = pendingChanges?.get(asset.id) ?? Number(asset.targetPercentage)
    return acc + target
  }, 0)

  const roundedSum = Math.round(sum * 100) / 100
  const difference = Math.round((roundedSum - 100) * 100) / 100
  const isValid = roundedSum === 100

  return (
    <div
      className={`flex items-center gap-2 text-sm font-medium ${
        isValid ? 'text-green-600' : 'text-red-600'
      }`}
      role="status"
      aria-live="polite"
    >
      {isValid ? (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ) : (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )}
      <span data-testid="sum-value">Sum: {roundedSum}%</span>
      {!isValid && (
        <span className="text-gray-500" data-testid="difference-value">
          ({difference > 0 ? '+' : ''}{difference}%)
        </span>
      )}
    </div>
  )
}
