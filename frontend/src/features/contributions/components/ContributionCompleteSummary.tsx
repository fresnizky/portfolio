import { formatCurrency } from '@/lib/formatters'

interface ContributionCompleteSummaryProps {
  totalAmount: number
  recordedCount: number
  skippedCount: number
  displayCurrency?: string
  onViewTransactions: () => void
  onClose: () => void
}

export function ContributionCompleteSummary({
  totalAmount,
  recordedCount,
  skippedCount,
  displayCurrency = 'USD',
  onViewTransactions,
  onClose,
}: ContributionCompleteSummaryProps) {
  return (
    <div className="space-y-4 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
        <svg
          className="h-8 w-8 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900">Aporte Registrado</h3>
        <p className="mt-1 text-sm text-gray-500">
          Has completado el registro de tu aporte mensual
        </p>
      </div>

      <div className="rounded-lg bg-gray-50 p-4">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">Monto total</dt>
            <dd className="font-medium text-gray-900">
              {formatCurrency(totalAmount.toFixed(2), displayCurrency)}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Transacciones</dt>
            <dd className="font-medium text-gray-900">
              {recordedCount} registradas
              {skippedCount > 0 && (
                <span className="text-gray-400">
                  {' '}
                  ({skippedCount} omitida{skippedCount > 1 ? 's' : ''})
                </span>
              )}
            </dd>
          </div>
        </dl>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onViewTransactions}
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Ver Transacciones
        </button>
        <button
          onClick={onClose}
          className="flex-1 rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}
