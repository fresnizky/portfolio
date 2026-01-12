import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import type { TransactionListFilters, CreateTransactionInput } from '@/types/api'

// Convert YYYY-MM-DD from date input to ISO 8601 format for API
function dateInputToISO(dateString: string): string {
  if (dateString.includes('T')) {
    return dateString // Already ISO format
  }
  return new Date(dateString + 'T00:00:00.000Z').toISOString()
}

// Transform filter dates to ISO 8601 for backend validation
function transformFilters(filters?: TransactionListFilters): TransactionListFilters | undefined {
  if (!filters) return undefined

  return {
    ...filters,
    fromDate: filters.fromDate ? dateInputToISO(filters.fromDate) : undefined,
    toDate: filters.toDate ? dateInputToISO(filters.toDate) : undefined,
  }
}

export function useTransactions(filters?: TransactionListFilters) {
  const transformedFilters = transformFilters(filters)

  return useQuery({
    queryKey: queryKeys.transactions.list(filters), // Use original for cache key consistency
    queryFn: () => api.transactions.list(transformedFilters),
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
