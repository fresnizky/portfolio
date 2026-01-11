import { useDashboard } from './hooks/useDashboard'
import { PortfolioSummaryCard } from './components/PortfolioSummaryCard'
import { AllocationChart } from './components/AllocationChart'
import { PositionsList } from './components/PositionsList'
import { AlertsPanel } from './components/AlertsPanel'
import { AttentionRequiredSection } from './components/AttentionRequiredSection'

export function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useDashboard()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <PortfolioSummaryCard
        totalValue={data?.totalValue ?? '0'}
        displayCurrency={data?.displayCurrency ?? 'USD'}
        exchangeRate={data?.exchangeRate ?? null}
        isLoading={isLoading}
        onExchangeRateRefresh={() => refetch()}
      />

      {/* Alerts Panel - Prominent placement */}
      {!isLoading && !isError && (
        <AlertsPanel alerts={data?.alerts ?? []} />
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">
            Error loading dashboard: {error?.message ?? 'Unknown error'}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-2 text-sm font-medium text-red-700 underline hover:text-red-800"
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Asset Allocation
              </h2>
              <AllocationChart positions={data?.positions ?? []} />
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Portfolio Positions
              </h2>
              <PositionsList positions={data?.positions ?? []} />
            </div>
          </div>

          {/* Attention Required Section - Consolidated view */}
          <AttentionRequiredSection alerts={data?.alerts ?? []} />
        </>
      )}
    </div>
  )
}
