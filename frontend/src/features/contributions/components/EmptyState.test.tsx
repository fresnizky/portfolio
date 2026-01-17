import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock react-router
vi.mock('react-router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}))

import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('should render no-assets state correctly', () => {
    render(<EmptyState type="no-assets" />)

    expect(screen.getByText('Sin activos configurados')).toBeInTheDocument()
    expect(screen.getByText(/primero necesitás agregar activos/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ir a Portfolio' })).toHaveAttribute('href', '/portfolio')
  })

  it('should render invalid-targets state correctly', () => {
    render(<EmptyState type="invalid-targets" />)

    expect(screen.getByText('Targets no suman 100%')).toBeInTheDocument()
    expect(screen.getByText(/deben sumar exactamente 100%/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ajustar Targets' })).toHaveAttribute('href', '/portfolio')
  })

  it('should have link to portfolio for no-assets', () => {
    render(<EmptyState type="no-assets" />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/portfolio')
  })

  it('should have link to portfolio for invalid-targets', () => {
    render(<EmptyState type="invalid-targets" />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/portfolio')
  })
})
