import type { Transaction } from '@/types/api'
import { TransactionCard } from './TransactionCard'

interface TransactionListProps {
  transactions: Transaction[]
  isLoading?: boolean
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border border-gray-200 bg-white p-4"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="h-5 w-12 rounded-full bg-gray-200" />
              <div className="h-4 w-10 rounded bg-gray-200" />
            </div>
            <div className="h-4 w-20 rounded bg-gray-200" />
          </div>
          <div className="mt-2 h-5 w-40 rounded bg-gray-200" />
          <div className="mt-3 space-y-2">
            <div className="flex justify-between">
              <div className="h-4 w-16 rounded bg-gray-200" />
              <div className="h-4 w-12 rounded bg-gray-200" />
            </div>
            <div className="flex justify-between">
              <div className="h-4 w-12 rounded bg-gray-200" />
              <div className="h-4 w-16 rounded bg-gray-200" />
            </div>
            <div className="flex justify-between">
              <div className="h-4 w-20 rounded bg-gray-200" />
              <div className="h-4 w-14 rounded bg-gray-200" />
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-2">
              <div className="h-4 w-20 rounded bg-gray-200" />
              <div className="h-6 w-24 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function TransactionList({ transactions, isLoading }: TransactionListProps) {
  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (transactions.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500">No transactions recorded yet</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {transactions.map((transaction) => (
        <TransactionCard key={transaction.id} transaction={transaction} />
      ))}
    </div>
  )
}
