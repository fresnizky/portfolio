import { useNavigate } from 'react-router'
import type { DashboardAlert } from '@/types/api'

interface AlertItemProps {
  alert: DashboardAlert
}

function ClockIcon() {
  return (
    <svg
      data-testid="alert-icon-clock"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function ScaleIcon() {
  return (
    <svg
      data-testid="alert-icon-scale"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <line x1="12" y1="3" x2="12" y2="21" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="3" y1="21" x2="21" y2="21" />
      <path d="M4 14l4 7h-8z" />
      <path d="M20 14l4 7h-8z" />
    </svg>
  )
}

function PriceTagIcon() {
  return (
    <svg
      data-testid="alert-icon-price"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
      <path d="M12 6v2m0 8v2m-4-6h1.5m5 0H16" />
      <path d="M9.5 14.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5" />
      <path d="M14.5 9.5c0-1.38-1.12-2.5-2.5-2.5S9.5 8.12 9.5 9.5" />
    </svg>
  )
}

export function AlertItem({ alert }: AlertItemProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    switch (alert.type) {
      case 'stale_price':
        navigate('/portfolio')
        break
      case 'rebalance_needed':
        navigate('/portfolio')
        break
      case 'missing_price':
        navigate('/prices')
        break
    }
  }

  const getIcon = () => {
    switch (alert.type) {
      case 'stale_price':
        return <ClockIcon />
      case 'rebalance_needed':
        return <ScaleIcon />
      case 'missing_price':
        return <PriceTagIcon />
      default:
        return null
    }
  }

  const getBgColor = () => {
    switch (alert.severity) {
      case 'warning':
        return 'bg-amber-50 border-amber-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getDeviationText = () => {
    if (alert.type !== 'rebalance_needed' || !alert.data?.deviation) return null
    const sign = alert.data.direction === 'overweight' ? '+' : '-'
    return `${sign}${alert.data.deviation}% deviation`
  }

  const getDaysOldText = () => {
    if (alert.type !== 'stale_price' || !alert.data?.daysOld) return null
    return `Last updated ${alert.data.daysOld} days ago`
  }

  return (
    <button
      onClick={handleClick}
      data-testid={`alert-item-${alert.assetId}`}
      className={`w-full rounded-lg border p-3 text-left transition-colors hover:opacity-80 ${getBgColor()}`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-gray-600">{getIcon()}</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{alert.ticker}</p>
          <p className="text-sm text-gray-600">{alert.message}</p>
          {getDaysOldText() && (
            <p className="mt-1 text-xs text-amber-700">{getDaysOldText()}</p>
          )}
          {getDeviationText() && (
            <p className="mt-1 text-xs text-amber-700">{getDeviationText()}</p>
          )}
        </div>
        <span className="text-gray-400">→</span>
      </div>
    </button>
  )
}
