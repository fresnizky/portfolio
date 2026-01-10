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

// Portfolio Types
export interface Position {
  assetId: string
  ticker: string
  name: string
  category: AssetCategory
  quantity: string
  currentPrice: string | null
  value: string
  targetPercentage: string | null
  priceUpdatedAt: string | null
}

export interface PortfolioSummary {
  totalValue: string
  positions: Position[]
}

// Price Update Types
export interface UpdatePriceInput {
  price: number
}

export interface BatchUpdatePricesInput {
  prices: Array<{
    assetId: string
    price: number
  }>
}

export interface BatchUpdatePricesResponse {
  updated: number
  assets: Array<{
    id: string
    ticker: string
    currentPrice: string
    priceUpdatedAt: string
  }>
}
