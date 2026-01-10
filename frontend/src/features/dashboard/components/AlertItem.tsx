import type { DashboardAlert } from '@/types/api'

interface AlertItemProps {
  alert: DashboardAlert
}

// Stub implementation - will be fully implemented in Task 2
export function AlertItem({ alert }: AlertItemProps) {
  return (
    <div data-testid={`alert-item-${alert.assetId}`}>
      <span>{alert.ticker}</span>
      <span>{alert.message}</span>
    </div>
  )
}
