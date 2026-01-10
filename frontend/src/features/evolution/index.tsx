import { useState } from 'react'
import { useSnapshots } from './hooks/useSnapshots'
import { EvolutionChart } from './components/EvolutionChart'
import { DateRangeSelector } from './components/DateRangeSelector'
import { EvolutionSummary } from './components/EvolutionSummary'
import { getDateRange, type DateRangePeriod } from './utils'

export default function EvolutionPage() {
  const [period, setPeriod] = useState<DateRangePeriod>('ALL')
  const filters = getDateRange(period)

  const { data, isLoading, error } = useSnapshots(
    filters.from || filters.to ? filters : undefined
  )

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 rounded-lg p-4">
          Error al cargar datos: {error.message}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Evolución del Portfolio</h1>
        <DateRangeSelector value={period} onChange={setPeriod} />
      </div>

      <div className="bg-white border rounded-lg p-6">
        <EvolutionChart
          snapshots={data?.snapshots ?? []}
          isLoading={isLoading}
        />
      </div>

      <EvolutionSummary snapshots={data?.snapshots ?? []} />
    </div>
  )
}
