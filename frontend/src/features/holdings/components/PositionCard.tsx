import type { Position, AssetCategory } from '@/types/api'
import { StalenessIndicator } from './StalenessIndicator'
import { formatQuantity } from '@/lib/formatters'

const categoryStyles: Record<AssetCategory, string> = {
  ETF: 'bg-blue-100 text-blue-800',
  FCI: 'bg-green-100 text-green-800',
  CRYPTO: 'bg-orange-100 text-orange-800',
  CASH: 'bg-gray-100 text-gray-800',
}

function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

interface PositionCardProps {
  position: Position
  onUpdatePrice: (position: Position) => void
}

export function PositionCard({ position, onUpdatePrice }: PositionCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryStyles[position.category]}`}
          >
            {position.category}
          </span>
          <span className="text-sm font-medium text-gray-500">{position.ticker}</span>
        </div>
        <button
          onClick={() => onUpdatePrice(position)}
          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label={`Update price for ${position.ticker}`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </button>
      </div>

      <h3 className="mt-2 text-base font-semibold text-gray-900">{position.name}</h3>

      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Quantity</span>
          <span className="font-medium text-gray-900">{formatQuantity(position.quantity)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Price</span>
          <span className="font-medium text-gray-900">
            {position.currentPrice ? formatCurrency(position.currentPrice) : 'No price set'}
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-2">
          <span className="text-sm font-medium text-gray-500">Value</span>
          <span className="text-lg font-semibold text-gray-900">{formatCurrency(position.value)}</span>
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <StalenessIndicator priceUpdatedAt={position.priceUpdatedAt} showDays />
      </div>
    </div>
  )
}
