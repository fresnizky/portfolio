import { z } from 'zod'

export const assetCategorySchema = z.enum(['ETF', 'FCI', 'CRYPTO', 'CASH'])

// Target percentage: 0-100 with 2 decimal precision
export const targetPercentageSchema = z.coerce
  .number()
  .min(0, 'Target must be at least 0%')
  .max(100, 'Target cannot exceed 100%')
  .transform(val => Math.round(val * 100) / 100) // Round to 2 decimals

export const createAssetSchema = z.object({
  ticker: z.string().trim().min(1, 'Ticker is required').max(20, 'Ticker must be 20 characters or less').transform(val => val.toUpperCase()),
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  category: assetCategorySchema,
})

export const updateAssetSchema = createAssetSchema.partial().extend({
  targetPercentage: targetPercentageSchema.optional(),
})

export const listAssetsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
})

export const assetIdParamSchema = z.object({
  id: z.cuid2({ message: 'Invalid asset ID format' }),
})

// Batch update targets schema for atomic multi-asset target updates
export const batchUpdateTargetsSchema = z.object({
  targets: z.array(z.object({
    assetId: z.cuid2({ message: 'Invalid asset ID format' }),
    targetPercentage: targetPercentageSchema,
  })).min(1, 'At least one target update required'),
})

export type AssetCategory = z.infer<typeof assetCategorySchema>
export type CreateAssetInput = z.infer<typeof createAssetSchema>
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>
export type ListAssetsQuery = z.infer<typeof listAssetsQuerySchema>
export type BatchUpdateTargetsInput = z.infer<typeof batchUpdateTargetsSchema>
