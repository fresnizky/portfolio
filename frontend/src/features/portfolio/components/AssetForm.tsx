import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { assetFormSchema, type AssetFormData } from '@/validations/asset'
import type { Asset, AssetCategory } from '@/types/api'

const categories: { value: AssetCategory; label: string }[] = [
  { value: 'ETF', label: 'ETF' },
  { value: 'FCI', label: 'FCI' },
  { value: 'CRYPTO', label: 'Crypto' },
  { value: 'CASH', label: 'Cash' },
]

interface AssetFormProps {
  asset?: Asset  // If provided, form is in edit mode
  onSubmit: (data: AssetFormData) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export function AssetForm({ asset, onSubmit, onCancel, isSubmitting = false }: AssetFormProps) {
  const isEditMode = !!asset

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AssetFormData>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: asset
      ? {
          ticker: asset.ticker,
          name: asset.name,
          category: asset.category,
        }
      : {
          ticker: '',
          name: '',
          category: 'ETF',
        },
  })

  // Watch ticker field to detect changes in edit mode
  const currentTicker = watch('ticker')
  const tickerChanged = isEditMode && asset && currentTicker.toUpperCase() !== asset.ticker.toUpperCase()

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="ticker" className="block text-sm font-medium text-gray-700">
          Ticker
        </label>
        <input
          id="ticker"
          type="text"
          {...register('ticker')}
          disabled={isSubmitting}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm uppercase placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="VOO"
        />
        {errors.ticker && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {errors.ticker.message}
          </p>
        )}
        {tickerChanged && (
          <div className="mt-2 rounded-md bg-amber-50 border border-amber-200 p-3" role="alert">
            <div className="flex">
              <svg className="h-5 w-5 text-amber-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-amber-700">
                  Changing the ticker may affect historical transaction records and portfolio calculations.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          id="name"
          type="text"
          {...register('name')}
          disabled={isSubmitting}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="Vanguard S&P 500 ETF"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {errors.name.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
          Category
        </label>
        <select
          id="category"
          {...register('category')}
          disabled={isSubmitting}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {errors.category.message}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting && (
            <svg
              className="-ml-1 mr-2 h-4 w-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {isEditMode ? 'Save Changes' : 'Create Asset'}
        </button>
      </div>
    </form>
  )
}
