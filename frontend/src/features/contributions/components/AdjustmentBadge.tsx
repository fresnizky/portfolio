interface AdjustmentBadgeProps {
  adjustmentReason: 'underweight' | 'overweight' | null
  baseAllocation: string
  adjustedAllocation: string
}

export function AdjustmentBadge({
  adjustmentReason,
  baseAllocation,
  adjustedAllocation,
}: AdjustmentBadgeProps) {
  if (!adjustmentReason) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Balanceado
      </span>
    )
  }

  const base = parseFloat(baseAllocation)
  const adjusted = parseFloat(adjustedAllocation)
  const difference = Math.abs(adjusted - base)
  const formattedDiff = difference.toFixed(2)

  if (adjustmentReason === 'underweight') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
        +${formattedDiff}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
      -${formattedDiff}
    </span>
  )
}
