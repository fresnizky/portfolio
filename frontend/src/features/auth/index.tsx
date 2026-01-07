import { useNavigate, useLocation } from 'react-router'
import { LoginForm } from './components/LoginForm'
import { useLogin } from './hooks/useLogin'
import type { LoginInput } from '@/validations/auth'

interface LocationState {
  from?: { pathname: string }
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { mutate: login, isPending, error } = useLogin()

  const from = (location.state as LocationState)?.from?.pathname || '/dashboard'

  const handleSubmit = (data: LoginInput) => {
    login(data, {
      onSuccess: () => {
        navigate(from, { replace: true })
      },
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-white p-8 shadow-md">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Portfolio Tracker</h1>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to your account
            </p>
          </div>

          <LoginForm
            onSubmit={handleSubmit}
            isLoading={isPending}
            error={error?.message ?? null}
          />
        </div>
      </div>
    </div>
  )
}
