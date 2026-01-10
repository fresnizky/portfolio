interface PortfolioSummaryCardProps {
  totalValue: string
  isLoading?: boolean
}

function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

export function PortfolioSummaryCard({ totalValue, isLoading = false }: PortfolioSummaryCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">Total Portfolio Value</p>
      {isLoading ? (
        <p className="mt-2 text-3xl font-bold text-gray-400">Loading...</p>
      ) : (
        <p className="mt-2 text-3xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
      )}
    </div>
  )
}
