import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import type { TransactionListFilters, CreateTransactionInput } from '@/types/api'

export function useTransactions(filters?: TransactionListFilters) {
  return useQuery({
    queryKey: queryKeys.transactions.list(filters),
    queryFn: () => api.transactions.list(filters),
  })
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateTransactionInput) => api.transactions.create(input),
    onSuccess: () => {
      // Invalidate transactions and portfolio (holdings updated automatically)
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.all })
    },
  })
}
