import { z } from 'zod'

export const updateSettingsSchema = z
  .object({
    rebalanceThreshold: z
      .number()
      .min(1, 'Minimum threshold is 1%')
      .max(50, 'Maximum threshold is 50%')
      .optional(),
    priceAlertDays: z
      .number()
      .int('Must be a whole number')
      .min(1, 'Minimum is 1 day')
      .max(30, 'Maximum is 30 days')
      .optional(),
  })
  .refine(
    data =>
      data.rebalanceThreshold !== undefined || data.priceAlertDays !== undefined,
    { message: 'At least one setting must be provided' }
  )

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>
