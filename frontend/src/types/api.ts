// API Response Types

export interface SuccessResponse<T> {
  data: T
  message?: string
}

export interface ErrorResponse {
  error: string
  message: string
  details?: Record<string, unknown>
}

export interface ListResponse<T> {
  data: T[]
  meta?: {
    total: number
  }
}

// Asset Types
export type AssetCategory = 'ETF' | 'FCI' | 'CRYPTO' | 'CASH'

export interface Asset {
  id: string
  ticker: string
  name: string
  category: AssetCategory
  targetPercentage: string  // Decimal from Prisma comes as string
  createdAt: string
  updatedAt: string
  userId: string
}

export interface CreateAssetInput {
  ticker: string
  name: string
  category: AssetCategory
  targetPercentage?: number
}

export interface UpdateAssetInput {
  ticker?: string
  name?: string
  category?: AssetCategory
  targetPercentage?: number
}

export interface BatchUpdateTargetsInput {
  targets: Array<{
    assetId: string
    targetPercentage: number
  }>
}

// Auth Types
export interface User {
  id: string
  email: string
}

export interface LoginResponse {
  user: User
  token: string
}

export interface AuthMeResponse {
  id: string
  email: string
}
