import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, ApiError } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { queryKeys } from '@/lib/queryKeys'

export function useAuth() {
  const { token, user, isAuthenticated, isLoading, logout, setLoading, checkAuth } = useAuthStore()

  // Initial auth check on mount
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Validate token with API if we have one
  const { isLoading: isValidating, error } = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: () => api.auth.me(),
    enabled: !!token && isAuthenticated,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Fetch onboarding status
  const { data: onboardingStatus, isLoading: isLoadingOnboarding } = useQuery({
    queryKey: queryKeys.onboarding.status(),
    queryFn: () => api.onboarding.getStatus(),
    enabled: !!token && isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Handle token validation errors
  useEffect(() => {
    if (error instanceof ApiError && error.error === 'UNAUTHORIZED') {
      logout()
    }
  }, [error, logout])

  // Update loading state based on validation
  useEffect(() => {
    if (token && isAuthenticated && !isValidating) {
      setLoading(false)
    }
  }, [token, isAuthenticated, isValidating, setLoading])

  const needsOnboarding = isAuthenticated &&
    onboardingStatus &&
    !onboardingStatus.completed &&
    !onboardingStatus.skipped

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || (!!token && isValidating) || isLoadingOnboarding,
    onboardingStatus,
    needsOnboarding,
  }
}
