import type { Asset, AssetCategory } from '@/types/api'

const categoryStyles: Record<AssetCategory, string> = {
  ETF: 'bg-blue-100 text-blue-800',
  FCI: 'bg-green-100 text-green-800',
  CRYPTO: 'bg-orange-100 text-orange-800',
  CASH: 'bg-gray-100 text-gray-800',
}

interface AssetCardProps {
  asset: Asset
  onEdit: (asset: Asset) => void
  onDelete: (asset: Asset) => void
}

export function AssetCard({ asset, onEdit, onDelete }: AssetCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-sm md:text-xs font-medium ${categoryStyles[asset.category]}`}
          >
            {asset.category}
          </span>
          <span className="text-base md:text-sm font-medium text-gray-500">{asset.ticker}</span>
          <span className="text-sm md:text-xs text-gray-400">({asset.currency})</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(asset)}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label={`Edit ${asset.ticker}`}
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
          <button
            onClick={() => onDelete(asset)}
            className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
            aria-label={`Delete ${asset.ticker}`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
      <h3 className="mt-2 text-base font-semibold text-gray-900">{asset.name}</h3>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-base md:text-sm text-gray-500">Target</span>
        <span className="text-lg font-semibold text-gray-900">
          {Number(asset.targetPercentage).toFixed(1)}%
        </span>
      </div>
    </div>
  )
}
