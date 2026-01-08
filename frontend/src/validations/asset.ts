import { z } from 'zod'

export const assetCategorySchema = z.enum(['ETF', 'FCI', 'CRYPTO', 'CASH'])

// Schema for asset form (without targetPercentage - managed via TargetEditor)
export const assetFormSchema = z.object({
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
})

export type AssetFormData = z.infer<typeof assetFormSchema>
