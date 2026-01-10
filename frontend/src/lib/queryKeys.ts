import type { TransactionListFilters, DashboardParams } from '@/types/api'

export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
  },
  assets: {
    all: ['assets'] as const,
    list: () => [...queryKeys.assets.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.assets.all, 'detail', id] as const,
  },
  portfolio: {
    all: ['portfolio'] as const,
    summary: () => [...queryKeys.portfolio.all, 'summary'] as const,
  },
  prices: {
    all: ['prices'] as const,
  },
  transactions: {
    all: ['transactions'] as const,
    list: (filters?: TransactionListFilters) =>
      [...queryKeys.transactions.all, 'list', filters] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    summary: (params?: DashboardParams) =>
      [...queryKeys.dashboard.all, 'summary', params] as const,
  },
}
