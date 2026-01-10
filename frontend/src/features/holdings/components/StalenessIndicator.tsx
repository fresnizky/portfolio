import { isPriceStale, getDaysSinceUpdate } from '../utils/staleness'

interface StalenessIndicatorProps {
  priceUpdatedAt: string | null
  showDays?: boolean
}

export function StalenessIndicator({ priceUpdatedAt, showDays = false }: StalenessIndicatorProps) {
  if (priceUpdatedAt === null) {
    return (
      <span className="inline-flex items-center gap-1 text-yellow-600">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <span className="text-sm">No price set</span>
      </span>
    )
  }

  const stale = isPriceStale(priceUpdatedAt)
  const days = getDaysSinceUpdate(priceUpdatedAt)

  if (stale) {
    return (
      <span className="inline-flex items-center gap-1 text-yellow-600">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <span className="text-sm">{days} days old</span>
      </span>
    )
  }

  const formatDays = (d: number | null): string => {
    if (d === null) return ''
    if (d === 0) return 'Today'
    if (d === 1) return '1 day ago'
    return `${d} days ago`
  }

  return (
    <span className="inline-flex items-center gap-1 text-green-600">
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-label="Price is up to date"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
      {showDays && <span className="text-sm text-gray-500">{formatDays(days)}</span>}
    </span>
  )
}
