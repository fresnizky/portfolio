import type { Transaction } from '@/types/api'
import { TransactionTable } from './TransactionTable'

interface TransactionListProps {
  transactions: Transaction[]
  isLoading?: boolean
}

function TableSkeleton() {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="inline-block min-w-full align-middle">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Date', 'Type', 'Asset', 'Quantity', 'Price', 'Comm.', 'Total'].map(
                (header, index) => (
                  <th
                    key={header}
                    className={`px-4 py-3 ${index >= 4 && index <= 5 ? 'hidden md:table-cell' : ''}`}
                  >
                    <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i}>
                <td className="px-4 py-3">
                  <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-5 w-12 animate-pulse rounded-full bg-gray-200" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
                </td>
                <td className="px-4 py-3">
                  <div className="ml-auto h-4 w-16 animate-pulse rounded bg-gray-200" />
                </td>
                <td className="hidden md:table-cell px-4 py-3">
                  <div className="ml-auto h-4 w-20 animate-pulse rounded bg-gray-200" />
                </td>
                <td className="hidden md:table-cell px-4 py-3">
                  <div className="ml-auto h-4 w-14 animate-pulse rounded bg-gray-200" />
                </td>
                <td className="px-4 py-3">
                  <div className="ml-auto h-4 w-20 animate-pulse rounded bg-gray-200" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function TransactionList({ transactions, isLoading }: TransactionListProps) {
  if (isLoading) {
    return <TableSkeleton />
  }

  if (transactions.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500">No transactions recorded yet</p>
      </div>
    )
  }

  return <TransactionTable transactions={transactions} />
}
