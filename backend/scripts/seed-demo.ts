/**
 * Seed Demo Data Script
 *
 * Creates a complete demo user with realistic portfolio data for testing
 * all features: alerts, evolution, transactions, etc.
 *
 * Usage:
 *   pnpm seed:demo              # Development (default)
 *   pnpm seed:demo -- --env=dev # Explicit development
 *   pnpm seed:demo -- --env=prod --confirm-prod  # Production (requires confirmation)
 *
 * Demo user credentials:
 *   Email: demo@portfolio-tracker.test
 *   Password: DemoPassword123!
 */

import { parseArgs } from 'node:util'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, Prisma, AssetCategory, Currency, TransactionType } from '@prisma/client'
import * as dotenv from 'dotenv'
import { hashPassword } from '../src/lib/password'

// Load environment variables
dotenv.config()

// ============================================================================
// CLI Arguments
// ============================================================================

const { values } = parseArgs({
  options: {
    env: { type: 'string', default: 'dev' },
    'confirm-prod': { type: 'boolean', default: false },
  },
  strict: false,
})

const targetEnv = values.env as 'dev' | 'prod'
const confirmProd = values['confirm-prod'] as boolean

// ============================================================================
// Environment Configuration
// ============================================================================

interface EnvironmentConfig {
  name: string
  databaseUrl: string
}

const ENVIRONMENTS: Record<'dev' | 'prod', EnvironmentConfig> = {
  dev: {
    name: 'Development',
    databaseUrl:
      process.env.DATABASE_URL ||
      'postgresql://portfolio_user:portfolio_pass@localhost:5432/portfolio',
  },
  prod: {
    name: 'Production',
    databaseUrl: `postgresql://prod_user:${process.env.PROD_DB_PASSWORD || 'prod_secure_pass'}@localhost:10013/portfolio_prod`,
  },
}

// ============================================================================
// Demo User Configuration
// ============================================================================

const DEMO_USER = {
  email: 'demo@portfolio-tracker.test',
  password: 'DemoPassword123!',
  rebalanceThreshold: new Prisma.Decimal(5),
  priceAlertDays: 7,
  onboardingCompleted: true,
  onboardingSkipped: false,
}

// ============================================================================
// Asset Definitions
// ============================================================================

interface AssetDefinition {
  ticker: string
  name: string
  category: AssetCategory
  currency: Currency
  targetPercentage: number
  currentPrice: number | null
  priceUpdatedAt: Date | null
  decimalPlaces: number
}

function getAssetDefinitions(): AssetDefinition[] {
  const now = new Date()
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  return [
    // ETFs with stale prices (trigger stale_price alerts)
    {
      ticker: 'VOO',
      name: 'Vanguard S&P 500 ETF',
      category: 'ETF',
      currency: 'USD',
      targetPercentage: 35,
      currentPrice: 450,
      priceUpdatedAt: tenDaysAgo,
      decimalPlaces: 2,
    },
    {
      ticker: 'QQQ',
      name: 'Invesco QQQ Trust',
      category: 'ETF',
      currency: 'USD',
      targetPercentage: 20,
      currentPrice: 420,
      priceUpdatedAt: fourteenDaysAgo,
      decimalPlaces: 2,
    },
    // ETF with current price
    {
      ticker: 'VT',
      name: 'Vanguard Total World Stock ETF',
      category: 'ETF',
      currency: 'USD',
      targetPercentage: 10,
      currentPrice: 105,
      priceUpdatedAt: now,
      decimalPlaces: 2,
    },
    // FCI without price (trigger missing_price alert)
    {
      ticker: 'CONSERRD',
      name: 'FCI Conservador',
      category: 'FCI',
      currency: 'ARS',
      targetPercentage: 10,
      currentPrice: null,
      priceUpdatedAt: null,
      decimalPlaces: 2,
    },
    // Crypto (BTC will be overweight for rebalance alert)
    {
      ticker: 'BTC',
      name: 'Bitcoin',
      category: 'CRYPTO',
      currency: 'USD',
      targetPercentage: 15,
      currentPrice: 65000,
      priceUpdatedAt: now,
      decimalPlaces: 8,
    },
    {
      ticker: 'ETH',
      name: 'Ethereum',
      category: 'CRYPTO',
      currency: 'USD',
      targetPercentage: 5,
      currentPrice: 3200,
      priceUpdatedAt: now,
      decimalPlaces: 8,
    },
    // Cash positions
    {
      ticker: 'USD',
      name: 'US Dollar',
      category: 'CASH',
      currency: 'USD',
      targetPercentage: 3,
      currentPrice: 1,
      priceUpdatedAt: now,
      decimalPlaces: 2,
    },
    {
      ticker: 'ARS',
      name: 'Argentine Peso',
      category: 'CASH',
      currency: 'ARS',
      targetPercentage: 2,
      currentPrice: 1,
      priceUpdatedAt: now,
      decimalPlaces: 2,
    },
  ]
}

// ============================================================================
// Holding Definitions (calculated to trigger alerts)
// ============================================================================

interface HoldingDefinition {
  ticker: string
  quantity: number
}

// Holdings calculated to create:
// - BTC: ~22% actual vs 15% target (overweight alert)
// - VT: ~3% actual vs 10% target (underweight alert)
// - Others within threshold
const HOLDINGS: HoldingDefinition[] = [
  { ticker: 'VOO', quantity: 19 }, // 19 * $450 = $8,550 (34.2%)
  { ticker: 'QQQ', quantity: 12 }, // 12 * $420 = $5,040 (20.2%)
  { ticker: 'VT', quantity: 7 }, // 7 * $105 = $735 (2.9% - underweight!)
  { ticker: 'CONSERRD', quantity: 100 }, // No value (no price)
  { ticker: 'BTC', quantity: 0.085 }, // 0.085 * $65,000 = $5,525 (22.1% - overweight!)
  { ticker: 'ETH', quantity: 0.4 }, // 0.4 * $3,200 = $1,280 (5.1%)
  { ticker: 'USD', quantity: 750 }, // $750 (3.0%)
  { ticker: 'ARS', quantity: 600000 }, // ARS 600,000 / 1150 = ~$522 (2.1%)
]

// ============================================================================
// Transaction Generation
// ============================================================================

interface TransactionDefinition {
  ticker: string
  type: TransactionType
  quantity: number
  price: number
  monthsAgo: number
  dayOfMonth?: number
}

function getTransactionDefinitions(): TransactionDefinition[] {
  const transactions: TransactionDefinition[] = []

  // Month 0 (12 months ago): Initial purchases
  transactions.push(
    { ticker: 'VOO', type: 'BUY', quantity: 8, price: 380, monthsAgo: 12, dayOfMonth: 15 },
    { ticker: 'QQQ', type: 'BUY', quantity: 5, price: 360, monthsAgo: 12, dayOfMonth: 15 },
    { ticker: 'VT', type: 'BUY', quantity: 10, price: 95, monthsAgo: 12, dayOfMonth: 15 },
    { ticker: 'BTC', type: 'BUY', quantity: 0.03, price: 42000, monthsAgo: 12, dayOfMonth: 16 },
    { ticker: 'ETH', type: 'BUY', quantity: 0.25, price: 2200, monthsAgo: 12, dayOfMonth: 16 },
    { ticker: 'USD', type: 'BUY', quantity: 1500, price: 1, monthsAgo: 12, dayOfMonth: 14 },
    { ticker: 'ARS', type: 'BUY', quantity: 340000, price: 1, monthsAgo: 12, dayOfMonth: 14 },
    { ticker: 'CONSERRD', type: 'BUY', quantity: 100, price: 1200, monthsAgo: 12, dayOfMonth: 17 }
  )

  // DCA over months 1-11
  for (let month = 11; month >= 1; month--) {
    if (month % 3 === 2) {
      // Buy VOO
      transactions.push({
        ticker: 'VOO',
        type: 'BUY',
        quantity: 2,
        price: 380 + (12 - month) * 5,
        monthsAgo: month,
        dayOfMonth: 15,
      })
    } else if (month % 3 === 1) {
      // Buy BTC
      transactions.push({
        ticker: 'BTC',
        type: 'BUY',
        quantity: 0.01,
        price: 42000 + (12 - month) * 2000,
        monthsAgo: month,
        dayOfMonth: 15,
      })
    } else {
      // Buy QQQ
      transactions.push({
        ticker: 'QQQ',
        type: 'BUY',
        quantity: 1,
        price: 360 + (12 - month) * 5,
        monthsAgo: month,
        dayOfMonth: 15,
      })
    }
  }

  // Add some sells for realism
  // Month 8: Sell some BTC (taking profits)
  transactions.push({
    ticker: 'BTC',
    type: 'SELL',
    quantity: 0.005,
    price: 52000,
    monthsAgo: 8,
    dayOfMonth: 20,
  })

  // Month 4: Sell VOO (rebalancing)
  transactions.push({
    ticker: 'VOO',
    type: 'SELL',
    quantity: 1,
    price: 430,
    monthsAgo: 4,
    dayOfMonth: 22,
  })

  // Recent purchases to reach current holdings
  transactions.push(
    { ticker: 'VOO', type: 'BUY', quantity: 2, price: 448, monthsAgo: 0, dayOfMonth: 5 },
    { ticker: 'BTC', type: 'BUY', quantity: 0.015, price: 64000, monthsAgo: 0, dayOfMonth: 10 },
    { ticker: 'ARS', type: 'BUY', quantity: 260000, price: 1, monthsAgo: 0, dayOfMonth: 8 }
  )

  return transactions
}

// ============================================================================
// Portfolio Evolution (monthly values for snapshots)
// ============================================================================

function calculateMonthlyValues(): number[] {
  // Growth from $10,000 to ~$25,000 over 12 months with realistic fluctuations
  const monthlyChanges = [
    0, // Month 0: base
    0.08, // Month 1: +8%
    0.05, // Month 2: +5%
    -0.02, // Month 3: -2%
    0.1, // Month 4: +10%
    0.06, // Month 5: +6%
    -0.01, // Month 6: -1%
    0.09, // Month 7: +9%
    0.04, // Month 8: +4%
    0.07, // Month 9: +7%
    -0.03, // Month 10: -3%
    0.08, // Month 11: +8%
    0.05, // Month 12: +5%
  ]

  const values: number[] = [10000]
  for (let i = 1; i < monthlyChanges.length; i++) {
    values.push(values[i - 1] * (1 + monthlyChanges[i]))
  }
  return values
}

// ============================================================================
// Database Helpers
// ============================================================================

function createPrismaClient(databaseUrl: string): PrismaClient {
  const pool = new Pool({ connectionString: databaseUrl })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

// ============================================================================
// Seeding Functions
// ============================================================================

async function seedDemoUser(prisma: PrismaClient): Promise<string> {
  console.log('Creating demo user...')

  // Delete existing demo user if exists (cascade deletes related data)
  const existing = await prisma.user.findUnique({
    where: { email: DEMO_USER.email },
  })

  if (existing) {
    console.log('  Removing existing demo user and data...')
    await prisma.user.delete({ where: { id: existing.id } })
  }

  const passwordHash = await hashPassword(DEMO_USER.password)
  const user = await prisma.user.create({
    data: {
      email: DEMO_USER.email,
      passwordHash,
      rebalanceThreshold: DEMO_USER.rebalanceThreshold,
      priceAlertDays: DEMO_USER.priceAlertDays,
      onboardingCompleted: DEMO_USER.onboardingCompleted,
      onboardingSkipped: DEMO_USER.onboardingSkipped,
    },
  })

  console.log(`  Created user: ${user.email}`)
  return user.id
}

async function seedAssets(
  prisma: PrismaClient,
  userId: string
): Promise<Map<string, string>> {
  console.log('Creating assets...')

  const assetDefinitions = getAssetDefinitions()
  const assetMap = new Map<string, string>()

  for (const asset of assetDefinitions) {
    const created = await prisma.asset.create({
      data: {
        userId,
        ticker: asset.ticker,
        name: asset.name,
        category: asset.category,
        currency: asset.currency,
        targetPercentage: new Prisma.Decimal(asset.targetPercentage),
        currentPrice: asset.currentPrice
          ? new Prisma.Decimal(asset.currentPrice)
          : null,
        priceUpdatedAt: asset.priceUpdatedAt,
        decimalPlaces: asset.decimalPlaces,
      },
    })
    assetMap.set(asset.ticker, created.id)
    console.log(`  Created: ${asset.ticker} (${asset.category})`)
  }

  return assetMap
}

async function seedHoldings(
  prisma: PrismaClient,
  userId: string,
  assetMap: Map<string, string>
): Promise<void> {
  console.log('Creating holdings...')

  for (const holding of HOLDINGS) {
    const assetId = assetMap.get(holding.ticker)
    if (!assetId) {
      console.log(`  Warning: Asset ${holding.ticker} not found, skipping holding`)
      continue
    }

    await prisma.holding.create({
      data: {
        userId,
        assetId,
        quantity: new Prisma.Decimal(holding.quantity),
      },
    })
    console.log(`  Created: ${holding.ticker} = ${holding.quantity}`)
  }
}

async function seedTransactions(
  prisma: PrismaClient,
  userId: string,
  assetMap: Map<string, string>
): Promise<void> {
  console.log('Creating transactions...')

  const transactions = getTransactionDefinitions()
  let count = 0

  for (const tx of transactions) {
    const assetId = assetMap.get(tx.ticker)
    if (!assetId) {
      console.log(`  Warning: Asset ${tx.ticker} not found, skipping transaction`)
      continue
    }

    const date = new Date()
    date.setMonth(date.getMonth() - tx.monthsAgo)
    date.setDate(tx.dayOfMonth || 15)
    date.setHours(12, 0, 0, 0)

    const quantity = new Prisma.Decimal(tx.quantity)
    const price = new Prisma.Decimal(tx.price)
    const total = quantity.mul(price)

    await prisma.transaction.create({
      data: {
        userId,
        assetId,
        type: tx.type,
        date,
        quantity,
        price,
        commission: new Prisma.Decimal(0),
        total,
      },
    })
    count++
  }

  console.log(`  Created ${count} transactions`)
}

async function seedSnapshots(
  prisma: PrismaClient,
  userId: string,
  assetMap: Map<string, string>
): Promise<void> {
  console.log('Creating portfolio snapshots...')

  const monthlyValues = calculateMonthlyValues()
  const assetDefinitions = getAssetDefinitions()

  // Create snapshots for each month
  for (let monthsAgo = 12; monthsAgo >= 0; monthsAgo--) {
    const monthIndex = 12 - monthsAgo
    const totalValue = monthlyValues[monthIndex]

    const snapshotDate = new Date()
    snapshotDate.setMonth(snapshotDate.getMonth() - monthsAgo)
    snapshotDate.setDate(1)
    snapshotDate.setHours(0, 0, 0, 0)

    // Create snapshot
    const snapshot = await prisma.portfolioSnapshot.create({
      data: {
        userId,
        date: snapshotDate,
        totalValue: new Prisma.Decimal(totalValue),
      },
    })

    // Create snapshot assets (proportional to target allocation)
    for (const asset of assetDefinitions) {
      const assetId = assetMap.get(asset.ticker)
      if (!assetId) continue

      // Skip CONSERRD for snapshots (no price)
      if (asset.ticker === 'CONSERRD') continue

      const percentage = asset.targetPercentage
      const value = (totalValue * percentage) / 100
      const price = asset.currentPrice || 1

      // Estimate quantity based on historical price (simplified)
      const historicalPriceMultiplier = 1 - (monthsAgo * 0.02) // prices were lower in the past
      const historicalPrice = price * historicalPriceMultiplier
      const quantity = value / historicalPrice

      await prisma.snapshotAsset.create({
        data: {
          snapshotId: snapshot.id,
          assetId,
          ticker: asset.ticker,
          name: asset.name,
          quantity: new Prisma.Decimal(quantity),
          price: new Prisma.Decimal(historicalPrice),
          value: new Prisma.Decimal(value),
          percentage: new Prisma.Decimal(percentage),
        },
      })
    }
  }

  console.log(`  Created 13 monthly snapshots`)
}

async function seedExchangeRate(prisma: PrismaClient): Promise<void> {
  console.log('Creating exchange rate...')

  await prisma.exchangeRate.upsert({
    where: {
      baseCurrency_quoteCurrency: { baseCurrency: 'USD', quoteCurrency: 'ARS' },
    },
    update: {
      rate: new Prisma.Decimal(1150),
      fetchedAt: new Date(),
      source: 'seed-demo',
    },
    create: {
      baseCurrency: 'USD',
      quoteCurrency: 'ARS',
      rate: new Prisma.Decimal(1150),
      fetchedAt: new Date(),
      source: 'seed-demo',
    },
  })

  console.log('  USD/ARS = 1150')
}

// ============================================================================
// Main Execution
// ============================================================================

async function main(): Promise<void> {
  // Validate environment
  if (targetEnv !== 'dev' && targetEnv !== 'prod') {
    console.error(`ERROR: Invalid environment "${targetEnv}". Use "dev" or "prod".`)
    process.exit(1)
  }

  // Production safety check
  if (targetEnv === 'prod' && !confirmProd) {
    console.error('')
    console.error('ERROR: Production environment requires explicit confirmation.')
    console.error('Usage: pnpm seed:demo -- --env=prod --confirm-prod')
    console.error('')
    process.exit(1)
  }

  const envConfig = ENVIRONMENTS[targetEnv]

  console.log('')
  console.log('='.repeat(60))
  console.log('Portfolio Demo Seed Script')
  console.log('='.repeat(60))
  console.log('')
  console.log(`Environment: ${envConfig.name}`)
  console.log(`Database: ${envConfig.databaseUrl.replace(/:[^:@]+@/, ':****@')}`)
  console.log('')

  if (targetEnv === 'prod') {
    console.log('!'.repeat(60))
    console.log('  WARNING: RUNNING ON PRODUCTION DATABASE')
    console.log('!'.repeat(60))
    console.log('')
  }

  const prisma = createPrismaClient(envConfig.databaseUrl)

  try {
    // Seed all data
    const userId = await seedDemoUser(prisma)
    const assetMap = await seedAssets(prisma, userId)
    await seedHoldings(prisma, userId, assetMap)
    await seedTransactions(prisma, userId, assetMap)
    await seedSnapshots(prisma, userId, assetMap)
    await seedExchangeRate(prisma)

    console.log('')
    console.log('='.repeat(60))
    console.log('Seed completed successfully!')
    console.log('='.repeat(60))
    console.log('')
    console.log('Demo user credentials:')
    console.log(`  Email:    ${DEMO_USER.email}`)
    console.log(`  Password: ${DEMO_USER.password}`)
    console.log('')
    console.log('Expected alerts:')
    console.log('  - VOO: stale_price (10 days old)')
    console.log('  - QQQ: stale_price (14 days old)')
    console.log('  - CONSERRD: missing_price')
    console.log('  - BTC: rebalance_needed (overweight ~7%)')
    console.log('  - VT: rebalance_needed (underweight ~7%)')
    console.log('')
  } catch (error) {
    console.error('Seed failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
