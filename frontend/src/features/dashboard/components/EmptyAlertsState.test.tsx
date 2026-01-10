import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyAlertsState } from './EmptyAlertsState'

describe('EmptyAlertsState', () => {
  it('should display positive message', () => {
    render(<EmptyAlertsState />)

    expect(screen.getByText('Portfolio is on track!')).toBeInTheDocument()
  })

  it('should show checkmark icon', () => {
    render(<EmptyAlertsState />)

    expect(screen.getByTestId('checkmark-icon')).toBeInTheDocument()
  })

  it('should have green color scheme', () => {
    render(<EmptyAlertsState />)

    const container = screen.getByTestId('empty-alerts-state')
    expect(container.className).toContain('bg-green-50')
    expect(container.className).toContain('border-green-200')
  })

  it('should display encouraging subtext', () => {
    render(<EmptyAlertsState />)

    expect(screen.getByText('No alerts or actions needed at this time.')).toBeInTheDocument()
  })
})
