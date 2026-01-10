import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EvolutionSummary } from './EvolutionSummary'
import type { Snapshot } from '@/types/api'

describe('EvolutionSummary', () => {
  const createSnapshot = (
    id: string,
    date: string,
    totalValue: string
  ): Snapshot => ({
    id,
    date,
    totalValue,
    assets: [],
    createdAt: date,
  })

  it('should return null when no snapshots', () => {
    const { container } = render(<EvolutionSummary snapshots={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('should calculate and display start and end values', () => {
    const snapshots = [
      createSnapshot('1', '2026-01-01T00:00:00.000Z', '10000.00'),
      createSnapshot('2', '2026-01-15T00:00:00.000Z', '12000.00'),
    ]

    render(<EvolutionSummary snapshots={snapshots} />)

    expect(screen.getByText('$10,000.00')).toBeInTheDocument()
    expect(screen.getByText('$12,000.00')).toBeInTheDocument()
  })

  it('should show positive change in green', () => {
    const snapshots = [
      createSnapshot('1', '2026-01-01T00:00:00.000Z', '10000.00'),
      createSnapshot('2', '2026-01-15T00:00:00.000Z', '12000.00'),
    ]

    render(<EvolutionSummary snapshots={snapshots} />)

    // Absolute change: +$2,000.00
    const absoluteChange = screen.getByText('+$2,000.00')
    expect(absoluteChange).toHaveClass('text-green-600')

    // Percentage change: +20.00%
    const percentChange = screen.getByText('+20.00%')
    expect(percentChange).toHaveClass('text-green-600')
  })

  it('should show negative change in red', () => {
    const snapshots = [
      createSnapshot('1', '2026-01-01T00:00:00.000Z', '10000.00'),
      createSnapshot('2', '2026-01-15T00:00:00.000Z', '8000.00'),
    ]

    render(<EvolutionSummary snapshots={snapshots} />)

    // Absolute change: -$2,000.00
    const absoluteChange = screen.getByText('-$2,000.00')
    expect(absoluteChange).toHaveClass('text-red-600')

    // Percentage change: -20.00%
    const percentChange = screen.getByText('-20.00%')
    expect(percentChange).toHaveClass('text-red-600')
  })

  it('should format currency and percentage correctly', () => {
    const snapshots = [
      createSnapshot('1', '2026-01-01T00:00:00.000Z', '1234.56'),
      createSnapshot('2', '2026-01-15T00:00:00.000Z', '2469.12'),
    ]

    render(<EvolutionSummary snapshots={snapshots} />)

    expect(screen.getByText('$1,234.56')).toBeInTheDocument()
    expect(screen.getByText('$2,469.12')).toBeInTheDocument()
    expect(screen.getByText('+$1,234.56')).toBeInTheDocument()
    expect(screen.getByText('+100.00%')).toBeInTheDocument()
  })

  it('should handle single snapshot', () => {
    const snapshots = [
      createSnapshot('1', '2026-01-01T00:00:00.000Z', '10000.00'),
    ]

    render(<EvolutionSummary snapshots={snapshots} />)

    // Both start and end should be the same snapshot
    const values = screen.getAllByText('$10,000.00')
    expect(values).toHaveLength(2) // Start and end value

    // No change
    expect(screen.getByText('+$0.00')).toBeInTheDocument()
    expect(screen.getByText('+0.00%')).toBeInTheDocument()
  })

  it('should sort snapshots and use first/last by date', () => {
    // Provide unsorted snapshots
    const snapshots = [
      createSnapshot('2', '2026-01-15T00:00:00.000Z', '15000.00'),
      createSnapshot('1', '2026-01-01T00:00:00.000Z', '10000.00'),
      createSnapshot('3', '2026-01-10T00:00:00.000Z', '12000.00'),
    ]

    render(<EvolutionSummary snapshots={snapshots} />)

    // Start value should be from Jan 1 (10000)
    // End value should be from Jan 15 (15000)
    expect(screen.getByText('$10,000.00')).toBeInTheDocument() // Start
    expect(screen.getByText('$15,000.00')).toBeInTheDocument() // End
    expect(screen.getByText('+$5,000.00')).toBeInTheDocument() // Absolute change
    expect(screen.getByText('+50.00%')).toBeInTheDocument() // Percentage change
  })
})
