import { useState } from 'react'
import type { Position } from '@/types/api'
import { usePortfolioSummary, useUpdatePrice, useBatchUpdatePrices } from './hooks/usePortfolio'
import { PortfolioSummaryCard } from './components/PortfolioSummaryCard'
import { StaleAlertBanner } from './components/StaleAlertBanner'
import { PositionList } from './components/PositionList'
import { PriceUpdateModal } from './components/PriceUpdateModal'
import { BatchPriceUpdateModal } from './components/BatchPriceUpdateModal'

export function HoldingsPage() {
  const { data: summary, isLoading, isError } = usePortfolioSummary()
  const updatePrice = useUpdatePrice()
  const batchUpdatePrices = useBatchUpdatePrices()

  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false)
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false)

  const handleUpdatePrice = (position: Position) => {
    setSelectedPosition(position)
    setIsPriceModalOpen(true)
  }

  const handlePriceSubmit = async (assetId: string, price: number) => {
    await updatePrice.mutateAsync({ assetId, price })
    setIsPriceModalOpen(false)
    setSelectedPosition(null)
  }

  const handleBatchSubmit = async (prices: Array<{ assetId: string; price: number }>) => {
    await batchUpdatePrices.mutateAsync({ prices })
    setIsBatchModalOpen(false)
  }

  const handleOpenBatchModal = () => {
    setIsBatchModalOpen(true)
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        <p className="font-medium">Error loading portfolio</p>
        <p className="text-sm">Please try refreshing the page.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Holdings & Prices</h1>
      </div>

      <PortfolioSummaryCard
        totalValue={summary?.totalValue || '0'}
        isLoading={isLoading}
      />

      {summary?.positions && (
        <StaleAlertBanner
          positions={summary.positions}
          onUpdatePrices={handleOpenBatchModal}
        />
      )}

      {isLoading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-500">Loading positions...</p>
        </div>
      ) : (
        <PositionList
          positions={summary?.positions || []}
          onUpdatePrice={handleUpdatePrice}
        />
      )}

      <PriceUpdateModal
        isOpen={isPriceModalOpen}
        onClose={() => {
          setIsPriceModalOpen(false)
          setSelectedPosition(null)
        }}
        position={selectedPosition}
        onSubmit={handlePriceSubmit}
        isLoading={updatePrice.isPending}
      />

      <BatchPriceUpdateModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        positions={summary?.positions || []}
        onSubmit={handleBatchSubmit}
        isLoading={batchUpdatePrices.isPending}
      />
    </div>
  )
}
