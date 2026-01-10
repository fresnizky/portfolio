export function formatCurrency(value: string | number, currency = 'USD'): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue)
}

export function formatPercentage(value: string | number, decimals = 2): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  return `${numValue.toFixed(decimals)}%`
}
