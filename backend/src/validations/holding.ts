import { z } from 'zod'

// Quantity: positive number with high precision for fractional shares/crypto
export const quantitySchema = z.coerce
  .number()
  .positive('Quantity must be greater than 0')

export const createOrUpdateHoldingSchema = z.object({
  quantity: quantitySchema,
})

export const holdingParamsSchema = z.object({
  assetId: z.cuid2({ message: 'Invalid asset ID format' }),
})

export type CreateOrUpdateHoldingInput = z.infer<typeof createOrUpdateHoldingSchema>
export type HoldingParams = z.infer<typeof holdingParamsSchema>
