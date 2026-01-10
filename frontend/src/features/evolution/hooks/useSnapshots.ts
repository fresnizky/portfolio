import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import type { SnapshotListFilters } from '@/types/api'

export function useSnapshots(filters?: SnapshotListFilters) {
  return useQuery({
    queryKey: queryKeys.snapshots.list(filters),
    queryFn: () => api.snapshots.list(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
