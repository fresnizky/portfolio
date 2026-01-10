import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AccountSection } from './AccountSection'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

// Mock the api
vi.mock('@/lib/api', () => ({
  api: {
    auth: {
      changePassword: vi.fn(),
    },
  },
}))

// Mock the auth store
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}))

describe('AccountSection', () => {
  const mockLogout = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuthStore).mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com' },
      logout: mockLogout,
      isAuthenticated: true,
      token: 'mock-token',
      login: vi.fn(),
    } as ReturnType<typeof useAuthStore>)
  })

  it('should display user email', () => {
    render(<AccountSection />)

    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument()
  })

  it('should show change password button', () => {
    render(<AccountSection />)

    expect(screen.getByText(/cambiar contrasena/i)).toBeInTheDocument()
  })

  it('should show password form when clicking change password', async () => {
    const user = userEvent.setup()
    render(<AccountSection />)

    const changeButton = screen.getByText(/cambiar contrasena/i)
    await user.click(changeButton)

    expect(screen.getByLabelText('Contrasena actual')).toBeInTheDocument()
    expect(screen.getByLabelText('Nueva contrasena')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirmar nueva contrasena')).toBeInTheDocument()
  })

  it('should call logout when clicking logout button', async () => {
    const user = userEvent.setup()
    render(<AccountSection />)

    const logoutButton = screen.getByText(/cerrar sesion/i)
    await user.click(logoutButton)

    expect(mockLogout).toHaveBeenCalled()
  })

  it('should submit password change', async () => {
    const user = userEvent.setup()
    vi.mocked(api.auth.changePassword).mockResolvedValue({ success: true })

    render(<AccountSection />)

    const changeButton = screen.getByText(/cambiar contrasena/i)
    await user.click(changeButton)

    await user.type(screen.getByLabelText('Contrasena actual'), 'oldpassword')
    await user.type(screen.getByLabelText('Nueva contrasena'), 'newpassword123')
    await user.type(screen.getByLabelText('Confirmar nueva contrasena'), 'newpassword123')

    const submitButton = screen.getByRole('button', { name: /guardar/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(api.auth.changePassword).toHaveBeenCalledWith({
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
      })
    })
  })

  it('should show validation error when passwords do not match', async () => {
    const user = userEvent.setup()
    render(<AccountSection />)

    const changeButton = screen.getByText(/cambiar contrasena/i)
    await user.click(changeButton)

    await user.type(screen.getByLabelText('Contrasena actual'), 'oldpassword')
    await user.type(screen.getByLabelText('Nueva contrasena'), 'newpassword123')
    await user.type(screen.getByLabelText('Confirmar nueva contrasena'), 'different')

    const submitButton = screen.getByRole('button', { name: /guardar/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/no coinciden/i)).toBeInTheDocument()
    })
  })

  it('should hide form when clicking cancel', async () => {
    const user = userEvent.setup()
    render(<AccountSection />)

    const changeButton = screen.getByText(/cambiar contrasena/i)
    await user.click(changeButton)

    expect(screen.getByLabelText('Contrasena actual')).toBeInTheDocument()

    const cancelButton = screen.getByText(/cancelar/i)
    await user.click(cancelButton)

    expect(screen.queryByLabelText('Contrasena actual')).not.toBeInTheDocument()
  })

  it('should show success message after password change', async () => {
    const user = userEvent.setup()
    vi.mocked(api.auth.changePassword).mockResolvedValue({ success: true })

    render(<AccountSection />)

    const changeButton = screen.getByText(/cambiar contrasena/i)
    await user.click(changeButton)

    await user.type(screen.getByLabelText('Contrasena actual'), 'oldpassword')
    await user.type(screen.getByLabelText('Nueva contrasena'), 'newpassword123')
    await user.type(screen.getByLabelText('Confirmar nueva contrasena'), 'newpassword123')

    const submitButton = screen.getByRole('button', { name: /guardar/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/actualizada correctamente/i)).toBeInTheDocument()
    })
  })
})
