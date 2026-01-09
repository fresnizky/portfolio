import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import express, { Express, Request, Response, NextFunction } from 'express'
import request from 'supertest'
import { prisma } from '@/config/database'
import holdingsRouter from './holdings'
import assetsRouter from './assets'
import { AppError } from '@/lib/errors'

// Test data
let testUserId: string
let otherUserId: string
let testAssetId: string
let testAsset2Id: string

// Mock authenticated user middleware
const createAuthMiddleware = (userId: string) => (req: Request, _res: Response, next: NextFunction) => {
  req.user = { id: userId, email: 'test@example.com' }
  next()
}

describe('Holdings API Integration Tests', () => {
  let app: Express
  let userApp: Express
  let otherUserApp: Express

  beforeAll(async () => {
    // Create test users
    const testUser = await prisma.user.create({
      data: {
        email: `test-holdings-${Date.now()}@example.com`,
        passwordHash: 'test-hash',
      },
    })
    testUserId = testUser.id

    const otherUser = await prisma.user.create({
      data: {
        email: `other-holdings-${Date.now()}@example.com`,
        passwordHash: 'test-hash',
      },
    })
    otherUserId = otherUser.id

    // Create test assets
    const testAsset = await prisma.asset.create({
      data: {
        userId: testUserId,
        ticker: 'VOO-TEST',
        name: 'Vanguard Test ETF',
        category: 'ETF',
      },
    })
    testAssetId = testAsset.id

    const testAsset2 = await prisma.asset.create({
      data: {
        userId: testUserId,
        ticker: 'BTC-TEST',
        name: 'Bitcoin Test',
        category: 'CRYPTO',
      },
    })
    testAsset2Id = testAsset2.id
  })

  beforeEach(() => {
    // Create express app for main test user
    userApp = express()
    userApp.use(express.json())
    userApp.use(createAuthMiddleware(testUserId))
    userApp.use('/api/holdings', holdingsRouter)
    userApp.use('/api/assets', assetsRouter)
    userApp.use((err: AppError, _req: Request, res: Response, _next: NextFunction) => {
      res.status(err.statusCode || 500).json({
        error: err.code || 'INTERNAL_ERROR',
        message: err.message,
        details: err.details,
      })
    })

    // Create express app for other user
    otherUserApp = express()
    otherUserApp.use(express.json())
    otherUserApp.use(createAuthMiddleware(otherUserId))
    otherUserApp.use('/api/holdings', holdingsRouter)
    otherUserApp.use((err: AppError, _req: Request, res: Response, _next: NextFunction) => {
      res.status(err.statusCode || 500).json({
        error: err.code || 'INTERNAL_ERROR',
        message: err.message,
        details: err.details,
      })
    })

    app = userApp
  })

  afterAll(async () => {
    // Clean up all test data
    await prisma.holding.deleteMany({
      where: { userId: { in: [testUserId, otherUserId] } },
    })
    await prisma.asset.deleteMany({
      where: { userId: { in: [testUserId, otherUserId] } },
    })
    await prisma.user.deleteMany({
      where: { id: { in: [testUserId, otherUserId] } },
    })
    await prisma.$disconnect()
  })

  describe('Full Flow: Create Asset -> Create Holding -> Get Holdings', () => {
    beforeEach(async () => {
      // Clean up holdings before each test
      await prisma.holding.deleteMany({
        where: { userId: testUserId },
      })
    })

    it('should create a holding for an existing asset', async () => {
      // Create holding
      const createResponse = await request(app)
        .put(`/api/holdings/${testAssetId}`)
        .send({ quantity: 10.5 })

      expect(createResponse.status).toBe(200)
      expect(createResponse.body.message).toBe('Holding created')
      expect(createResponse.body.data).toMatchObject({
        assetId: testAssetId,
        userId: testUserId,
      })
      expect(Number(createResponse.body.data.quantity)).toBe(10.5)
      expect(createResponse.body.data.asset).toMatchObject({
        ticker: 'VOO-TEST',
        name: 'Vanguard Test ETF',
        category: 'ETF',
      })
    })

    it('should list holdings with asset details', async () => {
      // Create holdings first
      await request(app)
        .put(`/api/holdings/${testAssetId}`)
        .send({ quantity: 100 })
      await request(app)
        .put(`/api/holdings/${testAsset2Id}`)
        .send({ quantity: 0.5 })

      // Get holdings
      const response = await request(app).get('/api/holdings')

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(2)

      // Should be ordered by ticker alphabetically
      const holdings = response.body.data
      expect(holdings[0].asset.ticker).toBe('BTC-TEST')
      expect(holdings[1].asset.ticker).toBe('VOO-TEST')

      // Verify asset details are included
      expect(holdings[0].asset).toHaveProperty('id')
      expect(holdings[0].asset).toHaveProperty('ticker')
      expect(holdings[0].asset).toHaveProperty('name')
      expect(holdings[0].asset).toHaveProperty('category')
    })
  })

  describe('Validation Errors', () => {
    it('should return 400 for zero quantity', async () => {
      const response = await request(app)
        .put(`/api/holdings/${testAssetId}`)
        .send({ quantity: 0 })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for negative quantity', async () => {
      const response = await request(app)
        .put(`/api/holdings/${testAssetId}`)
        .send({ quantity: -5 })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for missing quantity', async () => {
      const response = await request(app)
        .put(`/api/holdings/${testAssetId}`)
        .send({})

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('VALIDATION_ERROR')
    })
  })

  describe('Holding Update (existing holding)', () => {
    beforeEach(async () => {
      await prisma.holding.deleteMany({
        where: { userId: testUserId },
      })
    })

    it('should update existing holding and return "Holding updated" message', async () => {
      // Create initial holding
      await request(app)
        .put(`/api/holdings/${testAssetId}`)
        .send({ quantity: 10 })

      // Update holding
      const response = await request(app)
        .put(`/api/holdings/${testAssetId}`)
        .send({ quantity: 25 })

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('Holding updated')
      expect(Number(response.body.data.quantity)).toBe(25)
    })

    it('should persist updated quantity', async () => {
      // Create and update
      await request(app)
        .put(`/api/holdings/${testAssetId}`)
        .send({ quantity: 10 })
      await request(app)
        .put(`/api/holdings/${testAssetId}`)
        .send({ quantity: 50 })

      // Verify via GET
      const response = await request(app).get('/api/holdings')
      const holding = response.body.data.find((h: { assetId: string }) => h.assetId === testAssetId)

      expect(Number(holding.quantity)).toBe(50)
    })
  })

  describe('Asset Not Found Error', () => {
    it('should return 404 for non-existent asset', async () => {
      const fakeAssetId = 'clx1234567890abcdefghijkl' // Valid CUID format but doesn't exist

      const response = await request(app)
        .put(`/api/holdings/${fakeAssetId}`)
        .send({ quantity: 10 })

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('NOT_FOUND')
      expect(response.body.message).toBe('Asset not found')
    })
  })

  describe('Unauthorized Access (wrong user)', () => {
    it('should return 403 when trying to create holding for another user\'s asset', async () => {
      // Try to create holding on testUser's asset using otherUser's app
      const response = await request(otherUserApp)
        .put(`/api/holdings/${testAssetId}`)
        .send({ quantity: 10 })

      expect(response.status).toBe(403)
      expect(response.body.error).toBe('FORBIDDEN')
      expect(response.body.message).toBe('Access denied')
    })
  })

  describe('Holdings Include Asset Details', () => {
    beforeEach(async () => {
      await prisma.holding.deleteMany({
        where: { userId: testUserId },
      })
    })

    it('should include complete asset details in holding response', async () => {
      // Create holding
      const createResponse = await request(app)
        .put(`/api/holdings/${testAssetId}`)
        .send({ quantity: 10 })

      expect(createResponse.body.data.asset).toEqual({
        id: testAssetId,
        ticker: 'VOO-TEST',
        name: 'Vanguard Test ETF',
        category: 'ETF',
      })
    })

    it('should include asset details in list response', async () => {
      // Create holding
      await request(app)
        .put(`/api/holdings/${testAssetId}`)
        .send({ quantity: 10 })

      // Get holdings
      const response = await request(app).get('/api/holdings')
      const holding = response.body.data[0]

      expect(holding.asset).toEqual({
        id: testAssetId,
        ticker: 'VOO-TEST',
        name: 'Vanguard Test ETF',
        category: 'ETF',
      })
    })
  })

  describe('Decimal Precision', () => {
    beforeEach(async () => {
      await prisma.holding.deleteMany({
        where: { userId: testUserId },
      })
    })

    it('should handle fractional shares/crypto with high precision', async () => {
      const cryptoQuantity = 0.00012345

      const response = await request(app)
        .put(`/api/holdings/${testAsset2Id}`)
        .send({ quantity: cryptoQuantity })

      expect(response.status).toBe(200)
      expect(Number(response.body.data.quantity)).toBe(cryptoQuantity)
    })

    it('should handle large integer quantities', async () => {
      const largeQuantity = 1000000

      const response = await request(app)
        .put(`/api/holdings/${testAssetId}`)
        .send({ quantity: largeQuantity })

      expect(response.status).toBe(200)
      expect(Number(response.body.data.quantity)).toBe(largeQuantity)
    })
  })

  describe('Empty Holdings', () => {
    it('should return empty array when user has no holdings', async () => {
      // Use other user who has no holdings
      const response = await request(otherUserApp).get('/api/holdings')

      expect(response.status).toBe(200)
      expect(response.body.data).toEqual([])
    })
  })
})
