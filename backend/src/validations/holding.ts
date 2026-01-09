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

export type CreateOrUpdateHoldingInput = z.infer<typeof createOrUpdateHoldingSchema>
export type HoldingParams = z.infer<typeof holdingParamsSchema>
