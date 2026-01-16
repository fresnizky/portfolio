/**
 * Cleanup Demo Data Script
 *
 * Removes all data created by the seed-demo.ts script.
 * Deletes the demo user and all associated data (cascades).
 *
 * Usage:
 *   pnpm seed:cleanup              # Development (default)
 *   pnpm seed:cleanup -- --env=dev # Explicit development
 *   pnpm seed:cleanup -- --env=prod --confirm-prod  # Production (requires confirmation)
 */

import { parseArgs } from 'node:util'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

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

// Demo user email (must match seed-demo.ts)
const DEMO_USER_EMAIL = 'demo@portfolio-tracker.test'

// ============================================================================
// Database Helpers
// ============================================================================

function createPrismaClient(databaseUrl: string): PrismaClient {
  const pool = new Pool({ connectionString: databaseUrl })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

// ============================================================================
// Cleanup Functions
// ============================================================================

async function cleanupDemoUser(prisma: PrismaClient): Promise<boolean> {
  console.log('Looking for demo user...')

  const demoUser = await prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL },
    include: {
      _count: {
        select: {
          assets: true,
          holdings: true,
          transactions: true,
          snapshots: true,
        },
      },
    },
  })

  if (!demoUser) {
    console.log('  Demo user not found. Nothing to clean up.')
    return false
  }

  console.log(`  Found user: ${demoUser.email}`)
  console.log(`  Assets: ${demoUser._count.assets}`)
  console.log(`  Holdings: ${demoUser._count.holdings}`)
  console.log(`  Transactions: ${demoUser._count.transactions}`)
  console.log(`  Snapshots: ${demoUser._count.snapshots}`)
  console.log('')
  console.log('Deleting demo user and all related data...')

  await prisma.user.delete({
    where: { id: demoUser.id },
  })

  console.log('  User deleted successfully (cascade deleted all related data)')
  return true
}

async function cleanupExchangeRate(prisma: PrismaClient): Promise<boolean> {
  console.log('Checking for seed exchange rate...')

  const exchangeRate = await prisma.exchangeRate.findFirst({
    where: { source: 'seed-demo' },
  })

  if (!exchangeRate) {
    console.log('  No seed exchange rate found.')
    return false
  }

  console.log(`  Found: ${exchangeRate.baseCurrency}/${exchangeRate.quoteCurrency} = ${exchangeRate.rate}`)
  console.log('  Note: Exchange rate not deleted (may be in use by other users)')
  // We don't delete the exchange rate as it might be useful
  // Uncomment below to delete it:
  // await prisma.exchangeRate.delete({ where: { id: exchangeRate.id } })
  // console.log('  Exchange rate deleted')

  return true
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
    console.error('Usage: pnpm seed:cleanup -- --env=prod --confirm-prod')
    console.error('')
    process.exit(1)
  }

  const envConfig = ENVIRONMENTS[targetEnv]

  console.log('')
  console.log('='.repeat(60))
  console.log('Portfolio Demo Cleanup Script')
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
    const userDeleted = await cleanupDemoUser(prisma)
    await cleanupExchangeRate(prisma)

    console.log('')
    console.log('='.repeat(60))
    if (userDeleted) {
      console.log('Cleanup completed successfully!')
    } else {
      console.log('No demo data found to clean up.')
    }
    console.log('='.repeat(60))
    console.log('')
  } catch (error) {
    console.error('Cleanup failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
