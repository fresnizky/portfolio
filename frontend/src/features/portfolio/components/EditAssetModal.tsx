import { Modal } from '@/components/common/Modal'
import { AssetForm } from './AssetForm'
import { useUpdateAsset } from '../hooks/useAssets'
import type { Asset } from '@/types/api'
import type { AssetFormData } from '@/validations/asset'

interface EditAssetModalProps {
  asset: Asset | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function EditAssetModal({ asset, isOpen, onClose, onSuccess }: EditAssetModalProps) {
  const updateAsset = useUpdateAsset()

  const handleSubmit = async (data: AssetFormData) => {
    if (!asset) return

    try {
      // Only update ticker, name, category - target managed via TargetEditor
      await updateAsset.mutateAsync({
        id: asset.id,
        input: data,
      })
      onClose()
      onSuccess?.()
    } catch {
      // Error is handled by the mutation
    }
  }

  const handleClose = () => {
    if (!updateAsset.isPending) {
      onClose()
    }
  }

  if (!asset) return null

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Edit ${asset.ticker}`} isLoading={updateAsset.isPending}>
      <AssetForm
        asset={asset}
        onSubmit={handleSubmit}
        onCancel={handleClose}
        isSubmitting={updateAsset.isPending}
      />
      {updateAsset.isError && (
        <p className="mt-4 text-sm text-red-600">
          {updateAsset.error?.message ?? 'Failed to update asset'}
        </p>
      )}
    </Modal>
  )
}
