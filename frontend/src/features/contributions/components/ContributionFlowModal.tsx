import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '@/components/common/Modal'
import { TransactionForm } from '@/features/transactions/components/TransactionForm'
import { ContributionCompleteSummary } from './ContributionCompleteSummary'
import { ContributionTransactionFlow } from './ContributionTransactionFlow'
import { usePendingContribution } from '../hooks/usePendingContribution'
import { useAssets } from '@/features/portfolio/hooks/useAssets'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import type { CreateTransactionFormData } from '@/validations/transaction'
import type { ContributionAllocation } from '@/types/api'

interface ContributionFlowModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ContributionFlowModal({ isOpen, onClose }: ContributionFlowModalProps) {
  const queryClient = useQueryClient()
  const { data: assetsData } = useAssets()
  const {
    pending,
    remainingAllocations,
    markAssetProcessed,
    complete,
    clear,
  } = usePendingContribution()
  const [recordedTransactions, setRecordedTransactions] = useState<string[]>([])
  const [isComplete, setIsComplete] = useState(false)

  const createTransaction = useMutation({
    mutationFn: (data: CreateTransactionFormData) =>
      api.transactions.create({
        type: data.type,
        assetId: data.assetId,
        date: data.date,
        quantity: data.quantity,
        price: data.price,
        commission: data.commission,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.all })
    },
  })

  if (!pending) return null

  const totalCount = pending.allocations.length
  const processedCount = totalCount - remainingAllocations.length

  const handleTransactionComplete = (assetId: string) => {
    setRecordedTransactions((prev) => [...prev, assetId])
    markAssetProcessed(assetId)

    // Check if this was the last allocation
    if (remainingAllocations.length === 1) {
      complete()
      setIsComplete(true)
    }
  }

  const handleSkip = (assetId: string) => {
    markAssetProcessed(assetId)

    // Check if this was the last allocation
    if (remainingAllocations.length === 1) {
      complete()
      setIsComplete(true)
    }
  }

  const handleDiscard = () => {
    clear()
    setRecordedTransactions([])
    setIsComplete(false)
    onClose()
  }

  const handleFinish = () => {
    clear()
    setRecordedTransactions([])
    setIsComplete(false)
    onClose()
  }

  // Convert date to ISO format for backend and submit
  const handleFormSubmit = async (data: CreateTransactionFormData, assetId: string) => {
    const isoDate = new Date(data.date + 'T00:00:00.000Z').toISOString()
    await createTransaction.mutateAsync({
      ...data,
      date: isoDate,
    })
    handleTransactionComplete(assetId)
  }

  const modalTitle = isComplete
    ? 'Aporte Completado'
    : `Registrar Transacción (${processedCount + 1}/${totalCount})`

  const renderTransactionForm = (currentAllocation: ContributionAllocation) => (
    <>
      <TransactionForm
        assets={assetsData ?? []}
        onSubmit={(data) => handleFormSubmit(data, currentAllocation.assetId)}
        onCancel={handleDiscard}
        isSubmitting={createTransaction.isPending}
        defaultValues={{
          type: 'buy',
          assetId: currentAllocation.assetId,
          date: new Date().toISOString().split('T')[0],
          quantity: 0,
          price: 0,
          commission: 0,
        }}
        lockedAssetId={currentAllocation.assetId}
        suggestedAmount={parseFloat(currentAllocation.adjustedAllocation)}
      />

      {createTransaction.isError && (
        <p className="text-sm text-red-600">
          {createTransaction.error?.message ?? 'Error al registrar la transacción'}
        </p>
      )}
    </>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleDiscard}
      title={modalTitle}
      isLoading={createTransaction.isPending}
    >
      {isComplete ? (
        <ContributionCompleteSummary
          totalAmount={pending.amount}
          recordedCount={recordedTransactions.length}
          skippedCount={totalCount - recordedTransactions.length}
          onViewTransactions={handleFinish}
          onClose={handleFinish}
        />
      ) : (
        <ContributionTransactionFlow
          allocations={pending.allocations}
          processedAssetIds={pending.processedAssetIds}
          onSkip={handleSkip}
          onCancel={handleDiscard}
          displayCurrency="USD"
          isSubmitting={createTransaction.isPending}
          renderForm={renderTransactionForm}
        />
      )}
    </Modal>
  )
}
