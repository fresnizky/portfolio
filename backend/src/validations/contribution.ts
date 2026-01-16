import { z } from 'zod'

// Contribution suggest request schema
export const contributionSuggestSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
})

export type ContributionSuggestInput = z.infer<typeof contributionSuggestSchema>

// Response types for contribution suggestion
export interface ContributionAllocation {
  assetId: string
  ticker: string
  name: string
  targetPercentage: string
  actualPercentage: string | null
  deviation: string | null
  baseAllocation: string
  adjustedAllocation: string
  adjustmentReason: 'underweight' | 'overweight' | null
}

export interface ContributionSuggestion {
  amount: string
  displayCurrency: string
  allocations: ContributionAllocation[]
  summary: {
    totalAdjusted: string
    underweightCount: number
    overweightCount: number
    balancedCount: number
  }
}
