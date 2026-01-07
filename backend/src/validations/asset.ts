import { z } from 'zod'

export const assetCategorySchema = z.enum(['ETF', 'FCI', 'CRYPTO', 'CASH'])

export const createAssetSchema = z.object({
  ticker: z.string().trim().min(1, 'Ticker is required').max(20, 'Ticker must be 20 characters or less').transform(val => val.toUpperCase()),
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  category: assetCategorySchema,
})

export const updateAssetSchema = createAssetSchema.partial()

export const listAssetsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
})

export const assetIdParamSchema = z.object({
  id: z.string().cuid('Invalid asset ID format'),
})

export type AssetCategory = z.infer<typeof assetCategorySchema>
export type CreateAssetInput = z.infer<typeof createAssetSchema>
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>
export type ListAssetsQuery = z.infer<typeof listAssetsQuerySchema>
