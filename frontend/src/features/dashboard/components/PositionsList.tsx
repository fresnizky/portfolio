import { Link } from 'react-router'
import { formatCurrency, formatPercentage } from '@/lib/formatters'
import type { DashboardPosition } from '@/types/api'

interface PositionsListProps {
  positions: DashboardPosition[]
}

interface DeviationStyle {
  bg: string
  text: string
  label: string
}

function getDeviationStyle(deviation: string | null): DeviationStyle | null {
  if (deviation === null) {
    return null
  }

  const dev = parseFloat(deviation)

  if (Math.abs(dev) <= 1) {
    return { bg: 'bg-green-100', text: 'text-green-700', label: 'Balanced' }
  }
  if (dev > 1) {
    return { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Overweight' }
  }
  return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Underweight' }
}

export function PositionsList({ positions }: PositionsListProps) {
  if (positions.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        No positions to display
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100">
      {positions.map((position) => {
        const hasPriceSet = position.priceStatus === 'set'
        const deviationStyle = getDeviationStyle(position.deviation)
        const deviationValue = position.deviation !== null ? parseFloat(position.deviation) : null

        return (
          <div key={position.assetId} className="py-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-gray-900">{position.ticker}</p>
                <p className="text-base md:text-sm text-gray-500">{position.name}</p>
              </div>
              <div className="text-right">
                {hasPriceSet && position.value !== null ? (
                  <>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(position.value, position.displayCurrency)}
                    </p>
                    {position.originalCurrency !== position.displayCurrency && position.originalValue !== null && (
                      <p className="text-sm md:text-xs text-gray-500">
                        ({formatCurrency(position.originalValue, position.originalCurrency)})
                      </p>
                    )}
                  </>
                ) : (
                  <Link
                    to="/prices"
                    className="text-amber-600 hover:text-amber-700 font-medium"
                  >
                    Set price →
                  </Link>
                )}
                {hasPriceSet && deviationStyle ? (
                  <span className={`inline-block rounded-full px-2 py-0.5 text-sm md:text-xs font-medium ${deviationStyle.bg} ${deviationStyle.text}`}>
                    {deviationStyle.label}
                  </span>
                ) : (
                  <span className="inline-block rounded-full px-2 py-0.5 text-sm md:text-xs font-medium bg-amber-100 text-amber-700">
                    No price
                  </span>
                )}
              </div>
            </div>

            <div className="mt-2 flex items-center gap-4 text-base md:text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Actual:</span>
                <span className="font-medium">
                  {position.actualPercentage !== null ? formatPercentage(position.actualPercentage) : '—'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Target:</span>
                <span className="font-medium">
                  {position.targetPercentage ? formatPercentage(position.targetPercentage) : '—'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Dev:</span>
                <span className={`font-medium ${deviationStyle ? deviationStyle.text : 'text-gray-400'}`}>
                  {deviationValue !== null
                    ? `${deviationValue > 0 ? '+' : ''}${formatPercentage(position.deviation!)}`
                    : '—'}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
