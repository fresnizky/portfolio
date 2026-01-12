import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useState } from 'react'
import { api } from '@/lib/api'
import type { ExchangeRateInfo } from '@/types/api'

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg
      data-testid="refresh-icon"
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  )
}

function AlertTriangleIcon({ className }: { className?: string }) {
  return (
    <svg
      data-testid="alert-triangle-icon"
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  )
}

interface ExchangeRateIndicatorProps {
  exchangeRate: ExchangeRateInfo | null
  onRefresh?: () => void
}

export function ExchangeRateIndicator({
  exchangeRate,
  onRefresh,
}: ExchangeRateIndicatorProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  if (!exchangeRate) {
    return null
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await api.exchangeRates.getCurrent()
      onRefresh?.()
    } catch {
      // Error is handled silently - user can try again
    } finally {
      setIsRefreshing(false)
    }
  }

  const lastUpdated = formatDistanceToNow(new Date(exchangeRate.fetchedAt), {
    addSuffix: true,
    locale: es,
  })

  return (
    <div
      data-testid="exchange-rate-indicator"
      className="flex items-center gap-2 text-base md:text-sm text-gray-500"
    >
      {exchangeRate.isStale && (
        <span
          data-testid="stale-badge"
          className="flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-sm md:text-xs text-yellow-700"
          title="El tipo de cambio puede estar desactualizado"
        >
          <AlertTriangleIcon className="h-3 w-3" />
          Desactualizado
        </span>
      )}

      <span data-testid="exchange-rate-value">
        USD/ARS: ${exchangeRate.usdToArs.toFixed(2)}
      </span>

      <span data-testid="exchange-rate-time" className="text-gray-400">
        ({lastUpdated})
      </span>

      <button
        data-testid="refresh-button"
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="rounded p-1 hover:bg-gray-100 disabled:opacity-50"
        title="Actualizar tipo de cambio"
      >
        <RefreshIcon
          className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
        />
      </button>
    </div>
  )
}
