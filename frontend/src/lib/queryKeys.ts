import type { TransactionListFilters, DashboardParams, SnapshotListFilters } from '@/types/api'

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
  snapshots: {
    all: ['snapshots'] as const,
    list: (filters?: SnapshotListFilters) =>
      [...queryKeys.snapshots.all, 'list', filters] as const,
    detail: (id: string) =>
      [...queryKeys.snapshots.all, 'detail', id] as const,
  },
  onboarding: {
    all: ['onboarding'] as const,
    status: () => [...queryKeys.onboarding.all, 'status'] as const,
  },
  holdings: {
    all: ['holdings'] as const,
    list: () => [...queryKeys.holdings.all, 'list'] as const,
  },
  settings: {
    all: ['settings'] as const,
    get: () => [...queryKeys.settings.all, 'get'] as const,
  },
  exchangeRates: {
    all: ['exchangeRates'] as const,
    current: () => [...queryKeys.exchangeRates.all, 'current'] as const,
  },
  contributions: {
    all: ['contributions'] as const,
    suggestion: (amount: number) =>
      [...queryKeys.contributions.all, 'suggestion', amount] as const,
  },
}
