import type { BatchAssetCreate } from '@/types/api'

interface Step3HoldingsSetupProps {
  assets: (BatchAssetCreate & { tempId: string })[]
  holdings: Record<string, { quantity: number; price?: number }>
  onSetHolding: (tempId: string, quantity: number, price?: number) => void
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

export function Step3HoldingsSetup({
  assets,
  holdings,
  onSetHolding,
}: Step3HoldingsSetupProps) {
  // Calculate total value if all prices are set
  const totalValue = assets.reduce((sum, asset) => {
    const h = holdings[asset.tempId]
    if (h && h.quantity > 0 && h.price) {
      return sum + (h.quantity * h.price)
    }
    return sum
  }, 0)

  const hasAnyPrices = assets.some(a => holdings[a.tempId]?.price)

  return (
    <div className="space-y-6">
      {/* Total Value */}
      {hasAnyPrices && totalValue > 0 && (
        <div className="p-4 rounded-lg bg-gray-100">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Valor total estimado:</span>
            <span className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</span>
          </div>
        </div>
      )}

      {/* Holdings Inputs */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-medium text-gray-900 mb-4">Cargar posiciones actuales</h3>
        <p className="text-sm text-gray-600 mb-4">
          Ingresa las cantidades que posees de cada activo. Los precios son opcionales.
        </p>

        <div className="space-y-4">
          {assets.map(asset => {
            const h = holdings[asset.tempId] || { quantity: 0 }
            const value = h.quantity && h.price ? h.quantity * h.price : null

            return (
              <div key={asset.tempId} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-mono font-medium text-gray-900">{asset.ticker}</span>
                    <span className="text-gray-500 ml-2">{asset.name}</span>
                  </div>
                  {value !== null && (
                    <span className="text-sm font-medium text-gray-700">
                      Valor: {formatCurrency(value)}
                    </span>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm text-gray-600">Cantidad</label>
                    <input
                      type="number"
                      min="0"
                      step="0.0001"
                      value={h.quantity || ''}
                      onChange={(e) => onSetHolding(
                        asset.tempId,
                        parseFloat(e.target.value) || 0,
                        h.price
                      )}
                      placeholder="0"
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">
                      Precio actual (opcional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={h.price || ''}
                      onChange={(e) => onSetHolding(
                        asset.tempId,
                        h.quantity,
                        parseFloat(e.target.value) || undefined
                      )}
                      placeholder="$0.00"
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
