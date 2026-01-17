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
export type Currency = 'USD' | 'ARS'

export interface Asset {
  id: string
  ticker: string
  name: string
  category: AssetCategory
  currency: Currency
  decimalPlaces: number
  targetPercentage: string  // Decimal from Prisma comes as string
  createdAt: string
  updatedAt: string
  userId: string
}

export interface CreateAssetInput {
  ticker: string
  name: string
  category: AssetCategory
  currency?: Currency  // defaults to USD on backend
  targetPercentage?: number
}

export interface UpdateAssetInput {
  ticker?: string
  name?: string
  category?: AssetCategory
  currency?: Currency
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
  decimalPlaces: number
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

// Transaction Types
// Re-exported from shared schemas (single source of truth)
import type {
  Transaction as TransactionSchema,
  TransactionResponse as TransactionResponseSchema,
} from '@shared'

export type Transaction = TransactionSchema
export type TransactionResponse = TransactionResponseSchema
export type TransactionType = 'BUY' | 'SELL'

export interface TransactionListFilters {
  assetId?: string
  type?: 'buy' | 'sell'
  fromDate?: string
  toDate?: string
}

export interface CreateTransactionInput {
  type: 'buy' | 'sell'
  assetId: string
  date: string
  quantity: number
  price: number
  commission?: number
}

// Dashboard Types
export type AlertType = 'stale_price' | 'rebalance_needed' | 'missing_price'
export type AlertSeverity = 'warning' | 'info'
export type PriceStatus = 'set' | 'missing'

export interface DashboardAlert {
  type: AlertType
  assetId: string
  ticker: string
  message: string
  severity: AlertSeverity
  data?: {
    daysOld?: number
    deviation?: string
    direction?: 'overweight' | 'underweight'
  }
}

export interface DashboardPosition {
  assetId: string
  ticker: string
  name: string
  category: AssetCategory
  quantity: string
  currentPrice: string | null
  originalValue: string | null
  originalCurrency: Currency
  value: string | null
  displayCurrency: Currency
  targetPercentage: string | null
  actualPercentage: string | null
  deviation: string | null
  priceStatus: PriceStatus
  priceUpdatedAt: string | null
  decimalPlaces: number
}

export interface ExchangeRateInfo {
  usdToArs: number
  fetchedAt: string
  isStale: boolean
}

export interface DashboardResponse {
  totalValue: string
  displayCurrency: Currency
  exchangeRate: ExchangeRateInfo | null
  positions: DashboardPosition[]
  alerts: DashboardAlert[]
  excludedCount?: number
}

export interface DashboardParams {
  deviationThreshold?: number
  staleDays?: number
  displayCurrency?: Currency
}

// Snapshot Types
export interface SnapshotAsset {
  assetId: string
  ticker: string
  name: string
  quantity: string
  price: string
  value: string
  percentage: string
}

export interface Snapshot {
  id: string
  date: string // ISO 8601
  totalValue: string
  assets: SnapshotAsset[]
  createdAt: string
}

export interface SnapshotListFilters {
  from?: string // ISO date string
  to?: string   // ISO date string
}

export interface SnapshotListResponse {
  snapshots: Snapshot[]
  total: number
}

// Onboarding Types
export interface OnboardingStatus {
  completed: boolean
  skipped: boolean
  hasExistingData: boolean
}

export interface BatchAssetCreate {
  ticker: string
  name: string
  category: AssetCategory
  currency?: Currency  // defaults to USD on backend
}

export interface BatchTargetUpdate {
  assetId: string
  targetPercentage: number
}

export interface BatchHoldingCreate {
  assetId: string
  quantity: number
  price?: number
}

export interface Holding {
  id: string
  assetId: string
  quantity: string
  createdAt: string
  updatedAt: string
  asset: {
    id: string
    ticker: string
    name: string
    category: AssetCategory
    currentPrice?: string | null
    decimalPlaces: number
  }
}

// Settings Types
export interface UserSettings {
  rebalanceThreshold: string  // Decimal as string from API
  priceAlertDays: number
}

export interface UpdateSettingsInput {
  rebalanceThreshold?: number
  priceAlertDays?: number
}

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

export interface ExportData {
  exportedAt: string
  user: { email: string }
  assets: Asset[]
  holdings: Holding[]
  transactions: Transaction[]
  snapshots: Snapshot[]
}

// Exchange Rate Types
export interface ExchangeRateResponse {
  baseCurrency: Currency
  quoteCurrency: Currency
  rate: number
  fetchedAt: string
  isStale: boolean
  source: string
}

// Contribution Types
export interface ContributionAllocation {
  assetId: string
  ticker: string
  name: string
  targetPercentage: string
  actualPercentage: string | null
  deviation: string | null
  baseAllocation: string
  adjustedAllocation: string
  adjustmentReason: 'underweight' | 'overweight' | null
}

export interface ContributionSuggestion {
  amount: string
  displayCurrency: string
  allocations: ContributionAllocation[]
  summary: {
    totalAdjusted: string
    underweightCount: number
    overweightCount: number
    balancedCount: number
  }
}

export interface ContributionSuggestInput {
  amount: number
}
