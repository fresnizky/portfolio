import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import type { ExchangeRateResponse } from '@/types/api'

export function useExchangeRate() {
  return useQuery<ExchangeRateResponse>({
    queryKey: queryKeys.exchangeRates.current(),
    queryFn: () => api.exchangeRates.getCurrent(),
    staleTime: 1000 * 60 * 60, // 1 hour - matches backend cache TTL
  })
}
