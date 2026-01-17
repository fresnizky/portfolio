import { useState } from 'react'
import type { TransactionListFilters } from '@/types/api'
import { useTransactions } from './hooks/useTransactions'
import { useAssets } from '@/features/portfolio/hooks/useAssets'
import { TransactionList } from './components/TransactionList'
import { TransactionFilters } from './components/TransactionFilters'
import { TransactionSummary } from './components/TransactionSummary'
import { CreateTransactionModal } from './components/CreateTransactionModal'
import { usePendingContribution } from '@/features/contributions/hooks/usePendingContribution'
import { ContributionFlowModal } from '@/features/contributions/components/ContributionFlowModal'
import { DiscardConfirmDialog } from '@/features/contributions/components/DiscardConfirmDialog'

export function TransactionsPage() {
  const [filters, setFilters] = useState<TransactionListFilters>({})
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isContributionFlowOpen, setIsContributionFlowOpen] = useState(false)
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false)

  const { data: assetsData, isLoading: assetsLoading } = useAssets()
  const { data, isLoading, isError } = useTransactions(filters)
  const { pending, hasPending, remainingAllocations, clear: clearPending } = usePendingContribution()

  const assets = assetsData || []
  const transactions = data?.transactions || []

  const handleResumeContribution = () => {
    setIsContributionFlowOpen(true)
  }

  const handleDiscardContribution = () => {
    setIsDiscardDialogOpen(true)
  }

  const handleConfirmDiscard = () => {
    clearPending()
    setIsDiscardDialogOpen(false)
  }

  const handleCancelDiscard = () => {
    setIsDiscardDialogOpen(false)
  }

  const handleContributionFlowClose = () => {
    setIsContributionFlowOpen(false)
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        <p className="font-medium">Error loading transactions</p>
        <p className="text-sm">Please try refreshing the page.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          disabled={assetsLoading || assets.length === 0}
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add Transaction
        </button>
      </div>

      {/* Pending Contribution Banner */}
      {hasPending && pending && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-blue-900">
                Tienes un aporte pendiente de registrar
              </p>
              <p className="text-sm text-blue-700">
                {remainingAllocations.length} de {pending.allocations.length} transacciones pendientes
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleResumeContribution}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
              >
                Continuar
              </button>
              <button
                onClick={handleDiscardContribution}
                className="rounded-md border border-blue-200 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100"
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}

      <TransactionSummary transactions={transactions} />

      <TransactionFilters
        assets={assets}
        filters={filters}
        onFiltersChange={setFilters}
      />

      <TransactionList transactions={transactions} isLoading={isLoading} />

      <CreateTransactionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        assets={assets}
      />

      <ContributionFlowModal
        isOpen={isContributionFlowOpen}
        onClose={handleContributionFlowClose}
      />

      <DiscardConfirmDialog
        isOpen={isDiscardDialogOpen}
        onConfirm={handleConfirmDiscard}
        onCancel={handleCancelDiscard}
        pendingCount={remainingAllocations.length}
      />
    </div>
  )
}
