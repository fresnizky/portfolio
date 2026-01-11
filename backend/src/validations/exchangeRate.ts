import { z } from 'zod'

// Currency enum validation
export const currencySchema = z.enum(['USD', 'ARS'])

// Exchange rate response schema
export const exchangeRateResponseSchema = z.object({
  baseCurrency: currencySchema,
  quoteCurrency: currencySchema,
  rate: z.number().positive(),
  fetchedAt: z.string().datetime(),
  isStale: z.boolean(),
})

export type Currency = z.infer<typeof currencySchema>
export type ExchangeRateResponse = z.infer<typeof exchangeRateResponseSchema>
