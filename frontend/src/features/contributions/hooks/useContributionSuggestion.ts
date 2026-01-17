import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ContributionSuggestion } from '@/types/api'

export function useContributionSuggestion() {
  return useMutation<ContributionSuggestion, Error, number>({
    mutationFn: (amount: number) => api.contributions.suggest(amount),
  })
}
