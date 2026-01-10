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
let transactionsRouter: typeof import('./transactions').default
let holdingsRouter: typeof import('./holdings').default

// Test data
let testUserId: string
let otherUserId: string
let testAssetId: string
let testAsset2Id: string

// Mock authenticated user middleware
const createAuthMiddleware =
  (userId: string) => (req: Request, _res: Response, next: NextFunction) => {
    req.user = { id: userId, email: 'test@example.com' }
    next()
  }

describeWithDb('Transaction Recording Integration Tests', () => {
  let app: Express
  let otherUserApp: Express

  beforeAll(async () => {
    // Lazy load modules that depend on DATABASE_URL
    const dbModule = await import('@/config/database')
    prisma = dbModule.prisma
    transactionsRouter = (await import('./transactions')).default
    holdingsRouter = (await import('./holdings')).default

    // Create test users
    const testUser = await prisma.user.create({
      data: {
        email: `test-tx-${Date.now()}@example.com`,
        passwordHash: 'test-hash',
      },
    })
    testUserId = testUser.id

    const otherUser = await prisma.user.create({
      data: {
        email: `other-tx-${Date.now()}@example.com`,
        passwordHash: 'test-hash',
      },
    })
    otherUserId = otherUser.id

    // Create test assets
    const testAsset = await prisma.asset.create({
      data: {
        userId: testUserId,
        ticker: 'VOO-TX',
        name: 'Vanguard S&P 500 ETF',
        category: 'ETF',
      },
    })
    testAssetId = testAsset.id

    const testAsset2 = await prisma.asset.create({
      data: {
        userId: testUserId,
        ticker: 'BTC-TX',
        name: 'Bitcoin',
        category: 'CRYPTO',
      },
    })
    testAsset2Id = testAsset2.id
  })

  beforeEach(async () => {
    // Clean up transactions and holdings before each test
    await prisma.transaction.deleteMany({
      where: { userId: { in: [testUserId, otherUserId] } },
    })
    await prisma.holding.deleteMany({
      where: { userId: { in: [testUserId, otherUserId] } },
    })

    // Create express app for main test user
    app = express()
    app.use(express.json())
    app.use(createAuthMiddleware(testUserId))
    app.use('/api/transactions', transactionsRouter)
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
    otherUserApp.use('/api/transactions', transactionsRouter)
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
    await prisma.transaction.deleteMany({
      where: { userId: { in: [testUserId, otherUserId] } },
    })
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

  describe('Buy Transaction Creation', () => {
    it('should create a buy transaction with correct totalCost', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .send({
          type: 'buy',
          assetId: testAssetId,
          date: '2026-01-10T10:00:00.000Z',
          quantity: 10,
          price: 450.75,
          commission: 5,
        })

      expect(response.status).toBe(201)
      expect(response.body.message).toBe('Transaction recorded')
      expect(response.body.data.type).toBe('BUY')
      expect(response.body.data.quantity).toBe('10')
      expect(response.body.data.price).toBe('450.75')
      expect(response.body.data.commission).toBe('5.00')
      // totalCost = (10 × 450.75) + 5 = 4512.50
      expect(response.body.data.totalCost).toBe('4512.50')
      expect(response.body.data.asset.ticker).toBe('VOO-TX')
    })

    it('should default commission to 0', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .send({
          type: 'buy',
          assetId: testAssetId,
          date: '2026-01-10T10:00:00.000Z',
          quantity: 10,
          price: 100,
        })

      expect(response.status).toBe(201)
      expect(response.body.data.commission).toBe('0.00')
      // totalCost = 10 × 100 = 1000
      expect(response.body.data.totalCost).toBe('1000.00')
    })

    it('should handle fractional quantities (crypto)', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .send({
          type: 'buy',
          assetId: testAsset2Id,
          date: '2026-01-10T10:00:00.000Z',
          quantity: 0.00012345,
          price: 42000,
          commission: 0,
        })

      expect(response.status).toBe(201)
      expect(response.body.data.quantity).toBe('0.00012345')
      // 0.00012345 × 42000 = 5.1849 → stored in cents
      expect(response.body.data.totalCost).toBe('5.18')
    })

    it('should return 404 for non-existent asset', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .send({
          type: 'buy',
          assetId: 'clx1234567890abcdefghijkl',
          date: '2026-01-10T10:00:00.000Z',
          quantity: 10,
          price: 100,
        })

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('NOT_FOUND')
    })

    it('should return 404 for other user\'s asset', async () => {
      const response = await request(otherUserApp)
        .post('/api/transactions')
        .send({
          type: 'buy',
          assetId: testAssetId,
          date: '2026-01-10T10:00:00.000Z',
          quantity: 10,
          price: 100,
        })

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('NOT_FOUND')
    })
  })

  describe('Sell Transaction Creation', () => {
    beforeEach(async () => {
      // Create a holding with 100 units
      await prisma.holding.create({
        data: {
          userId: testUserId,
          assetId: testAssetId,
          quantity: 100,
        },
      })
    })

    it('should create a sell transaction with correct totalProceeds', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .send({
          type: 'sell',
          assetId: testAssetId,
          date: '2026-01-10T10:00:00.000Z',
          quantity: 10,
          price: 450.75,
          commission: 5,
        })

      expect(response.status).toBe(201)
      expect(response.body.data.type).toBe('SELL')
      // totalProceeds = (10 × 450.75) - 5 = 4502.50
      expect(response.body.data.totalProceeds).toBe('4502.50')
      expect(response.body.data.totalCost).toBeUndefined()
    })

    it('should allow selling exact holdings amount', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .send({
          type: 'sell',
          assetId: testAssetId,
          date: '2026-01-10T10:00:00.000Z',
          quantity: 100,
          price: 100,
        })

      expect(response.status).toBe(201)
      expect(response.body.data.quantity).toBe('100')
    })

    it('should return 400 when selling more than holdings', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .send({
          type: 'sell',
          assetId: testAssetId,
          date: '2026-01-10T10:00:00.000Z',
          quantity: 150,
          price: 100,
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('VALIDATION_ERROR')
      expect(response.body.message).toBe('Insufficient holdings')
      expect(response.body.details).toEqual({
        available: '100',
        requested: '150',
      })
    })

    it('should return 400 when no holdings exist', async () => {
      // Delete holdings
      await prisma.holding.deleteMany({
        where: { userId: testUserId },
      })

      const response = await request(app)
        .post('/api/transactions')
        .send({
          type: 'sell',
          assetId: testAssetId,
          date: '2026-01-10T10:00:00.000Z',
          quantity: 10,
          price: 100,
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('VALIDATION_ERROR')
      expect(response.body.details.available).toBe('0')
    })
  })

  describe('Transaction Listing', () => {
    beforeEach(async () => {
      // Create multiple transactions
      await prisma.transaction.createMany({
        data: [
          {
            userId: testUserId,
            assetId: testAssetId,
            type: 'BUY',
            date: new Date('2026-01-01T10:00:00.000Z'),
            quantity: 10,
            priceCents: BigInt(10000),
            commissionCents: BigInt(0),
            totalCents: BigInt(100000),
          },
          {
            userId: testUserId,
            assetId: testAssetId,
            type: 'BUY',
            date: new Date('2026-01-05T10:00:00.000Z'),
            quantity: 5,
            priceCents: BigInt(10500),
            commissionCents: BigInt(100),
            totalCents: BigInt(52600),
          },
          {
            userId: testUserId,
            assetId: testAsset2Id,
            type: 'BUY',
            date: new Date('2026-01-03T10:00:00.000Z'),
            quantity: 0.001,
            priceCents: BigInt(4200000),
            commissionCents: BigInt(0),
            totalCents: BigInt(4200),
          },
        ],
      })
    })

    it('should list all transactions', async () => {
      const response = await request(app).get('/api/transactions')

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(3)
      expect(response.body.meta.total).toBe(3)
    })

    it('should order by date descending', async () => {
      const response = await request(app).get('/api/transactions')

      expect(response.body.data[0].date).toBe('2026-01-05T10:00:00.000Z')
      expect(response.body.data[1].date).toBe('2026-01-03T10:00:00.000Z')
      expect(response.body.data[2].date).toBe('2026-01-01T10:00:00.000Z')
    })

    it('should filter by assetId', async () => {
      const response = await request(app).get(
        `/api/transactions?assetId=${testAsset2Id}`
      )

      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].asset.ticker).toBe('BTC-TX')
    })

    it('should filter by date range', async () => {
      const response = await request(app).get(
        '/api/transactions?fromDate=2026-01-02T00:00:00.000Z&toDate=2026-01-04T23:59:59.999Z'
      )

      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].date).toBe('2026-01-03T10:00:00.000Z')
    })

    it('should not show other user\'s transactions', async () => {
      const response = await request(otherUserApp).get('/api/transactions')

      expect(response.body.data).toHaveLength(0)
      expect(response.body.meta.total).toBe(0)
    })
  })

  describe('Get Single Transaction', () => {
    let testTransactionId: string

    beforeEach(async () => {
      const tx = await prisma.transaction.create({
        data: {
          userId: testUserId,
          assetId: testAssetId,
          type: 'BUY',
          date: new Date('2026-01-10T10:00:00.000Z'),
          quantity: 10,
          priceCents: BigInt(45075),
          commissionCents: BigInt(500),
          totalCents: BigInt(451250),
        },
      })
      testTransactionId = tx.id
    })

    it('should return transaction by id', async () => {
      const response = await request(app).get(
        `/api/transactions/${testTransactionId}`
      )

      expect(response.status).toBe(200)
      expect(response.body.data.id).toBe(testTransactionId)
      expect(response.body.data.type).toBe('BUY')
      expect(response.body.data.quantity).toBe('10')
      expect(response.body.data.price).toBe('450.75')
      expect(response.body.data.totalCost).toBe('4512.50')
    })

    it('should return 404 for non-existent transaction', async () => {
      const response = await request(app).get(
        '/api/transactions/clx1234567890abcdefghijkl'
      )

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('NOT_FOUND')
    })

    it('should return 404 for other user\'s transaction', async () => {
      const response = await request(otherUserApp).get(
        `/api/transactions/${testTransactionId}`
      )

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('NOT_FOUND')
    })
  })

  describe('Full Flow: Buy → Sell with Holdings Validation', () => {
    it('should track buy and sell transactions correctly', async () => {
      // Create holding with initial quantity
      await prisma.holding.create({
        data: {
          userId: testUserId,
          assetId: testAssetId,
          quantity: 50,
        },
      })

      // Buy 10 more
      const buyResponse = await request(app)
        .post('/api/transactions')
        .send({
          type: 'buy',
          assetId: testAssetId,
          date: '2026-01-10T10:00:00.000Z',
          quantity: 10,
          price: 100,
        })

      expect(buyResponse.status).toBe(201)
      expect(buyResponse.body.data.type).toBe('BUY')

      // Sell 30 (should succeed - we have 50)
      const sellResponse = await request(app)
        .post('/api/transactions')
        .send({
          type: 'sell',
          assetId: testAssetId,
          date: '2026-01-11T10:00:00.000Z',
          quantity: 30,
          price: 110,
        })

      expect(sellResponse.status).toBe(201)
      expect(sellResponse.body.data.type).toBe('SELL')
      expect(sellResponse.body.data.totalProceeds).toBe('3300.00')

      // List all transactions
      const listResponse = await request(app).get('/api/transactions')

      expect(listResponse.body.data).toHaveLength(2)
      // Most recent first
      expect(listResponse.body.data[0].type).toBe('SELL')
      expect(listResponse.body.data[1].type).toBe('BUY')
    })
  })

  describe('Holdings update on transaction (Story 4.2)', () => {
    it('should increase holding quantity on buy transaction (AC #1)', async () => {
      // Setup: Create asset with initial holding of 10 units
      await prisma.holding.create({
        data: {
          userId: testUserId,
          assetId: testAssetId,
          quantity: 10,
        },
      })

      // Action: POST buy transaction for 5 units
      const response = await request(app)
        .post('/api/transactions')
        .send({
          type: 'buy',
          assetId: testAssetId,
          date: '2026-01-10T10:00:00.000Z',
          quantity: 5,
          price: 100,
        })

      expect(response.status).toBe(201)

      // Assert: GET holdings shows 15 units
      const holdingsResponse = await request(app).get('/api/holdings')
      const holding = holdingsResponse.body.data.find(
        (h: { assetId: string }) => h.assetId === testAssetId
      )

      expect(holding).toBeDefined()
      expect(holding.quantity).toBe('15') // 10 + 5
    })

    it('should decrease holding quantity on sell transaction (AC #2)', async () => {
      // Setup: Create asset with holding of 10 units
      await prisma.holding.create({
        data: {
          userId: testUserId,
          assetId: testAssetId,
          quantity: 10,
        },
      })

      // Action: POST sell transaction for 3 units
      const response = await request(app)
        .post('/api/transactions')
        .send({
          type: 'sell',
          assetId: testAssetId,
          date: '2026-01-10T10:00:00.000Z',
          quantity: 3,
          price: 100,
        })

      expect(response.status).toBe(201)

      // Assert: GET holdings shows 7 units
      const holdingsResponse = await request(app).get('/api/holdings')
      const holding = holdingsResponse.body.data.find(
        (h: { assetId: string }) => h.assetId === testAssetId
      )

      expect(holding).toBeDefined()
      expect(holding.quantity).toBe('7') // 10 - 3
    })

    it('should create new holding on first buy (AC #3)', async () => {
      // Setup: Asset exists but NO holding
      // (testAssetId has no holding after beforeEach cleanup)

      // Action: POST buy transaction for 2 units
      const response = await request(app)
        .post('/api/transactions')
        .send({
          type: 'buy',
          assetId: testAssetId,
          date: '2026-01-10T10:00:00.000Z',
          quantity: 2,
          price: 100,
        })

      expect(response.status).toBe(201)

      // Assert: GET holdings shows 2 units (new holding created)
      const holdingsResponse = await request(app).get('/api/holdings')
      const holding = holdingsResponse.body.data.find(
        (h: { assetId: string }) => h.assetId === testAssetId
      )

      expect(holding).toBeDefined()
      expect(holding.quantity).toBe('2')
    })

    it('should not modify holding if transaction validation fails (AC #4)', async () => {
      // Setup: Create asset with 5 units
      await prisma.holding.create({
        data: {
          userId: testUserId,
          assetId: testAssetId,
          quantity: 5,
        },
      })

      // Action: POST sell transaction for 10 units (should fail - insufficient holdings)
      const response = await request(app)
        .post('/api/transactions')
        .send({
          type: 'sell',
          assetId: testAssetId,
          date: '2026-01-10T10:00:00.000Z',
          quantity: 10,
          price: 100,
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('VALIDATION_ERROR')

      // Assert: GET holdings still shows 5 units (unchanged)
      const holdingsResponse = await request(app).get('/api/holdings')
      const holding = holdingsResponse.body.data.find(
        (h: { assetId: string }) => h.assetId === testAssetId
      )

      expect(holding).toBeDefined()
      expect(holding.quantity).toBe('5') // Unchanged
    })

    it('should set holding to zero when selling all units (AC #5)', async () => {
      // Setup: Create asset with 5 units
      await prisma.holding.create({
        data: {
          userId: testUserId,
          assetId: testAssetId,
          quantity: 5,
        },
      })

      // Action: POST sell transaction for 5 units
      const response = await request(app)
        .post('/api/transactions')
        .send({
          type: 'sell',
          assetId: testAssetId,
          date: '2026-01-10T10:00:00.000Z',
          quantity: 5,
          price: 100,
        })

      expect(response.status).toBe(201)

      // Assert: GET holdings shows 0 units (not deleted)
      const holdingsResponse = await request(app).get('/api/holdings')
      const holding = holdingsResponse.body.data.find(
        (h: { assetId: string }) => h.assetId === testAssetId
      )

      expect(holding).toBeDefined()
      expect(holding.quantity).toBe('0') // Zero, not deleted
    })

    it('should update holdings atomically - multiple buys accumulate', async () => {
      // First buy creates holding
      await request(app)
        .post('/api/transactions')
        .send({
          type: 'buy',
          assetId: testAssetId,
          date: '2026-01-10T10:00:00.000Z',
          quantity: 10,
          price: 100,
        })

      // Second buy increases holding
      await request(app)
        .post('/api/transactions')
        .send({
          type: 'buy',
          assetId: testAssetId,
          date: '2026-01-11T10:00:00.000Z',
          quantity: 5,
          price: 110,
        })

      // Third buy increases holding again
      await request(app)
        .post('/api/transactions')
        .send({
          type: 'buy',
          assetId: testAssetId,
          date: '2026-01-12T10:00:00.000Z',
          quantity: 3,
          price: 120,
        })

      // Assert: Holdings = 10 + 5 + 3 = 18
      const holdingsResponse = await request(app).get('/api/holdings')
      const holding = holdingsResponse.body.data.find(
        (h: { assetId: string }) => h.assetId === testAssetId
      )

      expect(holding.quantity).toBe('18')
    })

    it('should handle mixed buy/sell sequence correctly', async () => {
      // Buy 10
      await request(app)
        .post('/api/transactions')
        .send({
          type: 'buy',
          assetId: testAssetId,
          date: '2026-01-10T10:00:00.000Z',
          quantity: 10,
          price: 100,
        })

      // Sell 3
      await request(app)
        .post('/api/transactions')
        .send({
          type: 'sell',
          assetId: testAssetId,
          date: '2026-01-11T10:00:00.000Z',
          quantity: 3,
          price: 110,
        })

      // Buy 5
      await request(app)
        .post('/api/transactions')
        .send({
          type: 'buy',
          assetId: testAssetId,
          date: '2026-01-12T10:00:00.000Z',
          quantity: 5,
          price: 105,
        })

      // Sell 2
      await request(app)
        .post('/api/transactions')
        .send({
          type: 'sell',
          assetId: testAssetId,
          date: '2026-01-13T10:00:00.000Z',
          quantity: 2,
          price: 115,
        })

      // Assert: Holdings = 10 - 3 + 5 - 2 = 10
      const holdingsResponse = await request(app).get('/api/holdings')
      const holding = holdingsResponse.body.data.find(
        (h: { assetId: string }) => h.assetId === testAssetId
      )

      expect(holding.quantity).toBe('10')
    })
  })
})
