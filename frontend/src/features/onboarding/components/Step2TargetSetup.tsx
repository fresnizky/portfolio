import type { BatchAssetCreate } from '@/types/api'

interface Step2TargetSetupProps {
  assets: (BatchAssetCreate & { tempId: string })[]
  targets: Record<string, number>
  onSetTarget: (tempId: string, percentage: number) => void
  targetSum: number
  isValid: boolean
}

export function Step2TargetSetup({
  assets,
  targets,
  onSetTarget,
  targetSum,
  isValid,
}: Step2TargetSetupProps) {
  return (
    <div className="space-y-6">
      {/* Target Sum Indicator */}
      <div
        className={`p-4 rounded-lg border-2 ${
          isValid
            ? 'border-green-500 bg-green-50'
            : 'border-amber-500 bg-amber-50'
        }`}
      >
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-700">Total de targets:</span>
          <span
            className={`text-2xl font-bold ${
              isValid ? 'text-green-600' : 'text-amber-600'
            }`}
          >
            {targetSum.toFixed(1)}%
          </span>
        </div>
        {!isValid && (
          <p className="text-sm text-amber-600 mt-1">
            {targetSum < 100
              ? `Faltan ${(100 - targetSum).toFixed(1)}% para completar`
              : `Excede por ${(targetSum - 100).toFixed(1)}%`}
          </p>
        )}
        {isValid && (
          <p className="text-sm text-green-600 mt-1">
            Los targets suman exactamente 100%
          </p>
        )}
      </div>

      {/* Target Inputs */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-medium text-gray-900 mb-4">Asignar porcentajes objetivo</h3>
        <div className="space-y-4">
          {assets.map(asset => (
            <div key={asset.tempId} className="flex items-center gap-4">
              <div className="flex-1">
                <span className="font-mono text-gray-900">{asset.ticker}</span>
                <span className="text-gray-500 ml-2">{asset.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={targets[asset.tempId] || 0}
                  onChange={(e) => onSetTarget(asset.tempId, parseFloat(e.target.value) || 0)}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-500">%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
