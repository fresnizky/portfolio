import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from './password'

describe('password utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'securePassword123'
      const hash = await hashPassword(password)

      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(50) // bcrypt hashes are ~60 chars
    })

    it('should generate different hashes for the same password', async () => {
      const password = 'securePassword123'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      expect(hash1).not.toBe(hash2) // Different salts = different hashes
    })
  })

  describe('verifyPassword', () => {
    it('should return true for matching password and hash', async () => {
      const password = 'securePassword123'
      const hash = await hashPassword(password)

      const isValid = await verifyPassword(password, hash)

      expect(isValid).toBe(true)
    })

    it('should return false for non-matching password', async () => {
      const password = 'securePassword123'
      const wrongPassword = 'wrongPassword456'
      const hash = await hashPassword(password)

      const isValid = await verifyPassword(wrongPassword, hash)

      expect(isValid).toBe(false)
    })

    it('should handle empty password', async () => {
      const password = 'securePassword123'
      const hash = await hashPassword(password)

      const isValid = await verifyPassword('', hash)

      expect(isValid).toBe(false)
    })
  })
})
