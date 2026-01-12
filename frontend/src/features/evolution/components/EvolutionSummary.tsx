import { formatCurrency, formatPercentage, formatDate } from '@/lib/formatters'
import type { Snapshot, Currency } from '@/types/api'

interface EvolutionSummaryProps {
  snapshots: Snapshot[]
  displayCurrency?: Currency
  exchangeRate?: number | null
}

export function EvolutionSummary({
  snapshots,
  displayCurrency = 'USD',
  exchangeRate,
}: EvolutionSummaryProps) {
  if (snapshots.length === 0) {
    return null
  }

  // Determine effective currency (fallback to USD if no exchange rate for ARS)
  const canConvert = displayCurrency === 'ARS' && exchangeRate != null
  const effectiveCurrency = canConvert ? 'ARS' : 'USD'

  // Convert value based on currency
  const convertValue = (usdValue: number): number => {
    if (canConvert && exchangeRate) {
      return usdValue * exchangeRate
    }
    return usdValue
  }

  // Sort by date ascending to get first and last
  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const firstSnapshot = sorted[0]
  const lastSnapshot = sorted[sorted.length - 1]

  const startValueUSD = parseFloat(firstSnapshot.totalValue)
  const endValueUSD = parseFloat(lastSnapshot.totalValue)

  const startValue = convertValue(startValueUSD)
  const endValue = convertValue(endValueUSD)
  const absoluteChange = endValue - startValue

  // Percentage change is currency-agnostic (same in USD or ARS)
  const percentChange = startValueUSD > 0
    ? ((endValueUSD - startValueUSD) / startValueUSD) * 100
    : 0
  const isPositive = absoluteChange >= 0

  const changeColorClass = isPositive ? 'text-green-600' : 'text-red-600'

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
      <div className="bg-white border rounded-lg p-4">
        <p className="text-sm text-gray-500">Valor inicial</p>
        <p className="text-xl font-semibold">
          {formatCurrency(startValue, effectiveCurrency)}
        </p>
        <p className="text-xs text-gray-400">
          {formatDate(firstSnapshot.date, 'short')}
        </p>
      </div>

      <div className="bg-white border rounded-lg p-4">
        <p className="text-sm text-gray-500">Valor actual</p>
        <p className="text-xl font-semibold">
          {formatCurrency(endValue, effectiveCurrency)}
        </p>
        <p className="text-xs text-gray-400">
          {formatDate(lastSnapshot.date, 'short')}
        </p>
      </div>

      <div className="bg-white border rounded-lg p-4">
        <p className="text-sm text-gray-500">Cambio absoluto</p>
        <p className={`text-xl font-semibold ${changeColorClass}`}>
          {isPositive ? '+' : ''}{formatCurrency(absoluteChange, effectiveCurrency)}
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
