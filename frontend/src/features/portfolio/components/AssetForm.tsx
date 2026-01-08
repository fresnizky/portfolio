import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createAssetSchema, type CreateAssetFormData } from '@/validations/asset'
import type { Asset, AssetCategory } from '@/types/api'

const categories: { value: AssetCategory; label: string }[] = [
  { value: 'ETF', label: 'ETF' },
  { value: 'FCI', label: 'FCI' },
  { value: 'CRYPTO', label: 'Crypto' },
  { value: 'CASH', label: 'Cash' },
]

interface AssetFormProps {
  asset?: Asset  // If provided, form is in edit mode
  onSubmit: (data: CreateAssetFormData) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export function AssetForm({ asset, onSubmit, onCancel, isSubmitting = false }: AssetFormProps) {
  const isEditMode = !!asset

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateAssetFormData>({
    resolver: zodResolver(createAssetSchema),
    defaultValues: asset
      ? {
          ticker: asset.ticker,
          name: asset.name,
          category: asset.category,
          targetPercentage: Number(asset.targetPercentage),
        }
      : {
          ticker: '',
          name: '',
          category: 'ETF',
          targetPercentage: 0,
        },
  })

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

      <div>
        <label htmlFor="targetPercentage" className="block text-sm font-medium text-gray-700">
          Target Percentage
        </label>
        <div className="relative mt-1">
          <input
            id="targetPercentage"
            type="number"
            step="0.01"
            min="0"
            max="100"
            {...register('targetPercentage', { valueAsNumber: true })}
            disabled={isSubmitting}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-8 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="0"
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
            %
          </span>
        </div>
        {errors.targetPercentage && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {errors.targetPercentage.message}
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
