import type { Asset } from '@/types/api'
import type { TransactionListFilters } from '@/types/api'

interface TransactionFiltersProps {
  assets: Asset[]
  filters: TransactionListFilters
  onFiltersChange: (filters: TransactionListFilters) => void
}

export function TransactionFilters({
  assets,
  filters,
  onFiltersChange,
}: TransactionFiltersProps) {
  const handleAssetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({ ...filters, assetId: e.target.value || undefined })
  }

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as 'buy' | 'sell' | ''
    onFiltersChange({ ...filters, type: value || undefined })
  }

  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, fromDate: e.target.value || undefined })
  }

  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, toDate: e.target.value || undefined })
  }

  const handleReset = () => {
    onFiltersChange({})
  }

  const hasActiveFilters =
    filters.assetId || filters.type || filters.fromDate || filters.toDate

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg bg-gray-50 p-4">
      <div>
        <label
          htmlFor="filter-asset"
          className="block text-sm font-medium text-gray-700"
        >
          Asset
        </label>
        <select
          id="filter-asset"
          value={filters.assetId || ''}
          onChange={handleAssetChange}
          className="mt-1 block rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Assets</option>
          {assets.map((asset) => (
            <option key={asset.id} value={asset.id}>
              {asset.ticker}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="filter-type"
          className="block text-sm font-medium text-gray-700"
        >
          Type
        </label>
        <select
          id="filter-type"
          value={filters.type || ''}
          onChange={handleTypeChange}
          className="mt-1 block rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Types</option>
          <option value="buy">Buy</option>
          <option value="sell">Sell</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="filter-from-date"
          className="block text-sm font-medium text-gray-700"
        >
          From Date
        </label>
        <input
          id="filter-from-date"
          type="date"
          value={filters.fromDate || ''}
          onChange={handleFromDateChange}
          className="mt-1 block rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label
          htmlFor="filter-to-date"
          className="block text-sm font-medium text-gray-700"
        >
          To Date
        </label>
        <input
          id="filter-to-date"
          type="date"
          value={filters.toDate || ''}
          onChange={handleToDateChange}
          className="mt-1 block rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={handleReset}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Reset Filters
        </button>
      )}
    </div>
  )
}
