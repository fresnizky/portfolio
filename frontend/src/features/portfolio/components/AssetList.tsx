import { useAssets } from '../hooks/useAssets'
import type { Asset, AssetCategory } from '@/types/api'

const categoryStyles: Record<AssetCategory, string> = {
  ETF: 'bg-blue-100 text-blue-800',
  FCI: 'bg-green-100 text-green-800',
  CRYPTO: 'bg-orange-100 text-orange-800',
  CASH: 'bg-gray-100 text-gray-800',
}

interface AssetRowProps {
  asset: Asset
}

function AssetRow({ asset }: AssetRowProps) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-4 pr-4">
        <span className="font-medium text-gray-900">{asset.ticker}</span>
      </td>
      <td className="py-4 pr-4">
        <span className="text-gray-700">{asset.name}</span>
      </td>
      <td className="py-4 pr-4">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryStyles[asset.category]}`}
        >
          {asset.category}
        </span>
      </td>
      <td className="py-4 text-right">
        <span className="font-medium text-gray-900">
          {Number(asset.targetPercentage).toFixed(1)}%
        </span>
      </td>
    </tr>
  )
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="h-4 w-16 rounded bg-gray-200" />
          <div className="h-4 w-48 rounded bg-gray-200" />
          <div className="h-4 w-16 rounded bg-gray-200" />
          <div className="ml-auto h-4 w-12 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="py-12 text-center">
      <p className="text-gray-500">No assets yet. Add your first asset to get started.</p>
    </div>
  )
}

interface ErrorStateProps {
  message: string
}

function ErrorState({ message }: ErrorStateProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="text-sm text-red-700">{message}</p>
    </div>
  )
}

export function AssetList() {
  const { data: assets, isLoading, isError, error } = useAssets()

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (isError) {
    return <ErrorState message={error?.message ?? 'Failed to load assets'} />
  }

  if (!assets || assets.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 text-left text-sm font-medium text-gray-500">
            <th className="pb-3 pr-4">Ticker</th>
            <th className="pb-3 pr-4">Name</th>
            <th className="pb-3 pr-4">Category</th>
            <th className="pb-3 text-right">Target</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => (
            <AssetRow key={asset.id} asset={asset} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
