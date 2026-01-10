import type { Transaction, TransactionType } from '@/types/api'

const typeStyles: Record<TransactionType, string> = {
  BUY: 'bg-green-100 text-green-800',
  SELL: 'bg-red-100 text-red-800',
}

function formatFromCents(cents: string): string {
  const value = Number(cents) / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatQuantity(quantity: string): string {
  const num = parseFloat(quantity)
  if (Number.isInteger(num)) return num.toString()
  return num.toFixed(Math.min(8, (quantity.split('.')[1] || '').length))
}

function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(isoDate))
}

interface TransactionCardProps {
  transaction: Transaction
}

export function TransactionCard({ transaction }: TransactionCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${typeStyles[transaction.type]}`}
          >
            {transaction.type}
          </span>
          <span className="text-sm font-medium text-gray-500">{transaction.asset.ticker}</span>
        </div>
        <span className="text-sm text-gray-500">{formatDate(transaction.date)}</span>
      </div>

      <h3 className="mt-2 text-base font-semibold text-gray-900">{transaction.asset.name}</h3>

      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Quantity</span>
          <span className="font-medium text-gray-900">{formatQuantity(transaction.quantity)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Price</span>
          <span className="font-medium text-gray-900">
            {formatFromCents(transaction.priceCents)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Commission</span>
          <span className="font-medium text-gray-900">
            {formatFromCents(transaction.commissionCents)}
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-2">
          <span className="text-sm font-medium text-gray-500">
            {transaction.type === 'BUY' ? 'Total Cost' : 'Total Proceeds'}
          </span>
          <span className="text-lg font-semibold text-gray-900">
            {formatFromCents(transaction.totalCents)}
          </span>
        </div>
      </div>
    </div>
  )
}
