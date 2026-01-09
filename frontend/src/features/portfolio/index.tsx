import { useState } from 'react'
import { useAssets } from './hooks/useAssets'
import { AssetCard } from './components/AssetCard'
import { TargetSumIndicator } from './components/TargetSumIndicator'
import { CreateAssetModal } from './components/CreateAssetModal'
import { EditAssetModal } from './components/EditAssetModal'
import { DeleteAssetDialog } from './components/DeleteAssetDialog'
import { TargetEditor } from './components/TargetEditor'
import { Modal } from '@/components/common/Modal'
import type { Asset } from '@/types/api'

export function PortfolioPage() {
  const { data: assets, isLoading, isError, error } = useAssets()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null)
  const [isTargetEditorOpen, setIsTargetEditorOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Portfolio Configuration</h1>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-8">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-lg bg-gray-200" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Portfolio Configuration</h1>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error?.message ?? 'Failed to load assets'}</p>
        </div>
      </div>
    )
  }

  const hasAssets = assets && assets.length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Portfolio Configuration</h1>
        <div className="flex items-center gap-4">
          {hasAssets && <TargetSumIndicator assets={assets} />}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Asset
          </button>
        </div>
      </div>

      {hasAssets ? (
        <>
          <div className="flex justify-end">
            <button
              onClick={() => setIsTargetEditorOpen(true)}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Edit Targets
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onEdit={setEditingAsset}
                onDelete={setDeletingAsset}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No assets yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            Get started by adding your first asset to your portfolio.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-6 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Your First Asset
          </button>
        </div>
      )}

      {/* Modals */}
      <CreateAssetModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <EditAssetModal
        asset={editingAsset}
        isOpen={!!editingAsset}
        onClose={() => setEditingAsset(null)}
      />

      <DeleteAssetDialog
        asset={deletingAsset}
        isOpen={!!deletingAsset}
        onClose={() => setDeletingAsset(null)}
      />

      {hasAssets && (
        <Modal
          isOpen={isTargetEditorOpen}
          onClose={() => setIsTargetEditorOpen(false)}
          title="Edit Target Allocations"
        >
          <TargetEditor
            assets={assets}
            onClose={() => setIsTargetEditorOpen(false)}
          />
        </Modal>
      )}
    </div>
  )
}
