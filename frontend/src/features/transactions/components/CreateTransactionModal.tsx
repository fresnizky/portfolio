import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '@/components/common/Modal'
import { TransactionForm } from './TransactionForm'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import type { Asset } from '@/types/api'
import type { CreateTransactionFormData } from '@/validations/transaction'

interface CreateTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  assets: Asset[]
}

export function CreateTransactionModal({
  isOpen,
  onClose,
  onSuccess,
  assets,
}: CreateTransactionModalProps) {
  const queryClient = useQueryClient()

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
      // Invalidate transactions and portfolio (holdings updated automatically)
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.all })
    },
  })

  const handleSubmit = async (data: CreateTransactionFormData) => {
    try {
      await createTransaction.mutateAsync(data)
      onClose()
      onSuccess?.()
    } catch {
      // Error is handled by the mutation
    }
  }

  const handleClose = () => {
    if (!createTransaction.isPending) {
      onClose()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Record Transaction"
      isLoading={createTransaction.isPending}
    >
      <TransactionForm
        assets={assets}
        onSubmit={handleSubmit}
        onCancel={handleClose}
        isSubmitting={createTransaction.isPending}
      />
      {createTransaction.isError && (
        <p className="mt-4 text-sm text-red-600">
          {createTransaction.error?.message ?? 'Failed to record transaction'}
        </p>
      )}
    </Modal>
  )
}
