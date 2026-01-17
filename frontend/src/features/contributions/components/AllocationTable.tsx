import { useState } from 'react'
import type { ContributionAllocation } from '@/types/api'
import { AdjustmentBadge } from './AdjustmentBadge'
import { formatCurrency, formatPercentage } from '@/lib/formatters'

interface AllocationTableProps {
  allocations: ContributionAllocation[]
  originalAllocations: ContributionAllocation[]
  summary: {
    totalAdjusted: string
    underweightCount: number
    overweightCount: number
    balancedCount: number
  }
  displayCurrency: string
  onAllocationChange: (assetId: string, newAmount: string) => void
  onReset: () => void
}

const deviationColors = {
  underweight: 'text-blue-600 bg-blue-50',
  overweight: 'text-orange-600 bg-orange-50',
  balanced: 'text-green-600 bg-green-50',
} as const

function getDeviationStatus(deviation: string | null): keyof typeof deviationColors {
  if (!deviation) return 'balanced'
  const value = parseFloat(deviation)
  if (value < -1) return 'underweight'
  if (value > 1) return 'overweight'
  return 'balanced'
}

export function AllocationTable({
  allocations,
  originalAllocations,
  summary,
  displayCurrency,
  onAllocationChange,
  onReset,
}: AllocationTableProps) {
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null)

  const total = allocations.reduce((sum, a) => sum + parseFloat(a.adjustedAllocation), 0)
  const originalTotal = parseFloat(summary.totalAdjusted)
  const hasChanges = allocations.some((a, i) =>
    a.adjustedAllocation !== originalAllocations[i]?.adjustedAllocation
  )
  const totalDifference = total - originalTotal
  const showWarning = Math.abs(totalDifference) > 0.01

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      {/* Header with summary */}
      <div className="border-b border-gray-200 px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Distribución Sugerida
          </h2>
          <div className="flex flex-wrap gap-2 text-sm">
            {summary.underweightCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                {summary.underweightCount} subponderado{summary.underweightCount > 1 ? 's' : ''}
              </span>
            )}
            {summary.overweightCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
                {summary.overweightCount} sobreponderado{summary.overweightCount > 1 ? 's' : ''}
              </span>
            )}
            {summary.balancedCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                {summary.balancedCount} balanceado{summary.balancedCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Activo
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Target
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actual
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Desv.
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Base
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Ajustado
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                Ajuste
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {allocations.map((allocation) => {
              const original = originalAllocations.find(o => o.assetId === allocation.assetId)
              const deviationStatus = getDeviationStatus(allocation.deviation)

              return (
                <tr key={allocation.assetId} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-900">{allocation.ticker}</div>
                      <div className="text-xs text-gray-500">{allocation.name}</div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">
                    {formatPercentage(allocation.targetPercentage)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">
                    {allocation.actualPercentage ? formatPercentage(allocation.actualPercentage) : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {allocation.deviation ? (
                      <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${deviationColors[deviationStatus]}`}>
                        {parseFloat(allocation.deviation) > 0 ? '+' : ''}{formatPercentage(allocation.deviation)}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-500">
                    {formatCurrency(allocation.baseAllocation, displayCurrency)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {editingAssetId === allocation.assetId ? (
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={allocation.adjustedAllocation}
                        onChange={(e) => onAllocationChange(allocation.assetId, e.target.value)}
                        onBlur={() => setEditingAssetId(null)}
                        onKeyDown={(e) => e.key === 'Enter' && setEditingAssetId(null)}
                        className="w-24 rounded border border-gray-300 px-2 py-1 text-right text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => setEditingAssetId(allocation.assetId)}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded px-1"
                        title="Click para editar"
                      >
                        {formatCurrency(allocation.adjustedAllocation, displayCurrency)}
                      </button>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-center">
                    <AdjustmentBadge
                      adjustmentReason={original?.adjustmentReason ?? null}
                      baseAllocation={allocation.baseAllocation}
                      adjustedAllocation={original?.adjustedAllocation ?? allocation.adjustedAllocation}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={5} className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                Total
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold text-gray-900">
                {formatCurrency(total.toFixed(2), displayCurrency)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden divide-y divide-gray-100">
        {allocations.map((allocation) => {
          const original = originalAllocations.find(o => o.assetId === allocation.assetId)
          const deviationStatus = getDeviationStatus(allocation.deviation)

          return (
            <div key={allocation.assetId} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-gray-900">{allocation.ticker}</div>
                  <div className="text-sm text-gray-500">{allocation.name}</div>
                </div>
                <AdjustmentBadge
                  adjustmentReason={original?.adjustmentReason ?? null}
                  baseAllocation={allocation.baseAllocation}
                  adjustedAllocation={original?.adjustedAllocation ?? allocation.adjustedAllocation}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Target:</span>
                  <span className="font-medium">{formatPercentage(allocation.targetPercentage)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Actual:</span>
                  <span className="font-medium">{allocation.actualPercentage ? formatPercentage(allocation.actualPercentage) : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Desv.:</span>
                  {allocation.deviation ? (
                    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${deviationColors[deviationStatus]}`}>
                      {parseFloat(allocation.deviation) > 0 ? '+' : ''}{formatPercentage(allocation.deviation)}
                    </span>
                  ) : <span>—</span>}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Base:</span>
                  <span className="text-gray-600">{formatCurrency(allocation.baseAllocation, displayCurrency)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="font-medium text-gray-900">Monto Ajustado:</span>
                {editingAssetId === allocation.assetId ? (
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={allocation.adjustedAllocation}
                    onChange={(e) => onAllocationChange(allocation.assetId, e.target.value)}
                    onBlur={() => setEditingAssetId(null)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingAssetId(null)}
                    className="w-28 rounded border border-gray-300 px-2 py-1 text-right text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => setEditingAssetId(allocation.assetId)}
                    className="font-bold text-gray-900 hover:text-blue-600 focus:outline-none"
                  >
                    {formatCurrency(allocation.adjustedAllocation, displayCurrency)}
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {/* Mobile Total */}
        <div className="p-4 bg-gray-50 flex justify-between items-center">
          <span className="font-medium text-gray-900">Total</span>
          <span className="font-bold text-gray-900">{formatCurrency(total.toFixed(2), displayCurrency)}</span>
        </div>
      </div>

      {/* Warning and Reset */}
      {(showWarning || hasChanges) && (
        <div className="border-t border-gray-200 px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {showWarning && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>
                  El total ({formatCurrency(total.toFixed(2), displayCurrency)}) difiere del aporte original ({formatCurrency(summary.totalAdjusted, displayCurrency)}) en {formatCurrency(Math.abs(totalDifference).toFixed(2), displayCurrency)}
                </span>
              </div>
            )}
            {hasChanges && (
              <button
                onClick={onReset}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Restaurar Sugerido
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
