import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { BatchAssetCreate, AssetCategory, Currency } from '@/types/api'

const assetSchema = z.object({
  ticker: z.string().min(1, 'Ticker requerido').max(10).transform(v => v.toUpperCase()),
  name: z.string().min(1, 'Nombre requerido'),
  category: z.enum(['ETF', 'FCI', 'CRYPTO', 'CASH']),
  currency: z.enum(['USD', 'ARS']).default('USD'),
})

type AssetFormData = z.infer<typeof assetSchema>

interface Step1AssetSetupProps {
  assets: (BatchAssetCreate & { tempId: string })[]
  onAdd: (asset: BatchAssetCreate) => void
  onRemove: (tempId: string) => void
}

export function Step1AssetSetup({ assets, onAdd, onRemove }: Step1AssetSetupProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    defaultValues: { ticker: '', name: '', category: 'ETF', currency: 'USD' },
  })

  const onSubmit = (data: AssetFormData) => {
    onAdd(data as BatchAssetCreate)
    reset()
  }

  return (
    <div className="space-y-6">
      {/* Asset Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-medium text-gray-900 mb-4">Agregar activo</h3>
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="text-sm text-gray-600">Ticker</label>
            <input
              {...register('ticker')}
              placeholder="VOO"
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.ticker && (
              <p className="text-sm text-red-600 mt-1">{errors.ticker.message}</p>
            )}
          </div>
          <div>
            <label className="text-sm text-gray-600">Nombre</label>
            <input
              {...register('name')}
              placeholder="Vanguard S&P 500"
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="text-sm text-gray-600">Categoria</label>
            <select
              {...register('category')}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ETF">ETF</option>
              <option value="FCI">FCI</option>
              <option value="CRYPTO">Crypto</option>
              <option value="CASH">Cash</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600">Moneda</label>
            <select
              {...register('currency')}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="USD">USD</option>
              <option value="ARS">ARS</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
        >
          + Agregar
        </button>
      </form>

      {/* Asset List */}
      {assets.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-medium text-gray-900 mb-4">Activos agregados ({assets.length})</h3>
          <div className="space-y-2">
            {assets.map(asset => (
              <div
                key={asset.tempId}
                className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md"
              >
                <div>
                  <span className="font-mono font-medium text-gray-900">{asset.ticker}</span>
                  <span className="mx-2 text-gray-400">-</span>
                  <span className="text-gray-700">{asset.name}</span>
                  <span className="ml-2 text-xs text-gray-500">({asset.category})</span>
                  <span className="ml-1 text-xs text-gray-400">{asset.currency || 'USD'}</span>
                </div>
                <button
                  onClick={() => onRemove(asset.tempId)}
                  className="text-red-600 hover:text-red-800"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {assets.length === 0 && (
        <p className="text-center text-gray-500 py-8">
          Agrega al menos un activo para continuar
        </p>
      )}
    </div>
  )
}
