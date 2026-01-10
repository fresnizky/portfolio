import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import type { DashboardResponse, DashboardParams } from '@/types/api'

export function useDashboard(params?: DashboardParams) {
  return useQuery<DashboardResponse>({
    queryKey: queryKeys.dashboard.summary(params),
    queryFn: () => api.dashboard.get(params),
  })
}
