import type { LoginResponse, AuthMeResponse } from '@/types/api'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10002/api'

export class ApiError extends Error {
  constructor(
    public error: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const json = await response.json()

  if (!response.ok) {
    throw new ApiError(
      json.error || 'UNKNOWN_ERROR',
      json.message || 'An unexpected error occurred',
      json.details
    )
  }

  return json.data
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth-storage')
  if (token) {
    try {
      const parsed = JSON.parse(token)
      if (parsed.state?.token) {
        return { Authorization: `Bearer ${parsed.state.token}` }
      }
    } catch {
      // Invalid token format, ignore
    }
  }
  return {}
}

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<LoginResponse> => {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      return handleResponse<LoginResponse>(res)
    },

    me: async (): Promise<AuthMeResponse> => {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      })
      return handleResponse<AuthMeResponse>(res)
    },
  },
}
