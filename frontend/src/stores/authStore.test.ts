import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useAuthStore } from './authStore'
import { act } from '@testing-library/react'

describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear()
    // Reset store to initial state
    act(() => {
      useAuthStore.setState({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: true,
      })
    })
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('initial state', () => {
    it('should have null token and user when not authenticated', () => {
      const state = useAuthStore.getState()

      expect(state.token).toBeNull()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isLoading).toBe(true)
    })
  })

  describe('login', () => {
    it('should set token, user, and isAuthenticated to true', () => {
      const mockUser = { id: '1', email: 'test@example.com' }
      const mockToken = 'jwt-token-123'

      act(() => {
        useAuthStore.getState().login(mockToken, mockUser)
      })

      const state = useAuthStore.getState()
      expect(state.token).toBe(mockToken)
      expect(state.user).toEqual(mockUser)
      expect(state.isAuthenticated).toBe(true)
      expect(state.isLoading).toBe(false)
    })

    it('should persist auth state to localStorage', () => {
      const mockUser = { id: '1', email: 'test@example.com' }
      const mockToken = 'jwt-token-123'

      act(() => {
        useAuthStore.getState().login(mockToken, mockUser)
      })

      const stored = localStorage.getItem('auth-storage')
      expect(stored).toBeTruthy()

      const parsed = JSON.parse(stored!)
      expect(parsed.state.token).toBe(mockToken)
      expect(parsed.state.user).toEqual(mockUser)
      expect(parsed.state.isAuthenticated).toBe(true)
    })
  })

  describe('logout', () => {
    it('should clear token, user, and set isAuthenticated to false', () => {
      const mockUser = { id: '1', email: 'test@example.com' }
      const mockToken = 'jwt-token-123'

      // First login
      act(() => {
        useAuthStore.getState().login(mockToken, mockUser)
      })

      // Then logout
      act(() => {
        useAuthStore.getState().logout()
      })

      const state = useAuthStore.getState()
      expect(state.token).toBeNull()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isLoading).toBe(false)
    })
  })

  describe('setLoading', () => {
    it('should update isLoading state', () => {
      act(() => {
        useAuthStore.getState().setLoading(false)
      })

      expect(useAuthStore.getState().isLoading).toBe(false)

      act(() => {
        useAuthStore.getState().setLoading(true)
      })

      expect(useAuthStore.getState().isLoading).toBe(true)
    })
  })

  describe('checkAuth', () => {
    it('should return true when token exists', () => {
      act(() => {
        useAuthStore.setState({
          token: 'jwt-token-123',
          user: { id: '1', email: 'test@example.com' },
          isAuthenticated: true,
          isLoading: true,
        })
      })

      let result: boolean = false
      act(() => {
        result = useAuthStore.getState().checkAuth()
      })

      expect(result).toBe(true)
      expect(useAuthStore.getState().isLoading).toBe(false)
    })

    it('should return false and reset auth state when no token', () => {
      act(() => {
        useAuthStore.setState({
          token: null,
          user: { id: '1', email: 'test@example.com' },
          isAuthenticated: true,
          isLoading: true,
        })
      })

      let result: boolean = true
      act(() => {
        result = useAuthStore.getState().checkAuth()
      })

      expect(result).toBe(false)
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
      expect(useAuthStore.getState().user).toBeNull()
      expect(useAuthStore.getState().isLoading).toBe(false)
    })
  })
})
