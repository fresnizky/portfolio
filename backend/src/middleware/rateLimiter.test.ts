import { describe, it, expect } from 'vitest'
import { loginRateLimiter, apiRateLimiter } from './rateLimiter'

describe('rateLimiter', () => {
  describe('loginRateLimiter', () => {
    it('should be defined', () => {
      expect(loginRateLimiter).toBeDefined()
    })

    it('should be a function (middleware)', () => {
      expect(typeof loginRateLimiter).toBe('function')
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
