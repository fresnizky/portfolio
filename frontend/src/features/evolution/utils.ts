export type DateRangePeriod = '1M' | '3M' | '6M' | '1Y' | 'ALL'

export function getDateRange(period: DateRangePeriod): { from?: string; to?: string } {
  if (period === 'ALL') {
    return {} // No filter
  }

  const now = new Date()
  const to = now.toISOString()

  const monthsMap: Record<string, number> = {
    '1M': 1,
    '3M': 3,
    '6M': 6,
    '1Y': 12,
  }

  const from = new Date(now)
  from.setMonth(from.getMonth() - monthsMap[period])

  return {
    from: from.toISOString(),
    to,
  }
}
