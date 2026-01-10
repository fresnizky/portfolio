import type { DashboardAlert } from '@/types/api'

interface AttentionRequiredSectionProps {
  alerts: DashboardAlert[]
}

export function AttentionRequiredSection({ alerts }: AttentionRequiredSectionProps) {
  if (alerts.length === 0) return null

  // Group alerts by assetId
  const groupedAlerts = alerts.reduce(
    (acc, alert) => {
      if (!acc[alert.assetId]) {
        acc[alert.assetId] = { ticker: alert.ticker, alerts: [] }
      }
      acc[alert.assetId].alerts.push(alert)
      return acc
    },
    {} as Record<string, { ticker: string; alerts: DashboardAlert[] }>
  )

  const assetCount = Object.keys(groupedAlerts).length

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Attention Required</h2>
        <span className="rounded-full bg-amber-200 px-3 py-1 text-sm font-medium text-amber-800">
          {alerts.length} alert{alerts.length !== 1 ? 's' : ''} for {assetCount} asset
          {assetCount !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="space-y-4">
        {Object.entries(groupedAlerts).map(([assetId, { ticker, alerts: assetAlerts }]) => (
          <div key={assetId} className="rounded-lg bg-white p-4">
            <h3 className="mb-2 font-medium text-gray-900">{ticker}</h3>
            <ul className="space-y-2">
              {assetAlerts.map((alert, index) => (
                <li key={index} className="text-sm text-gray-600">
                  • {alert.message}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
