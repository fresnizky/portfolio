import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from './App'
import { useAuthStore } from '@/stores/authStore'

// Mock the API
vi.mock('@/lib/api', () => ({
  api: {
    auth: {
      me: vi.fn().mockRejectedValue(new Error('No token')),
    },
  },
  ApiError: class ApiError extends Error {
    constructor(public error: string, message: string) {
      super(message)
      this.name = 'ApiError'
    }
  },
}))

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })
  })

  it('should render login page when not authenticated', async () => {
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
    })
  })
})
