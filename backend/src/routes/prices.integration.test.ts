import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import express, { Express, Request, Response, NextFunction } from 'express'
import request from 'supertest'
import type { PrismaClient } from '@prisma/client'
import { AppError } from '@/lib/errors'

// CI-friendly: Skip integration tests if DATABASE_URL is not available
const DATABASE_URL = process.env.DATABASE_URL
const describeWithDb = DATABASE_URL ? describe : describe.skip

// Lazy imports to prevent Prisma initialization when DATABASE_URL is not set
let prisma: PrismaClient
let pricesRouter: typeof import('./prices').default
let portfolioRouter: typeof import('./portfolio').default
let holdingsRouter: typeof import('./holdings').default

// Test data
let testUserId: string
let otherUserId: string
let testAssetId: string
let testAsset2Id: string
let testAsset3Id: string

// Mock authenticated user middleware
const createAuthMiddleware = (userId: string) => (req: Request, _res: Response, next: NextFunction) => {
  req.user = { id: userId, email: 'test@example.com' }
  next()
}

describeWithDb('Price Update & Portfolio Valuation Integration Tests', () => {
  let app: Express
  let otherUserApp: Express

  beforeAll(async () => {
    // Lazy load modules that depend on DATABASE_URL
    const dbModule = await import('@/config/database')
    prisma = dbModule.prisma
    pricesRouter = (await import('./prices')).default
    portfolioRouter = (await import('./portfolio')).default
    holdingsRouter = (await import('./holdings')).default

    // Create test users
    const testUser = await prisma.user.create({
      data: {
        email: `test-prices-${Date.now()}@example.com`,
        passwordHash: 'test-hash',
      },
    })
    testUserId = testUser.id

    const otherUser = await prisma.user.create({
      data: {
        email: `other-prices-${Date.now()}@example.com`,
        passwordHash: 'test-hash',
      },
    })
    otherUserId = otherUser.id

    // Create test assets
    const testAsset = await prisma.asset.create({
      data: {
        userId: testUserId,
        ticker: 'VOO-INT',
        name: 'Vanguard S&P 500 ETF',
        category: 'ETF',
      },
    })
    testAssetId = testAsset.id

    const testAsset2 = await prisma.asset.create({
      data: {
        userId: testUserId,
        ticker: 'GLD-INT',
        name: 'SPDR Gold Trust',
        category: 'ETF',
      },
    })
    testAsset2Id = testAsset2.id

    const testAsset3 = await prisma.asset.create({
      data: {
        userId: testUserId,
        ticker: 'BTC-INT',
        name: 'Bitcoin',
        category: 'CRYPTO',
      },
    })
    testAsset3Id = testAsset3.id
  })

  beforeEach(async () => {
    // Clean up holdings and reset prices before each test
    await prisma.holding.deleteMany({
      where: { userId: { in: [testUserId, otherUserId] } },
    })
    await prisma.asset.updateMany({
      where: { userId: testUserId },
      data: { currentPrice: null, priceUpdatedAt: null },
    })

    // Create express app for main test user
    app = express()
    app.use(express.json())
    app.use(createAuthMiddleware(testUserId))
    app.use('/api/prices', pricesRouter)
    app.use('/api/portfolio', portfolioRouter)
    app.use('/api/holdings', holdingsRouter)
    app.use((err: AppError, _req: Request, res: Response, _next: NextFunction) => {
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
    otherUserApp.use('/api/prices', pricesRouter)
    otherUserApp.use('/api/portfolio', portfolioRouter)
    otherUserApp.use((err: AppError, _req: Request, res: Response, _next: NextFunction) => {
      res.status(err.statusCode || 500).json({
        error: err.code || 'INTERNAL_ERROR',
        message: err.message,
        details: err.details,
      })
    })
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

  describe('Single Price Update', () => {
    it('should update asset price and set priceUpdatedAt', async () => {
      const response = await request(app)
        .put(`/api/prices/${testAssetId}`)
        .send({ price: 450.75 })

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('Price updated')
      expect(response.body.data.currentPrice).toBe('450.75')
      expect(response.body.data.priceUpdatedAt).toBeDefined()
    })

    it('should round price to 2 decimal places', async () => {
      const response = await request(app)
        .put(`/api/prices/${testAssetId}`)
        .send({ price: 100.999 })

      expect(response.status).toBe(200)
      expect(response.body.data.currentPrice).toBe('101.00')
    })

    it('should handle high prices (crypto)', async () => {
      const response = await request(app)
        .put(`/api/prices/${testAsset3Id}`)
        .send({ price: 42000.00 })

      expect(response.status).toBe(200)
      expect(response.body.data.currentPrice).toBe('42000.00')
    })

    it('should return 404 for non-existent asset', async () => {
      const response = await request(app)
        .put('/api/prices/clx1234567890abcdefghijkl')
        .send({ price: 100 })

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('NOT_FOUND')
    })

    it('should return 404 for other user\'s asset', async () => {
      const response = await request(otherUserApp)
        .put(`/api/prices/${testAssetId}`)
        .send({ price: 100 })

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('NOT_FOUND')
    })

    it('should return 400 for invalid price', async () => {
      const response = await request(app)
        .put(`/api/prices/${testAssetId}`)
        .send({ price: -10 })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('VALIDATION_ERROR')
    })
  })

  describe('Batch Price Update', () => {
    it('should update multiple prices atomically', async () => {
      const response = await request(app)
        .put('/api/prices/batch')
        .send({
          prices: [
            { assetId: testAssetId, price: 450.75 },
            { assetId: testAsset2Id, price: 85.30 },
          ],
        })

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('2 prices updated')
      expect(response.body.data.updated).toBe(2)
      expect(response.body.data.assets).toHaveLength(2)
    })

    it('should fail atomically if any asset not found', async () => {
      const response = await request(app)
        .put('/api/prices/batch')
        .send({
          prices: [
            { assetId: testAssetId, price: 100 },
            { assetId: 'clx1234567890abcdefghijkl', price: 200 },
          ],
        })

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('NOT_FOUND')
      expect(response.body.details.notFound).toContain('clx1234567890abcdefghijkl')

      // Verify no prices were updated
      const asset = await prisma.asset.findUnique({ where: { id: testAssetId } })
      expect(asset?.currentPrice).toBeNull()
    })

    it('should return 400 for empty prices array', async () => {
      const response = await request(app)
        .put('/api/prices/batch')
        .send({ prices: [] })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('VALIDATION_ERROR')
    })
  })

  describe('Portfolio Valuation', () => {
    it('should return empty portfolio when no holdings exist', async () => {
      const response = await request(app).get('/api/portfolio/summary')

      expect(response.status).toBe(200)
      expect(response.body.data.totalValue).toBe('0.00')
      expect(response.body.data.positions).toEqual([])
    })

    it('should calculate position value correctly (quantity × price)', async () => {
      // Create holding: 10 shares
      await request(app)
        .put(`/api/holdings/${testAssetId}`)
        .send({ quantity: 10 })

      // Update price: $450.75
      await request(app)
        .put(`/api/prices/${testAssetId}`)
        .send({ price: 450.75 })

      // Get portfolio summary
      const response = await request(app).get('/api/portfolio/summary')

      expect(response.status).toBe(200)
      // 10 × 450.75 = 4507.50
      expect(response.body.data.totalValue).toBe('4507.50')
      expect(response.body.data.positions[0].value).toBe('4507.50')
      expect(response.body.data.positions[0].currentPrice).toBe('450.75')
      expect(response.body.data.positions[0].quantity).toBe('10')
    })

    it('should handle positions without prices (value = 0)', async () => {
      // Create holding without setting price
      await request(app)
        .put(`/api/holdings/${testAssetId}`)
        .send({ quantity: 100 })

      const response = await request(app).get('/api/portfolio/summary')

      expect(response.status).toBe(200)
      expect(response.body.data.totalValue).toBe('0.00')
      expect(response.body.data.positions[0].value).toBe('0.00')
      expect(response.body.data.positions[0].currentPrice).toBeNull()
    })

    it('should calculate total portfolio value correctly', async () => {
      // Create holdings
      await request(app)
        .put(`/api/holdings/${testAssetId}`)
        .send({ quantity: 10 })
      await request(app)
        .put(`/api/holdings/${testAsset2Id}`)
        .send({ quantity: 50 })
      await request(app)
        .put(`/api/holdings/${testAsset3Id}`)
        .send({ quantity: 0.03 })

      // Update prices
      await request(app)
        .put('/api/prices/batch')
        .send({
          prices: [
            { assetId: testAssetId, price: 450.75 },   // 10 × 450.75 = 4507.50
            { assetId: testAsset2Id, price: 85.30 },   // 50 × 85.30 = 4265.00
            { assetId: testAsset3Id, price: 42000.00 }, // 0.03 × 42000 = 1260.00
          ],
        })

      const response = await request(app).get('/api/portfolio/summary')

      expect(response.status).toBe(200)
      // Total: 4507.50 + 4265.00 + 1260.00 = 10032.50
      expect(response.body.data.totalValue).toBe('10032.50')
      expect(response.body.data.positions).toHaveLength(3)
    })

    it('should include priceUpdatedAt timestamp', async () => {
      await request(app)
        .put(`/api/holdings/${testAssetId}`)
        .send({ quantity: 10 })
      await request(app)
        .put(`/api/prices/${testAssetId}`)
        .send({ price: 100 })

      const response = await request(app).get('/api/portfolio/summary')

      expect(response.body.data.positions[0].priceUpdatedAt).toBeDefined()
    })

    it('should order positions by ticker alphabetically', async () => {
      // Create holdings in random order
      await request(app).put(`/api/holdings/${testAsset3Id}`).send({ quantity: 1 }) // BTC-INT
      await request(app).put(`/api/holdings/${testAssetId}`).send({ quantity: 1 })  // VOO-INT
      await request(app).put(`/api/holdings/${testAsset2Id}`).send({ quantity: 1 }) // GLD-INT

      const response = await request(app).get('/api/portfolio/summary')

      expect(response.body.data.positions[0].ticker).toBe('BTC-INT')
      expect(response.body.data.positions[1].ticker).toBe('GLD-INT')
      expect(response.body.data.positions[2].ticker).toBe('VOO-INT')
    })
  })

  describe('Full Flow: Create Asset → Add Holding → Update Price → Get Summary', () => {
    it('should complete full investment tracking flow', async () => {
      // Step 1: Create holding
      const holdingResponse = await request(app)
        .put(`/api/holdings/${testAssetId}`)
        .send({ quantity: 25.5 })

      expect(holdingResponse.status).toBe(200)

      // Step 2: Portfolio should show 0 value (no price yet)
      const beforePriceResponse = await request(app).get('/api/portfolio/summary')
      expect(beforePriceResponse.body.data.totalValue).toBe('0.00')

      // Step 3: Update price
      const priceResponse = await request(app)
        .put(`/api/prices/${testAssetId}`)
        .send({ price: 100.00 })

      expect(priceResponse.status).toBe(200)

      // Step 4: Portfolio should now show correct value
      const afterPriceResponse = await request(app).get('/api/portfolio/summary')
      // 25.5 × 100 = 2550.00
      expect(afterPriceResponse.body.data.totalValue).toBe('2550.00')
      expect(afterPriceResponse.body.data.positions[0]).toMatchObject({
        ticker: 'VOO-INT',
        quantity: '25.5',
        currentPrice: '100.00',
        value: '2550.00',
      })
    })
  })
})
