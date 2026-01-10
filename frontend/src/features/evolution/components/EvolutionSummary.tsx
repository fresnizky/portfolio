import { formatCurrency, formatPercentage, formatDate } from '@/lib/formatters'
import type { Snapshot } from '@/types/api'

interface EvolutionSummaryProps {
  snapshots: Snapshot[]
}

export function EvolutionSummary({ snapshots }: EvolutionSummaryProps) {
  if (snapshots.length === 0) {
    return null
  }

  // Sort by date ascending to get first and last
  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const firstSnapshot = sorted[0]
  const lastSnapshot = sorted[sorted.length - 1]

  const startValue = parseFloat(firstSnapshot.totalValue)
  const endValue = parseFloat(lastSnapshot.totalValue)
  const absoluteChange = endValue - startValue
  const percentChange = startValue > 0 ? ((endValue - startValue) / startValue) * 100 : 0
  const isPositive = absoluteChange >= 0

  const changeColorClass = isPositive ? 'text-green-600' : 'text-red-600'

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
      <div className="bg-white border rounded-lg p-4">
        <p className="text-sm text-gray-500">Valor inicial</p>
        <p className="text-xl font-semibold">{formatCurrency(startValue)}</p>
        <p className="text-xs text-gray-400">
          {formatDate(firstSnapshot.date, 'short')}
        </p>
      </div>

      <div className="bg-white border rounded-lg p-4">
        <p className="text-sm text-gray-500">Valor actual</p>
        <p className="text-xl font-semibold">{formatCurrency(endValue)}</p>
        <p className="text-xs text-gray-400">
          {formatDate(lastSnapshot.date, 'short')}
        </p>
      </div>

      <div className="bg-white border rounded-lg p-4">
        <p className="text-sm text-gray-500">Cambio absoluto</p>
        <p className={`text-xl font-semibold ${changeColorClass}`}>
          {isPositive ? '+' : ''}{formatCurrency(absoluteChange)}
        </p>
      </div>

      <div className="bg-white border rounded-lg p-4">
        <p className="text-sm text-gray-500">Cambio porcentual</p>
        <p className={`text-xl font-semibold ${changeColorClass}`}>
          {isPositive ? '+' : ''}{formatPercentage(percentChange)}
        </p>
      </div>
    </div>
  )
}
