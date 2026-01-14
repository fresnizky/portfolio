import type { Transaction, TransactionType } from '@/types/api'
import { formatQuantity } from '@/lib/formatters'

const typeStyles: Record<TransactionType, string> = {
  BUY: 'bg-green-100 text-green-800',
  SELL: 'bg-red-100 text-red-800',
}

/**
 * Format a pre-formatted dollar amount string to currency display.
 * The backend already returns values like "450.75", we just need to
 * add the currency symbol and thousand separators.
 */
function formatCurrency(value: string): string {
  const numValue = Number(value)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue)
}

function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(new Date(isoDate))
}

interface TransactionTableProps {
  transactions: Transaction[]
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="inline-block min-w-full align-middle">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="sticky top-0 bg-gray-50 z-10">
            <tr>
              <th
                scope="col"
                className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                style={{ minWidth: '80px' }}
              >
                Date
              </th>
              <th
                scope="col"
                className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                style={{ minWidth: '60px' }}
              >
                Type
              </th>
              <th
                scope="col"
                className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                style={{ minWidth: '70px' }}
              >
                Asset
              </th>
              <th
                scope="col"
                className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                style={{ minWidth: '90px' }}
              >
                Quantity
              </th>
              <th
                scope="col"
                className="hidden md:table-cell whitespace-nowrap px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                style={{ minWidth: '100px' }}
              >
                Price
              </th>
              <th
                scope="col"
                className="hidden md:table-cell whitespace-nowrap px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                style={{ minWidth: '80px' }}
              >
                Comm.
              </th>
              <th
                scope="col"
                className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                style={{ minWidth: '100px' }}
              >
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {transactions.map((tx) => (
              <TransactionRow key={tx.id} transaction={tx} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TransactionRow({ transaction: tx }: { transaction: Transaction }) {
  const total = tx.type === 'BUY' ? tx.totalCost! : tx.totalProceeds!

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
        {formatDate(tx.date)}
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${typeStyles[tx.type]}`}
        >
          {tx.type}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
        {tx.asset.ticker}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">
        {formatQuantity(tx.quantity)}
      </td>
      <td className="hidden md:table-cell whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">
        {formatCurrency(tx.price)}
      </td>
      <td className="hidden md:table-cell whitespace-nowrap px-4 py-3 text-right text-sm text-gray-500">
        {formatCurrency(tx.commission)}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-gray-900">
        {formatCurrency(total)}
      </td>
    </tr>
  )
}
