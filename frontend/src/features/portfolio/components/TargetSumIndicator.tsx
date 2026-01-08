import type { Asset } from '@/types/api'

interface TargetSumIndicatorProps {
  assets: Asset[]
  pendingChanges?: Map<string, number>  // For local edits before save
}

type IndicatorState = 'valid' | 'under' | 'over'

function getIndicatorState(sum: number): IndicatorState {
  if (sum === 100) return 'valid'
  if (sum < 100) return 'under'
  return 'over'
}

const stateStyles: Record<IndicatorState, string> = {
  valid: 'text-green-600',
  under: 'text-amber-600',
  over: 'text-red-600',
}

// Checkmark icon for valid state (sum = 100%)
function CheckmarkIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
      data-testid="icon-checkmark"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}

// Warning triangle icon for under state (sum < 100%)
function WarningIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
      data-testid="icon-warning"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  )
}

// X-mark icon for over state (sum > 100%)
function ErrorIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
      data-testid="icon-error"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}

export function TargetSumIndicator({ assets, pendingChanges }: TargetSumIndicatorProps) {
  const sum = assets.reduce((acc, asset) => {
    const target = pendingChanges?.get(asset.id) ?? Number(asset.targetPercentage)
    return acc + target
  }, 0)

  const roundedSum = Math.round(sum * 100) / 100
  const difference = Math.round((roundedSum - 100) * 100) / 100
  const state = getIndicatorState(roundedSum)

  const renderIcon = () => {
    switch (state) {
      case 'valid':
        return <CheckmarkIcon />
      case 'under':
        return <WarningIcon />
      case 'over':
        return <ErrorIcon />
    }
  }

  return (
    <div
      className={`flex items-center gap-2 text-sm font-medium ${stateStyles[state]}`}
      role="status"
      aria-live="polite"
    >
      {renderIcon()}
      <span data-testid="sum-value">Sum: {roundedSum}%</span>
      {state !== 'valid' && (
        <span className="text-gray-500" data-testid="difference-value">
          ({difference > 0 ? '+' : ''}{difference}%)
        </span>
      )}
    </div>
  )
}
