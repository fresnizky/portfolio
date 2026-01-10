import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import type { UpdateSettingsInput } from '@/types/api'

export function useSettings() {
  const queryClient = useQueryClient()

  const settingsQuery = useQuery({
    queryKey: queryKeys.settings.get(),
    queryFn: () => api.settings.get(),
  })

  const updateMutation = useMutation({
    mutationFn: (input: UpdateSettingsInput) => api.settings.update(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.all })
      // Also invalidate dashboard since it uses these settings
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
    },
  })

  return {
    settings: settingsQuery.data,
    isLoading: settingsQuery.isLoading,
    error: settingsQuery.error,
    updateSettings: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  }
}
