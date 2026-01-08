import { Modal } from '@/components/common/Modal'
import { AssetForm } from './AssetForm'
import { useCreateAsset } from '../hooks/useAssets'
import type { CreateAssetFormData } from '@/validations/asset'

interface CreateAssetModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function CreateAssetModal({ isOpen, onClose, onSuccess }: CreateAssetModalProps) {
  const createAsset = useCreateAsset()

  const handleSubmit = async (data: CreateAssetFormData) => {
    try {
      await createAsset.mutateAsync(data)
      onClose()
      onSuccess?.()
    } catch {
      // Error is handled by the mutation
    }
  }

  const handleClose = () => {
    if (!createAsset.isPending) {
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Asset">
      <AssetForm
        onSubmit={handleSubmit}
        onCancel={handleClose}
        isSubmitting={createAsset.isPending}
      />
      {createAsset.isError && (
        <p className="mt-4 text-sm text-red-600">
          {createAsset.error?.message ?? 'Failed to create asset'}
        </p>
      )}
    </Modal>
  )
}
