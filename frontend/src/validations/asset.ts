import { z } from 'zod'

export const assetCategorySchema = z.enum(['ETF', 'FCI', 'CRYPTO', 'CASH'])

export const createAssetSchema = z.object({
  ticker: z.string()
    .trim()
    .min(1, 'Ticker is required')
    .max(20, 'Ticker must be 20 characters or less')
    .transform(val => val.toUpperCase()),
  name: z.string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  category: assetCategorySchema,
  targetPercentage: z.number()
    .min(0, 'Target must be at least 0%')
    .max(100, 'Target cannot exceed 100%'),
})

export const updateAssetSchema = createAssetSchema.partial()

export type CreateAssetFormData = z.infer<typeof createAssetSchema>
export type UpdateAssetFormData = z.infer<typeof updateAssetSchema>
