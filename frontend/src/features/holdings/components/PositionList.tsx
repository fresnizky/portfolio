import type { Position } from '@/types/api'
import { PositionCard } from './PositionCard'

interface PositionListProps {
  positions: Position[]
  onUpdatePrice: (position: Position) => void
}

export function PositionList({ positions, onUpdatePrice }: PositionListProps) {
  if (positions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
        <p className="text-gray-500">No holdings yet</p>
        <p className="mt-1 text-sm text-gray-400">
          Add assets in the Portfolio section to see your holdings here
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {positions.map((position) => (
        <PositionCard
          key={position.assetId}
          position={position}
          onUpdatePrice={onUpdatePrice}
        />
      ))}
    </div>
  )
}
