import { describe, it, expect } from 'vitest'
import { registerSchema, loginSchema } from './auth'

describe('auth validation schemas', () => {
  describe('registerSchema', () => {
    it('should accept valid email and password', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'securePassword123',
      })

      expect(result.success).toBe(true)
    })

    it('should reject invalid email format', () => {
      const result = registerSchema.safeParse({
        email: 'not-an-email',
        password: 'securePassword123',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('email')
      }
    })

    it('should reject password shorter than 8 characters', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'short',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('password')
        expect(result.error.issues[0].message).toContain('8')
      }
    })

    it('should reject missing email', () => {
      const result = registerSchema.safeParse({
        password: 'securePassword123',
      })

      expect(result.success).toBe(false)
    })

    it('should reject missing password', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
      })

      expect(result.success).toBe(false)
    })

    it('should accept password with exactly 8 characters', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: '12345678',
      })

      expect(result.success).toBe(true)
    })
  })

  describe('loginSchema', () => {
    it('should accept valid email and password', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'anypassword',
      })

      expect(result.success).toBe(true)
    })

    it('should reject invalid email format', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email',
        password: 'anypassword',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('email')
      }
    })

    it('should reject empty password', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: '',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('password')
      }
    })

    it('should accept short password (no min length for login)', () => {
      // Login doesn't enforce min length - just checks if password is provided
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'a',
      })

      expect(result.success).toBe(true)
    })
  })
})
