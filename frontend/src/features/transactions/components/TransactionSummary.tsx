import { useMemo } from 'react'
import type { Transaction } from '@/types/api'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

interface TransactionSummaryProps {
  transactions: Transaction[]
}

export function TransactionSummary({ transactions }: TransactionSummaryProps) {
  const { totalInvested, totalWithdrawn } = useMemo(() => {
    let invested = 0
    let withdrawn = 0

    for (const tx of transactions) {
      const totalCents = Number(tx.totalCents)
      if (tx.type === 'BUY') {
        invested += totalCents
      } else {
        withdrawn += totalCents
      }
    }

    return {
      totalInvested: invested / 100,
      totalWithdrawn: withdrawn / 100,
    }
  }, [transactions])

  return (
    <div className="flex gap-8 rounded-lg bg-white p-4 shadow">
      <div>
        <span className="text-sm text-gray-500">Total Invested</span>
        <p className="text-lg font-semibold text-green-600">
          {formatCurrency(totalInvested)}
        </p>
      </div>
      <div>
        <span className="text-sm text-gray-500">Total Withdrawn</span>
        <p className="text-lg font-semibold text-red-600">
          {formatCurrency(totalWithdrawn)}
        </p>
      </div>
    </div>
  )
}
