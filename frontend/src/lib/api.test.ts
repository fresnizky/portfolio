import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { api, ApiError } from './api'

describe('api', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.resetAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  describe('ApiError', () => {
    it('should create an ApiError with error code, message, and details', () => {
      const error = new ApiError('VALIDATION_ERROR', 'Invalid input', { field: 'email' })

      expect(error.name).toBe('ApiError')
      expect(error.error).toBe('VALIDATION_ERROR')
      expect(error.message).toBe('Invalid input')
      expect(error.details).toEqual({ field: 'email' })
    })
  })

  describe('auth.login', () => {
    it('should successfully login and return user data with token', async () => {
      const mockResponse = {
        data: {
          user: { id: '1', email: 'test@example.com' },
          token: 'jwt-token-123',
        },
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await api.auth.login('test@example.com', 'password123')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
        })
      )
      expect(result).toEqual(mockResponse.data)
    })

    it('should throw ApiError on invalid credentials', async () => {
      const mockError = {
        error: 'UNAUTHORIZED',
        message: 'Invalid email or password',
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve(mockError),
      })

      await expect(api.auth.login('test@example.com', 'wrong-password')).rejects.toThrow(ApiError)
      await expect(api.auth.login('test@example.com', 'wrong-password')).rejects.toMatchObject({
        error: 'UNAUTHORIZED',
        message: 'Invalid email or password',
      })
    })
  })

  describe('auth.me', () => {
    it('should fetch current user when authenticated', async () => {
      const mockResponse = {
        data: { id: '1', email: 'test@example.com' },
      }

      // Simulate stored token
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({ state: { token: 'jwt-token-123' } })
      )

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await api.auth.me()

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/me'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer jwt-token-123',
          }),
        })
      )
      expect(result).toEqual(mockResponse.data)
    })

    it('should throw ApiError when not authenticated', async () => {
      const mockError = {
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve(mockError),
      })

      await expect(api.auth.me()).rejects.toThrow(ApiError)
    })

    it('should clear corrupted localStorage and continue without auth header', async () => {
      const mockResponse = {
        data: { id: '1', email: 'test@example.com' },
      }

      // Set corrupted/invalid JSON in localStorage
      localStorage.setItem('auth-storage', 'not-valid-json{')

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      await api.auth.me()

      // Verify localStorage was cleaned up
      expect(localStorage.getItem('auth-storage')).toBeNull()

      // Verify request was made without Authorization header
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/me'),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.any(String),
          }),
        })
      )
    })
  })
})
