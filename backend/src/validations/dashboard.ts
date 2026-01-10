import { z } from 'zod'

// Query params for dashboard endpoint (all optional)
export const dashboardQuerySchema = z.object({
  deviationThreshold: z.coerce.number().min(0).max(100).optional(),
  staleDays: z.coerce.number().int().min(1).optional(),
})

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>

// Alert types
export type AlertType = 'stale_price' | 'rebalance_needed'
export type AlertSeverity = 'warning' | 'info'

// Dashboard position with calculated fields
export interface DashboardPosition {
  assetId: string
  ticker: string
  name: string
  category: string
  quantity: string
  currentPrice: string | null
  value: string
  targetPercentage: string | null
  actualPercentage: string
  deviation: string
  priceUpdatedAt: Date | null
}

// Dashboard alert
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

// Dashboard response
export interface DashboardResponse {
  totalValue: string
  positions: DashboardPosition[]
  alerts: DashboardAlert[]
}

// Thresholds configuration
export interface DashboardThresholds {
  deviationPct: number
  staleDays: number
}
