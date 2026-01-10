import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import type { BatchUpdatePricesInput } from '@/types/api'

export function usePortfolioSummary() {
  return useQuery({
    queryKey: queryKeys.portfolio.summary(),
    queryFn: () => api.portfolio.summary(),
  })
}

export function useUpdatePrice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ assetId, price }: { assetId: string; price: number }) =>
      api.prices.update(assetId, { price }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.all })
    },
  })
}

export function useBatchUpdatePrices() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: BatchUpdatePricesInput) => api.prices.batchUpdate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.all })
    },
  })
}
