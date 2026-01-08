import { AssetList } from './components/AssetList'

export function PortfolioPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Portfolio Configuration
        </h1>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <AssetList />
      </div>
    </div>
  )
}
