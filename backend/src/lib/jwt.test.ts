import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateToken, verifyToken } from './jwt'

describe('jwt utilities', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
    process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes-only'
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const payload = { id: 'user-123', email: 'test@example.com' }
      const token = generateToken(payload)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    it('should include payload data in the token', () => {
      const payload = { id: 'user-123', email: 'test@example.com' }
      const token = generateToken(payload)
      const decoded = verifyToken(token)

      expect(decoded).toMatchObject(payload)
    })
  })

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const payload = { id: 'user-456', email: 'another@example.com' }
      const token = generateToken(payload)

      const decoded = verifyToken(token)

      expect(decoded.id).toBe(payload.id)
      expect(decoded.email).toBe(payload.email)
      expect(decoded.iat).toBeDefined() // issued at
      expect(decoded.exp).toBeDefined() // expiration
    })

    it('should throw error for invalid token', () => {
      expect(() => verifyToken('invalid-token')).toThrow()
    })

    it('should throw error for tampered token', () => {
      const token = generateToken({ id: 'user-123', email: 'test@example.com' })
      const tamperedToken = token.slice(0, -5) + 'xxxxx'

      expect(() => verifyToken(tamperedToken)).toThrow()
    })

    it('should throw error for expired token', () => {
      // Create a token that expires immediately
      const payload = { id: 'user-123', email: 'test@example.com' }
      const token = generateToken(payload, '0s')

      // Wait a moment for expiration
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(() => verifyToken(token)).toThrow()
          resolve()
        }, 100)
      })
    })
  })

  describe('environment configuration', () => {
    it('should throw error if JWT_SECRET is not set', () => {
      delete process.env.JWT_SECRET

      // The function checks env at runtime, so we can test directly
      expect(() => generateToken({ id: '1', email: 'test@test.com' })).toThrow('JWT_SECRET')
    })
  })
})
