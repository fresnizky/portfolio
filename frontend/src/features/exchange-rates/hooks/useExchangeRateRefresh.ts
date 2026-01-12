import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import type { ExchangeRateResponse } from '@/types/api'

export function useExchangeRateRefresh() {
  const queryClient = useQueryClient()

  return useMutation<ExchangeRateResponse>({
    mutationFn: () => api.exchangeRates.refresh(),
    onSuccess: (data) => {
      // Update the cached exchange rate immediately
      queryClient.setQueryData(queryKeys.exchangeRates.current(), data)
    },
  })
}
