import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExportSection } from './ExportSection'
import { api } from '@/lib/api'

// Mock the api
vi.mock('@/lib/api', () => ({
  api: {
    settings: {
      exportJson: vi.fn(),
      exportCsv: vi.fn(),
    },
  },
}))

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url')
const mockRevokeObjectURL = vi.fn()
global.URL.createObjectURL = mockCreateObjectURL
global.URL.revokeObjectURL = mockRevokeObjectURL

describe('ExportSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render export buttons', () => {
    render(<ExportSection />)

    expect(screen.getByText(/exportar json/i)).toBeInTheDocument()
    expect(screen.getByText(/exportar csv/i)).toBeInTheDocument()
  })

  it('should export JSON when clicking JSON button', async () => {
    const user = userEvent.setup()
    const mockData = {
      exportedAt: '2026-01-10T12:00:00.000Z',
      user: { email: 'test@example.com' },
      assets: [],
      holdings: [],
      transactions: [],
      snapshots: [],
    }
    vi.mocked(api.settings.exportJson).mockResolvedValue(mockData)

    render(<ExportSection />)

    const jsonButton = screen.getByText(/exportar json/i)
    await user.click(jsonButton)

    await waitFor(() => {
      expect(api.settings.exportJson).toHaveBeenCalled()
    })
  })

  it('should export CSV when clicking CSV button', async () => {
    const user = userEvent.setup()
    const mockBlob = new Blob(['test'], { type: 'application/zip' })
    vi.mocked(api.settings.exportCsv).mockResolvedValue(mockBlob)

    render(<ExportSection />)

    const csvButton = screen.getByText(/exportar csv/i)
    await user.click(csvButton)

    await waitFor(() => {
      expect(api.settings.exportCsv).toHaveBeenCalled()
    })
  })

  it('should show success message after export', async () => {
    const user = userEvent.setup()
    const mockData = {
      exportedAt: '2026-01-10T12:00:00.000Z',
      user: { email: 'test@example.com' },
      assets: [],
      holdings: [],
      transactions: [],
      snapshots: [],
    }
    vi.mocked(api.settings.exportJson).mockResolvedValue(mockData)

    render(<ExportSection />)

    const jsonButton = screen.getByText(/exportar json/i)
    await user.click(jsonButton)

    await waitFor(() => {
      expect(screen.getByText(/archivo descargado correctamente/i)).toBeInTheDocument()
    })
  })

  it('should show error message on export failure', async () => {
    const user = userEvent.setup()
    vi.mocked(api.settings.exportJson).mockRejectedValue(new Error('Export failed'))

    render(<ExportSection />)

    const jsonButton = screen.getByText(/exportar json/i)
    await user.click(jsonButton)

    await waitFor(() => {
      expect(screen.getByText(/export failed/i)).toBeInTheDocument()
    })
  })

  it('should disable buttons while loading', async () => {
    const user = userEvent.setup()
    vi.mocked(api.settings.exportJson).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    render(<ExportSection />)

    const buttons = screen.getAllByRole('button')
    const jsonButton = buttons[0]
    await user.click(jsonButton)

    await waitFor(() => {
      expect(buttons[0]).toBeDisabled()
      expect(buttons[1]).toBeDisabled()
    })
  })
})
