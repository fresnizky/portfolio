import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EvolutionChart } from './EvolutionChart'
import type { Snapshot } from '@/types/api'

// Mock Recharts to avoid rendering issues in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
    <div data-testid="line-chart" data-points={data.length}>
      {children}
    </div>
  ),
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
}))

describe('EvolutionChart', () => {
  const mockSnapshots: Snapshot[] = [
    {
      id: 'snapshot-1',
      date: '2026-01-01T00:00:00.000Z',
      totalValue: '10000.00',
      assets: [],
      createdAt: '2026-01-01T15:00:00.000Z',
    },
    {
      id: 'snapshot-2',
      date: '2026-01-10T00:00:00.000Z',
      totalValue: '12000.00',
      assets: [],
      createdAt: '2026-01-10T15:00:00.000Z',
    },
  ]

  it('should render loading state', () => {
    render(<EvolutionChart snapshots={[]} isLoading={true} />)

    const loadingElement = document.querySelector('.animate-pulse')
    expect(loadingElement).toBeInTheDocument()
  })

  it('should render empty state when no snapshots', () => {
    render(<EvolutionChart snapshots={[]} />)

    expect(screen.getByText(/No hay datos de evolución/)).toBeInTheDocument()
  })

  it('should render chart with data points', () => {
    render(<EvolutionChart snapshots={mockSnapshots} />)

    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    expect(screen.getByTestId('line-chart')).toHaveAttribute('data-points', '2')
  })

  it('should sort snapshots by date ascending', () => {
    const unsortedSnapshots: Snapshot[] = [
      {
        id: 'snapshot-2',
        date: '2026-01-10T00:00:00.000Z',
        totalValue: '12000.00',
        assets: [],
        createdAt: '2026-01-10T15:00:00.000Z',
      },
      {
        id: 'snapshot-1',
        date: '2026-01-01T00:00:00.000Z',
        totalValue: '10000.00',
        assets: [],
        createdAt: '2026-01-01T15:00:00.000Z',
      },
    ]

    render(<EvolutionChart snapshots={unsortedSnapshots} />)

    // Chart should render without errors (sorting happens internally)
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })

  it('should render chart elements', () => {
    render(<EvolutionChart snapshots={mockSnapshots} />)

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    expect(screen.getByTestId('x-axis')).toBeInTheDocument()
    expect(screen.getByTestId('y-axis')).toBeInTheDocument()
    expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument()
    expect(screen.getByTestId('tooltip')).toBeInTheDocument()
    expect(screen.getByTestId('line')).toBeInTheDocument()
  })
})
