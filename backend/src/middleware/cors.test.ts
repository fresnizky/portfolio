import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import express from 'express'
import request from 'supertest'
import { corsMiddleware } from './cors'

describe('CORS Middleware', () => {
  const originalEnv = process.env.CORS_ORIGIN

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    if (originalEnv) {
      process.env.CORS_ORIGIN = originalEnv
    } else {
      delete process.env.CORS_ORIGIN
    }
  })

  const createTestApp = () => {
    const app = express()
    app.use(corsMiddleware())
    app.get('/test', (_req, res) => {
      res.json({ message: 'ok' })
    })
    app.options('/test', (_req, res) => {
      res.sendStatus(204)
    })
    return app
  }

  describe('Origin handling', () => {
    it('should allow requests from configured origin', async () => {
      process.env.CORS_ORIGIN = 'https://portfolio.resnizky.ar'
      const app = createTestApp()

      const response = await request(app)
        .get('/test')
        .set('Origin', 'https://portfolio.resnizky.ar')

      expect(response.headers['access-control-allow-origin']).toBe('https://portfolio.resnizky.ar')
    })

    it('should allow requests from localhost in development', async () => {
      process.env.CORS_ORIGIN = 'http://localhost:10001'
      const app = createTestApp()

      const response = await request(app)
        .get('/test')
        .set('Origin', 'http://localhost:10001')

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:10001')
    })

    it('should support multiple origins (comma-separated)', async () => {
      process.env.CORS_ORIGIN = 'http://localhost:10001,https://portfolio.resnizky.ar'
      const app = createTestApp()

      const response1 = await request(app)
        .get('/test')
        .set('Origin', 'http://localhost:10001')

      expect(response1.headers['access-control-allow-origin']).toBe('http://localhost:10001')

      const response2 = await request(app)
        .get('/test')
        .set('Origin', 'https://portfolio.resnizky.ar')

      expect(response2.headers['access-control-allow-origin']).toBe('https://portfolio.resnizky.ar')
    })

    it('should reject requests from non-allowed origins', async () => {
      process.env.CORS_ORIGIN = 'https://portfolio.resnizky.ar'
      const app = createTestApp()

      const response = await request(app)
        .get('/test')
        .set('Origin', 'https://malicious-site.com')

      expect(response.headers['access-control-allow-origin']).toBeUndefined()
    })
  })

  describe('Credentials', () => {
    it('should include Access-Control-Allow-Credentials header', async () => {
      process.env.CORS_ORIGIN = 'https://portfolio.resnizky.ar'
      const app = createTestApp()

      const response = await request(app)
        .get('/test')
        .set('Origin', 'https://portfolio.resnizky.ar')

      expect(response.headers['access-control-allow-credentials']).toBe('true')
    })
  })

  describe('Preflight requests (OPTIONS)', () => {
    it('should handle preflight requests correctly', async () => {
      process.env.CORS_ORIGIN = 'https://portfolio.resnizky.ar'
      const app = createTestApp()

      const response = await request(app)
        .options('/test')
        .set('Origin', 'https://portfolio.resnizky.ar')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type,Authorization')

      expect(response.status).toBe(204)
      expect(response.headers['access-control-allow-origin']).toBe('https://portfolio.resnizky.ar')
      expect(response.headers['access-control-allow-methods']).toContain('POST')
      expect(response.headers['access-control-allow-headers']).toContain('Content-Type')
      expect(response.headers['access-control-allow-headers']).toContain('Authorization')
    })

    it('should include allowed methods in preflight response', async () => {
      process.env.CORS_ORIGIN = 'https://portfolio.resnizky.ar'
      const app = createTestApp()

      const response = await request(app)
        .options('/test')
        .set('Origin', 'https://portfolio.resnizky.ar')
        .set('Access-Control-Request-Method', 'DELETE')

      expect(response.headers['access-control-allow-methods']).toContain('GET')
      expect(response.headers['access-control-allow-methods']).toContain('POST')
      expect(response.headers['access-control-allow-methods']).toContain('PUT')
      expect(response.headers['access-control-allow-methods']).toContain('DELETE')
      expect(response.headers['access-control-allow-methods']).toContain('OPTIONS')
    })
  })

  describe('Default behavior', () => {
    it('should use localhost:10001 as default when CORS_ORIGIN is not set', async () => {
      delete process.env.CORS_ORIGIN
      const app = createTestApp()

      const response = await request(app)
        .get('/test')
        .set('Origin', 'http://localhost:10001')

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:10001')
    })
  })
})
