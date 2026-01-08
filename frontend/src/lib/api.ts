import type {
  LoginResponse,
  AuthMeResponse,
  Asset,
  CreateAssetInput,
  UpdateAssetInput,
  BatchUpdateTargetsInput,
} from '@/types/api'

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
  // Handle 204 No Content responses (e.g., DELETE)
  if (response.status === 204) {
    return undefined as T
  }

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
      // Invalid/corrupted token format, clean up localStorage
      localStorage.removeItem('auth-storage')
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

  assets: {
    list: async (): Promise<Asset[]> => {
      const res = await fetch(`${API_URL}/assets`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      })
      return handleResponse<Asset[]>(res)
    },

    create: async (input: CreateAssetInput): Promise<Asset> => {
      const res = await fetch(`${API_URL}/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(input),
      })
      return handleResponse<Asset>(res)
    },

    update: async (id: string, input: UpdateAssetInput): Promise<Asset> => {
      const res = await fetch(`${API_URL}/assets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(input),
      })
      return handleResponse<Asset>(res)
    },

    delete: async (id: string): Promise<void> => {
      const res = await fetch(`${API_URL}/assets/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      })
      return handleResponse<void>(res)
    },

    batchUpdateTargets: async (input: BatchUpdateTargetsInput): Promise<Asset[]> => {
      const res = await fetch(`${API_URL}/assets/targets`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(input),
      })
      return handleResponse<Asset[]>(res)
    },
  },
}
