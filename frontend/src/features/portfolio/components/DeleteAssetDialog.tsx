import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useDeleteAsset } from '../hooks/useAssets'
import type { Asset } from '@/types/api'

interface DeleteAssetDialogProps {
  asset: Asset | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function DeleteAssetDialog({ asset, isOpen, onClose, onSuccess }: DeleteAssetDialogProps) {
  const deleteAsset = useDeleteAsset()

  const handleConfirm = async () => {
    if (!asset) return

    try {
      await deleteAsset.mutateAsync(asset.id)
      onClose()
      onSuccess?.()
    } catch {
      // Error is handled by the mutation
    }
  }

  const handleClose = () => {
    if (!deleteAsset.isPending) {
      onClose()
    }
  }

  if (!asset) return null

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={handleClose}
      onConfirm={handleConfirm}
      title={`Delete ${asset.ticker}?`}
      message={`This will permanently delete the asset "${asset.name}" and all associated data including holdings and transactions. This action cannot be undone.`}
      confirmText="Delete"
      cancelText="Cancel"
      isLoading={deleteAsset.isPending}
      variant="danger"
    />
  )
}
