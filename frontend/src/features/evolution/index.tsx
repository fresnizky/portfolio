import { useState } from 'react'
import { useSnapshots } from './hooks/useSnapshots'
import { useExchangeRate } from '@/features/exchange-rates/hooks/useExchangeRate'
import { EvolutionChart } from './components/EvolutionChart'
import { DateRangeSelector } from './components/DateRangeSelector'
import { CurrencyToggle } from './components/CurrencyToggle'
import { EvolutionSummary } from './components/EvolutionSummary'
import { getDateRange, type DateRangePeriod } from './utils'
import type { Currency } from '@/types/api'

export default function EvolutionPage() {
  const [period, setPeriod] = useState<DateRangePeriod>('ALL')
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('USD')
  const filters = getDateRange(period)

  const { data, isLoading, error } = useSnapshots(
    filters.from || filters.to ? filters : undefined
  )
  const { data: exchangeRateData } = useExchangeRate()

  // Only need rate if displaying in ARS
  const exchangeRate = displayCurrency === 'ARS' ? exchangeRateData?.rate ?? null : null

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
        <div className="flex items-center gap-4">
          <CurrencyToggle value={displayCurrency} onChange={setDisplayCurrency} />
          <DateRangeSelector value={period} onChange={setPeriod} />
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <EvolutionChart
          snapshots={data?.snapshots ?? []}
          isLoading={isLoading}
          displayCurrency={displayCurrency}
          exchangeRate={exchangeRate}
        />
      </div>

      <EvolutionSummary
        snapshots={data?.snapshots ?? []}
        displayCurrency={displayCurrency}
        exchangeRate={exchangeRate}
      />
    </div>
  )
}
