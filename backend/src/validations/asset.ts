import { z } from 'zod'

export const assetCategorySchema = z.enum(['ETF', 'FCI', 'CRYPTO', 'CASH'])

export const createAssetSchema = z.object({
  ticker: z.string().min(1, 'Ticker is required').max(20, 'Ticker must be 20 characters or less').transform(val => val.toUpperCase()),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  category: assetCategorySchema,
})

export const updateAssetSchema = createAssetSchema.partial()

export type AssetCategory = z.infer<typeof assetCategorySchema>
export type CreateAssetInput = z.infer<typeof createAssetSchema>
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>
