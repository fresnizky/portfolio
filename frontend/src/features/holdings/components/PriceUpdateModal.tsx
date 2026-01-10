import { useState, useEffect } from 'react'
import { Modal } from '@/components/common/Modal'
import type { Position } from '@/types/api'

interface PriceUpdateModalProps {
  isOpen: boolean
  onClose: () => void
  position: Position | null
  onSubmit: (assetId: string, price: number) => Promise<void>
  isLoading?: boolean
}

export function PriceUpdateModal({
  isOpen,
  onClose,
  position,
  onSubmit,
  isLoading = false,
}: PriceUpdateModalProps) {
  const [price, setPrice] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (position?.currentPrice) {
      setPrice(position.currentPrice)
    } else {
      setPrice('')
    }
    setError(null)
  }, [position])

  if (!position) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const priceNum = parseFloat(price)
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Price must be greater than 0')
      return
    }

    await onSubmit(position.assetId, priceNum)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Price" isLoading={isLoading}>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-900">{position.ticker}</span> - {position.name}
          </p>
        </div>

        <div className="mb-4">
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            New Price
          </label>
          <div className="relative mt-1">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
              $
            </span>
            <input
              type="number"
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              step="0.01"
              min="0"
              className="block w-full rounded-md border border-gray-300 py-2 pl-7 pr-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-3">
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
            {isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
