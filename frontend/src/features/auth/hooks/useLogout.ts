import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useAuthStore } from '@/stores/authStore'
import { queryClient } from '@/lib/queryClient'

export function useLogout() {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)

  const handleLogout = useCallback(() => {
    logout()
    queryClient.clear()
    navigate('/login', { replace: true })
  }, [logout, navigate])

  return handleLogout
}
