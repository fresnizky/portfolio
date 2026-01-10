import { AlertItem } from './AlertItem'
import { EmptyAlertsState } from './EmptyAlertsState'
import type { DashboardAlert } from '@/types/api'

interface AlertsPanelProps {
  alerts: DashboardAlert[]
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  if (alerts.length === 0) {
    return <EmptyAlertsState />
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Alerts</h2>
      <div className="space-y-3">
        {alerts.map((alert, index) => (
          <AlertItem key={`${alert.type}-${alert.assetId}-${index}`} alert={alert} />
        ))}
      </div>
    </div>
  )
}
