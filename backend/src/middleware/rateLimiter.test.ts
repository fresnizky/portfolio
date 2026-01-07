import { describe, it, expect } from 'vitest'
import { authRateLimiter, apiRateLimiter } from './rateLimiter'

describe('rateLimiter', () => {
  describe('authRateLimiter', () => {
    it('should be defined', () => {
      expect(authRateLimiter).toBeDefined()
    })

    it('should be a function (middleware)', () => {
      expect(typeof authRateLimiter).toBe('function')
    })
  })

  describe('apiRateLimiter', () => {
    it('should be defined', () => {
      expect(apiRateLimiter).toBeDefined()
    })

    it('should be a function (middleware)', () => {
      expect(typeof apiRateLimiter).toBe('function')
    })
  })
})
