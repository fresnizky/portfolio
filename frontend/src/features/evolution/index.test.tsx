import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import EvolutionPage from './index'
import { api } from '@/lib/api'
import type { SnapshotListResponse } from '@/types/api'

vi.mock('@/lib/api', () => ({
  api: {
    snapshots: {
      list: vi.fn(),
    },
  },
}))

// Mock Recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
}))

describe('EvolutionPage', () => {
  let queryClient: QueryClient

  const createWrapper = () => {
    return function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )
    }
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    vi.clearAllMocks()
  })

  const mockSnapshotsResponse: SnapshotListResponse = {
    snapshots: [
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
    ],
    total: 2,
  }

  it('should render page title', async () => {
    vi.mocked(api.snapshots.list).mockResolvedValue(mockSnapshotsResponse)

    render(<EvolutionPage />, { wrapper: createWrapper() })

    expect(screen.getByText('Evolución del Portfolio')).toBeInTheDocument()
  })

  it('should render date range selector', async () => {
    vi.mocked(api.snapshots.list).mockResolvedValue(mockSnapshotsResponse)

    render(<EvolutionPage />, { wrapper: createWrapper() })

    expect(screen.getByText('1M')).toBeInTheDocument()
    expect(screen.getByText('3M')).toBeInTheDocument()
    expect(screen.getByText('6M')).toBeInTheDocument()
    expect(screen.getByText('1Y')).toBeInTheDocument()
    expect(screen.getByText('Todo')).toBeInTheDocument()
  })

  it('should fetch snapshots on mount', async () => {
    vi.mocked(api.snapshots.list).mockResolvedValue(mockSnapshotsResponse)

    render(<EvolutionPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(api.snapshots.list).toHaveBeenCalled()
    })
  })

  it('should refetch when period changes', async () => {
    const user = userEvent.setup()
    vi.mocked(api.snapshots.list).mockResolvedValue(mockSnapshotsResponse)

    render(<EvolutionPage />, { wrapper: createWrapper() })

    // Wait for initial fetch
    await waitFor(() => {
      expect(api.snapshots.list).toHaveBeenCalled()
    })

    const initialCallCount = vi.mocked(api.snapshots.list).mock.calls.length

    // Change period
    await user.click(screen.getByText('1M'))

    // Should fetch with new filters (at least one more call)
    await waitFor(() => {
      expect(vi.mocked(api.snapshots.list).mock.calls.length).toBeGreaterThan(initialCallCount)
    })
  })

  it('should show error state on API failure', async () => {
    vi.mocked(api.snapshots.list).mockRejectedValue(new Error('Network error'))

    render(<EvolutionPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText(/Error al cargar datos/)).toBeInTheDocument()
    })
  })

  it('should show loading state while fetching', async () => {
    vi.mocked(api.snapshots.list).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    render(<EvolutionPage />, { wrapper: createWrapper() })

    // Loading state is shown in EvolutionChart
    const loadingElement = document.querySelector('.animate-pulse')
    expect(loadingElement).toBeInTheDocument()
  })

  it('should render chart after data loads', async () => {
    vi.mocked(api.snapshots.list).mockResolvedValue(mockSnapshotsResponse)

    render(<EvolutionPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })
  })

  it('should render summary after data loads', async () => {
    vi.mocked(api.snapshots.list).mockResolvedValue(mockSnapshotsResponse)

    render(<EvolutionPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      // Summary shows start and end values
      expect(screen.getByText('$10,000.00')).toBeInTheDocument()
      expect(screen.getByText('$12,000.00')).toBeInTheDocument()
    })
  })
})
