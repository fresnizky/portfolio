import { z } from 'zod'

// Quantity: positive number with high precision for fractional shares/crypto
// z.coerce.number() automatically rejects NaN from invalid coercion (e.g., "abc" -> NaN)
export const quantitySchema = z.coerce
  .number()
  .positive('Quantity must be greater than 0')

export const createOrUpdateHoldingSchema = z.object({
  quantity: quantitySchema,
})

export const holdingParamsSchema = z.object({
  assetId: z.string().min(1, 'Asset ID is required'),
})

// Batch create holdings schema for onboarding
// Price is optional - in cents
export const batchCreateHoldingsSchema = z.object({
  holdings: z.array(z.object({
    assetId: z.string().min(1, 'Asset ID is required'),
    quantity: z.coerce.number().min(0, 'Quantity must be non-negative'),
    price: z.coerce.number().positive('Price must be positive').optional(),
  })).min(1, 'At least one holding required'),
})

export type CreateOrUpdateHoldingInput = z.infer<typeof createOrUpdateHoldingSchema>
export type HoldingParams = z.infer<typeof holdingParamsSchema>
export type BatchCreateHoldingsInput = z.infer<typeof batchCreateHoldingsSchema>
