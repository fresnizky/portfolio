import { z } from 'zod'

// Price validation: positive number, rounded to 2 decimals for currency
// z.coerce.number() automatically rejects NaN from invalid coercion
export const priceSchema = z.coerce
  .number()
  .positive('Price must be greater than 0')
  .transform(val => Math.round(val * 100) / 100)

// Single price update
export const updatePriceSchema = z.object({
  price: priceSchema,
})

// Batch price update
export const batchUpdatePricesSchema = z.object({
  prices: z
    .array(
      z.object({
        assetId: z.string().min(1, 'Asset ID is required'),
        price: priceSchema,
      })
    )
    .min(1, 'At least one price update is required'),
})

// Route params
export const priceParamsSchema = z.object({
  assetId: z.string().min(1, 'Asset ID is required'),
})

export type UpdatePriceInput = z.infer<typeof updatePriceSchema>
export type BatchUpdatePricesInput = z.infer<typeof batchUpdatePricesSchema>
export type PriceParams = z.infer<typeof priceParamsSchema>
