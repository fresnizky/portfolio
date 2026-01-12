import { formatCurrency } from '@/lib/formatters'
import type { Currency, ExchangeRateInfo } from '@/types/api'
import { ExchangeRateIndicator } from './ExchangeRateIndicator'

interface PortfolioSummaryCardProps {
  totalValue: string
  displayCurrency?: Currency
  exchangeRate?: ExchangeRateInfo | null
  isLoading?: boolean
  onExchangeRateRefresh?: () => void
}

export function PortfolioSummaryCard({
  totalValue,
  displayCurrency = 'USD',
  exchangeRate = null,
  isLoading = false,
  onExchangeRateRefresh,
}: PortfolioSummaryCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-base md:text-sm font-medium text-gray-500">Total Portfolio Value</p>
        <ExchangeRateIndicator
          exchangeRate={exchangeRate}
          onRefresh={onExchangeRateRefresh}
        />
      </div>
      {isLoading ? (
        <div data-testid="summary-skeleton" className="mt-2 animate-pulse">
          <div className="h-9 w-40 rounded bg-gray-200" />
        </div>
      ) : (
        <p className="mt-2 text-3xl font-bold text-gray-900">
          {formatCurrency(totalValue, displayCurrency)}
        </p>
      )}
    </div>
  )
}
