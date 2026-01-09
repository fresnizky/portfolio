import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import type { CreateAssetInput, UpdateAssetInput, BatchUpdateTargetsInput } from '@/types/api'

export function useAssets() {
  return useQuery({
    queryKey: queryKeys.assets.list(),
    queryFn: () => api.assets.list(),
  })
}

export function useCreateAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateAssetInput) => api.assets.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all })
    },
  })
}

export function useUpdateAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAssetInput }) =>
      api.assets.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all })
    },
  })
}

export function useDeleteAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.assets.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all })
    },
  })
}

export function useBatchUpdateTargets() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: BatchUpdateTargetsInput) => api.assets.batchUpdateTargets(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all })
    },
  })
}
