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
  DashboardResponse,
  DashboardParams,
  Snapshot,
  SnapshotListFilters,
  SnapshotListResponse,
  OnboardingStatus,
  BatchAssetCreate,
  BatchTargetUpdate,
  BatchHoldingCreate,
  Holding,
  UserSettings,
  UpdateSettingsInput,
  ChangePasswordInput,
  ExportData,
  ExchangeRateResponse,
  ContributionSuggestion,
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
        credentials: 'include',
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
        credentials: 'include',
      })
      return handleResponse<AuthMeResponse>(res)
    },

    changePassword: async (input: ChangePasswordInput): Promise<{ success: boolean }> => {
      const res = await fetch(`${API_URL}/auth/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify(input),
      })
      return handleResponse<{ success: boolean }>(res)
    },
  },

  assets: {
    list: async (): Promise<Asset[]> => {
      const res = await fetch(`${API_URL}/assets`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
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
        credentials: 'include',
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
        credentials: 'include',
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
        credentials: 'include',
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
        credentials: 'include',
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
        credentials: 'include',
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
        credentials: 'include',
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
        credentials: 'include',
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
        credentials: 'include',
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
        credentials: 'include',
        body: JSON.stringify(input),
      })
      return handleResponse<Transaction>(res)
    },
  },

  dashboard: {
    get: async (params?: DashboardParams): Promise<DashboardResponse> => {
      const searchParams = new URLSearchParams()
      if (params?.deviationThreshold !== undefined) {
        searchParams.append('deviationThreshold', params.deviationThreshold.toString())
      }
      if (params?.staleDays !== undefined) {
        searchParams.append('staleDays', params.staleDays.toString())
      }
      if (params?.displayCurrency !== undefined) {
        searchParams.append('displayCurrency', params.displayCurrency)
      }

      const queryString = searchParams.toString()
      const url = queryString
        ? `${API_URL}/dashboard?${queryString}`
        : `${API_URL}/dashboard`

      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
      })
      return handleResponse<DashboardResponse>(res)
    },
  },

  snapshots: {
    list: async (filters?: SnapshotListFilters): Promise<SnapshotListResponse> => {
      const params = new URLSearchParams()
      if (filters?.from) params.append('from', filters.from)
      if (filters?.to) params.append('to', filters.to)

      const queryString = params.toString()
      const url = queryString
        ? `${API_URL}/snapshots?${queryString}`
        : `${API_URL}/snapshots`

      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
      })

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
        snapshots: json.data,
        total: json.meta?.total ?? json.data.length,
      }
    },

    getById: async (id: string): Promise<Snapshot> => {
      const res = await fetch(`${API_URL}/snapshots/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
      })
      return handleResponse<Snapshot>(res)
    },
  },

  onboarding: {
    getStatus: async (): Promise<OnboardingStatus> => {
      const res = await fetch(`${API_URL}/onboarding/status`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
      })
      return handleResponse<OnboardingStatus>(res)
    },

    complete: async (): Promise<OnboardingStatus> => {
      const res = await fetch(`${API_URL}/onboarding/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
      })
      return handleResponse<OnboardingStatus>(res)
    },

    skip: async (): Promise<OnboardingStatus> => {
      const res = await fetch(`${API_URL}/onboarding/skip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
      })
      return handleResponse<OnboardingStatus>(res)
    },

    batchCreateAssets: async (assets: BatchAssetCreate[]): Promise<Asset[]> => {
      const res = await fetch(`${API_URL}/assets/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify({ assets }),
      })
      return handleResponse<Asset[]>(res)
    },

    batchUpdateTargets: async (targets: BatchTargetUpdate[]): Promise<Asset[]> => {
      const res = await fetch(`${API_URL}/assets/targets/batch`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify({ targets }),
      })
      return handleResponse<Asset[]>(res)
    },

    batchCreateHoldings: async (holdings: BatchHoldingCreate[]): Promise<Holding[]> => {
      const res = await fetch(`${API_URL}/holdings/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify({ holdings }),
      })
      return handleResponse<Holding[]>(res)
    },
  },

  settings: {
    get: async (): Promise<UserSettings> => {
      const res = await fetch(`${API_URL}/settings`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
      })
      return handleResponse<UserSettings>(res)
    },

    update: async (input: UpdateSettingsInput): Promise<UserSettings> => {
      const res = await fetch(`${API_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify(input),
      })
      return handleResponse<UserSettings>(res)
    },

    exportJson: async (): Promise<ExportData> => {
      const res = await fetch(`${API_URL}/settings/export/json`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
      })
      return handleResponse<ExportData>(res)
    },

    exportCsv: async (): Promise<Blob> => {
      const res = await fetch(`${API_URL}/settings/export/csv`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      })
      if (!res.ok) {
        const json = await res.json()
        throw new ApiError(
          json.error || 'UNKNOWN_ERROR',
          json.message || 'An unexpected error occurred',
          json.details
        )
      }
      return res.blob()
    },
  },

  exchangeRates: {
    getCurrent: async (): Promise<ExchangeRateResponse> => {
      const res = await fetch(`${API_URL}/exchange-rates/current`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
      })
      return handleResponse<ExchangeRateResponse>(res)
    },

    refresh: async (): Promise<ExchangeRateResponse> => {
      const res = await fetch(`${API_URL}/exchange-rates/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
      })
      return handleResponse<ExchangeRateResponse>(res)
    },
  },

  contributions: {
    suggest: async (amount: number): Promise<ContributionSuggestion> => {
      const res = await fetch(`${API_URL}/contributions/suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify({ amount }),
      })
      return handleResponse<ContributionSuggestion>(res)
    },
  },
}
