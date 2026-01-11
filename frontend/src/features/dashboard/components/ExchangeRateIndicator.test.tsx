import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ExchangeRateIndicator } from './ExchangeRateIndicator'
import { api } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  api: {
    exchangeRates: {
      getCurrent: vi.fn(),
    },
  },
}))

describe('ExchangeRateIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render nothing when exchangeRate is null', () => {
    const { container } = render(
      <ExchangeRateIndicator exchangeRate={null} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('should display current rate', () => {
    const exchangeRate = {
      usdToArs: 1050.50,
      fetchedAt: new Date().toISOString(),
      isStale: false,
    }

    render(<ExchangeRateIndicator exchangeRate={exchangeRate} />)

    expect(screen.getByTestId('exchange-rate-value')).toHaveTextContent(
      'USD/ARS: $1050.50'
    )
  })

  it('should display last updated time in relative format', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const exchangeRate = {
      usdToArs: 1000,
      fetchedAt: fiveMinutesAgo,
      isStale: false,
    }

    render(<ExchangeRateIndicator exchangeRate={exchangeRate} />)

    const timeElement = screen.getByTestId('exchange-rate-time')
    expect(timeElement).toBeInTheDocument()
    // Should contain "hace" (Spanish for "ago") and some time indication
    expect(timeElement.textContent).toMatch(/hace.*minutos?/i)
  })

  it('should show warning badge when isStale is true', () => {
    const exchangeRate = {
      usdToArs: 1000,
      fetchedAt: new Date().toISOString(),
      isStale: true,
    }

    render(<ExchangeRateIndicator exchangeRate={exchangeRate} />)

    expect(screen.getByTestId('stale-badge')).toBeInTheDocument()
    expect(screen.getByText('Desactualizado')).toBeInTheDocument()
  })

  it('should not show warning badge when isStale is false', () => {
    const exchangeRate = {
      usdToArs: 1000,
      fetchedAt: new Date().toISOString(),
      isStale: false,
    }

    render(<ExchangeRateIndicator exchangeRate={exchangeRate} />)

    expect(screen.queryByTestId('stale-badge')).not.toBeInTheDocument()
  })

  it('should call onRefresh when refresh button is clicked', async () => {
    const mockOnRefresh = vi.fn()
    vi.mocked(api.exchangeRates.getCurrent).mockResolvedValue({
      baseCurrency: 'USD',
      quoteCurrency: 'ARS',
      rate: 1100,
      fetchedAt: new Date().toISOString(),
      isStale: false,
      source: 'bluelytics',
    })

    const exchangeRate = {
      usdToArs: 1000,
      fetchedAt: new Date().toISOString(),
      isStale: false,
    }

    render(
      <ExchangeRateIndicator
        exchangeRate={exchangeRate}
        onRefresh={mockOnRefresh}
      />
    )

    fireEvent.click(screen.getByTestId('refresh-button'))

    await waitFor(() => {
      expect(api.exchangeRates.getCurrent).toHaveBeenCalled()
      expect(mockOnRefresh).toHaveBeenCalled()
    })
  })

  it('should show loading state while refreshing', async () => {
    // Create a promise that we can control
    let resolvePromise: () => void
    const promise = new Promise<void>((resolve) => {
      resolvePromise = resolve
    })

    vi.mocked(api.exchangeRates.getCurrent).mockImplementation(() =>
      promise.then(() => ({
        baseCurrency: 'USD' as const,
        quoteCurrency: 'ARS' as const,
        rate: 1100,
        fetchedAt: new Date().toISOString(),
        isStale: false,
        source: 'bluelytics',
      }))
    )

    const exchangeRate = {
      usdToArs: 1000,
      fetchedAt: new Date().toISOString(),
      isStale: false,
    }

    render(<ExchangeRateIndicator exchangeRate={exchangeRate} />)

    const button = screen.getByTestId('refresh-button')
    fireEvent.click(button)

    // Button should be disabled while refreshing
    expect(button).toBeDisabled()

    // Icon should have animate-spin class (SVG classList works differently)
    const icon = screen.getByTestId('refresh-icon')
    expect(icon).toHaveClass('animate-spin')

    // Resolve the promise
    resolvePromise!()

    await waitFor(() => {
      expect(button).not.toBeDisabled()
    })
  })

  it('should handle refresh error gracefully', async () => {
    const mockOnRefresh = vi.fn()
    vi.mocked(api.exchangeRates.getCurrent).mockRejectedValue(
      new Error('Network error')
    )

    const exchangeRate = {
      usdToArs: 1000,
      fetchedAt: new Date().toISOString(),
      isStale: false,
    }

    render(
      <ExchangeRateIndicator
        exchangeRate={exchangeRate}
        onRefresh={mockOnRefresh}
      />
    )

    fireEvent.click(screen.getByTestId('refresh-button'))

    await waitFor(() => {
      // Button should be re-enabled after error
      expect(screen.getByTestId('refresh-button')).not.toBeDisabled()
    })

    // onRefresh should not be called on error
    expect(mockOnRefresh).not.toHaveBeenCalled()
  })
})
