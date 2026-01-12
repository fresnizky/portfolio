import { useExchangeRate } from '@/features/exchange-rates/hooks/useExchangeRate'
import { formatCurrency, formatDate } from '@/lib/formatters'

export function ExchangeRateSection() {
  const { data: exchangeRate, isLoading, error } = useExchangeRate()

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-32" />
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="h-4 bg-gray-200 rounded w-40" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-600">
        Error al cargar tipo de cambio
      </div>
    )
  }

  if (!exchangeRate) {
    return null
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Tipo de Cambio</h3>

      {/* Current Rate */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Cotizacion USD/ARS</p>
          <p className="text-xl font-semibold">
            1 USD = {formatCurrency(exchangeRate.rate, 'ARS')}
          </p>
        </div>

        {exchangeRate.isStale && (
          <div className="flex items-center gap-1 text-amber-600">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="text-sm">Desactualizado</span>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="text-sm text-gray-500 space-y-1">
        <p>
          Actualizado: {formatDate(exchangeRate.fetchedAt, 'full')}
        </p>
        <p>
          Fuente: {exchangeRate.source === 'bluelytics' ? 'Bluelytics' : exchangeRate.source}
        </p>
      </div>
    </div>
  )
}
