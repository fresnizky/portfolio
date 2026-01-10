import { formatCurrency } from '@/lib/formatters'

interface PortfolioSummaryCardProps {
  totalValue: string
  isLoading?: boolean
}

export function PortfolioSummaryCard({
  totalValue,
  isLoading = false,
}: PortfolioSummaryCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">Total Portfolio Value</p>
      {isLoading ? (
        <div data-testid="summary-skeleton" className="mt-2 animate-pulse">
          <div className="h-9 w-40 rounded bg-gray-200" />
        </div>
      ) : (
        <p className="mt-2 text-3xl font-bold text-gray-900">
          {formatCurrency(totalValue)}
        </p>
      )}
    </div>
  )
}
