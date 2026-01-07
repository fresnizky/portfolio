import { useMutation } from '@tanstack/react-query'
import { api, ApiError } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import type { LoginInput } from '@/validations/auth'

export function useLogin() {
  const login = useAuthStore((state) => state.login)

  return useMutation<
    { user: { id: string; email: string }; token: string },
    ApiError,
    LoginInput
  >({
    mutationFn: (data: LoginInput) => api.auth.login(data.email, data.password),
    onSuccess: (data) => {
      login(data.token, data.user)
    },
  })
}
