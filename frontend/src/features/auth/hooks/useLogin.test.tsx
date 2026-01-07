import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useLogin } from './useLogin'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import type { ReactNode } from 'react'

vi.mock('@/lib/api', () => ({
  api: {
    auth: {
      login: vi.fn(),
    },
  },
  ApiError: class ApiError extends Error {
    constructor(public error: string, message: string, public details?: object) {
      super(message)
      this.name = 'ApiError'
    }
  },
}))

describe('useLogin', () => {
  let queryClient: QueryClient

  const createWrapper = () => {
    return function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )
    }
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    vi.clearAllMocks()
    localStorage.clear()
    useAuthStore.setState({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: true,
    })
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('should call api.auth.login with credentials', async () => {
    const mockResponse = {
      user: { id: '1', email: 'test@example.com' },
      token: 'jwt-token-123',
    }
    vi.mocked(api.auth.login).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ email: 'test@example.com', password: 'password123' })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(api.auth.login).toHaveBeenCalledWith('test@example.com', 'password123')
  })

  it('should update auth store on successful login', async () => {
    const mockResponse = {
      user: { id: '1', email: 'test@example.com' },
      token: 'jwt-token-123',
    }
    vi.mocked(api.auth.login).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ email: 'test@example.com', password: 'password123' })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    const authState = useAuthStore.getState()
    expect(authState.token).toBe('jwt-token-123')
    expect(authState.user).toEqual({ id: '1', email: 'test@example.com' })
    expect(authState.isAuthenticated).toBe(true)
  })

  it('should handle login errors', async () => {
    vi.mocked(api.auth.login).mockRejectedValue(
      new Error('Invalid email or password')
    )

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ email: 'test@example.com', password: 'wrong' })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.message).toBe('Invalid email or password')
  })
})
