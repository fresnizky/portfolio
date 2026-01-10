import type { Position } from '@/types/api'

const STALE_THRESHOLD_DAYS = 7

export function isPriceStale(priceUpdatedAt: string | null, thresholdDays: number = STALE_THRESHOLD_DAYS): boolean {
  if (!priceUpdatedAt) return true

  const updated = new Date(priceUpdatedAt)
  const now = new Date()
  const diffMs = now.getTime() - updated.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  return diffDays > thresholdDays
}

export function getDaysSinceUpdate(priceUpdatedAt: string | null): number | null {
  if (!priceUpdatedAt) return null

  const updated = new Date(priceUpdatedAt)
  const now = new Date()
  const diffMs = now.getTime() - updated.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

export function hasAnyStalePrice(positions: Position[]): boolean {
  return positions.some(position => isPriceStale(position.priceUpdatedAt))
}
