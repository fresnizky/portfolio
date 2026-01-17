import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DiscardConfirmDialog } from './DiscardConfirmDialog'

describe('DiscardConfirmDialog', () => {
  const mockOnConfirm = vi.fn()
  const mockOnCancel = vi.fn()

  it('should display pending count', () => {
    render(
      <DiscardConfirmDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        pendingCount={3}
      />
    )

    expect(screen.getByText(/3 transacciones pendientes/i)).toBeInTheDocument()
  })

  it('should call onConfirm when Descartar is clicked', async () => {
    const user = userEvent.setup()

    render(
      <DiscardConfirmDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        pendingCount={2}
      />
    )

    await user.click(screen.getByRole('button', { name: /descartar/i }))

    expect(mockOnConfirm).toHaveBeenCalled()
  })

  it('should call onCancel when Cancelar is clicked', async () => {
    const user = userEvent.setup()

    render(
      <DiscardConfirmDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        pendingCount={2}
      />
    )

    await user.click(screen.getByRole('button', { name: /cancelar/i }))

    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('should not render when closed', () => {
    render(
      <DiscardConfirmDialog
        isOpen={false}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        pendingCount={2}
      />
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
