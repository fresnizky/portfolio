import type {
  LoginResponse,
  AuthMeResponse,
  Asset,
  CreateAssetInput,
  UpdateAssetInput,
  BatchUpdateTargetsInput,
  PortfolioSummary,
  UpdatePriceInput,
  BatchUpdatePricesInput,
  BatchUpdatePricesResponse,
  Transaction,
  TransactionListFilters,
  CreateTransactionInput,
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

  portfolio: {
    summary: async (): Promise<PortfolioSummary> => {
      const res = await fetch(`${API_URL}/portfolio/summary`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      })
      return handleResponse<PortfolioSummary>(res)
    },
  },

  prices: {
    update: async (assetId: string, input: UpdatePriceInput): Promise<Asset> => {
      const res = await fetch(`${API_URL}/prices/${assetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(input),
      })
      return handleResponse<Asset>(res)
    },

    batchUpdate: async (input: BatchUpdatePricesInput): Promise<BatchUpdatePricesResponse> => {
      const res = await fetch(`${API_URL}/prices/batch`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(input),
      })
      return handleResponse<BatchUpdatePricesResponse>(res)
    },
  },

  transactions: {
    list: async (
      filters?: TransactionListFilters
    ): Promise<{ transactions: Transaction[]; total: number }> => {
      const params = new URLSearchParams()
      if (filters?.assetId) params.append('assetId', filters.assetId)
      if (filters?.type) params.append('type', filters.type)
      if (filters?.fromDate) params.append('fromDate', filters.fromDate)
      if (filters?.toDate) params.append('toDate', filters.toDate)

      const queryString = params.toString()
      const url = queryString
        ? `${API_URL}/transactions?${queryString}`
        : `${API_URL}/transactions`

      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      })

      // Response format: { data: Transaction[], meta: { total: number } }
      if (!res.ok) {
        const json = await res.json()
        throw new ApiError(
          json.error || 'UNKNOWN_ERROR',
          json.message || 'An unexpected error occurred',
          json.details
        )
      }

      const json = await res.json()
      return {
        transactions: json.data,
        total: json.meta?.total ?? json.data.length,
      }
    },

    create: async (input: CreateTransactionInput): Promise<Transaction> => {
      const res = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(input),
      })
      return handleResponse<Transaction>(res)
    },
  },
}
