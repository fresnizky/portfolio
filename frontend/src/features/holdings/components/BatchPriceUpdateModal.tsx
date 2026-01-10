import { useState, useEffect } from 'react'
import { Modal } from '@/components/common/Modal'
import type { Position } from '@/types/api'
import { isPriceStale } from '../utils/staleness'

interface BatchPriceUpdateModalProps {
  isOpen: boolean
  onClose: () => void
  positions: Position[]
  onSubmit: (prices: Array<{ assetId: string; price: number }>) => Promise<void>
  isLoading?: boolean
}

export function BatchPriceUpdateModal({
  isOpen,
  onClose,
  positions,
  onSubmit,
  isLoading = false,
}: BatchPriceUpdateModalProps) {
  const stalePositions = positions.filter((p) => isPriceStale(p.priceUpdatedAt))
  const [prices, setPrices] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initialPrices: Record<string, string> = {}
    stalePositions.forEach((p) => {
      initialPrices[p.assetId] = p.currentPrice || ''
    })
    setPrices(initialPrices)
    setError(null)
  }, [positions, isOpen])

  if (stalePositions.length === 0) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const priceArray: Array<{ assetId: string; price: number }> = []

    for (const position of stalePositions) {
      const priceStr = prices[position.assetId]
      const priceNum = parseFloat(priceStr)

      if (!priceStr || isNaN(priceNum) || priceNum <= 0) {
        setError('All prices must be greater than 0')
        return
      }

      priceArray.push({ assetId: position.assetId, price: priceNum })
    }

    await onSubmit(priceArray)
  }

  const updatePrice = (assetId: string, value: string) => {
    setPrices((prev) => ({ ...prev, [assetId]: value }))
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Stale Prices" isLoading={isLoading}>
      <form onSubmit={handleSubmit}>
        <p className="mb-4 text-sm text-gray-500">
          Update prices for {stalePositions.length} asset{stalePositions.length > 1 ? 's' : ''} that need updating.
        </p>

        <div className="max-h-64 space-y-3 overflow-y-auto">
          {stalePositions.map((position) => (
            <div key={position.assetId} className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-900">{position.ticker}</p>
                <p className="truncate text-sm text-gray-500">{position.name}</p>
              </div>
              <div className="relative w-32">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  value={prices[position.assetId] || ''}
                  onChange={(e) => updatePrice(position.assetId, e.target.value)}
                  step="0.01"
                  min="0"
                  className="block w-full rounded-md border border-gray-300 py-1.5 pl-6 pr-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>
            </div>
          ))}
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
