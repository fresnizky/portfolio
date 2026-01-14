/**
 * Cleanup Corrupted Transactions Script
 *
 * Removes transactions with corrupted data (quantity=0 or total=0) that
 * resulted from the pre-9.1 *Cents model truncating high-precision values.
 *
 * Usage:
 *   npx ts-node --transpile-only scripts/cleanup-corrupted-transactions.ts          # Dry run (default)
 *   npx ts-node --transpile-only scripts/cleanup-corrupted-transactions.ts --execute # Actually delete
 *
 * Safety Features:
 *   - Dry run by default (no changes unless --execute flag is used)
 *   - Logs all deleted transaction IDs for audit trail
 *   - Does NOT automatically adjust holdings (manual reconciliation required)
 *
 * IMPORTANT:
 *   - Holdings are NOT automatically recalculated after deletion
 *   - User must manually verify holdings and re-enter valid transactions if needed
 *   - Consider backing up the database before running with --execute
 */

import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, Prisma } from '@prisma/client'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)

  return new PrismaClient({ adapter })
}

interface CleanupResult {
  dryRun: boolean
  found: number
  deleted: number
  transactionIds: string[]
}

async function cleanupCorruptedTransactions(): Promise<void> {
  const dryRun = !process.argv.includes('--execute')

  console.log('='.repeat(60))
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made')
    console.log('   Use --execute flag to actually delete transactions')
  } else {
    console.log('⚠️  EXECUTE MODE - Transactions WILL be deleted')
  }
  console.log('='.repeat(60))
  console.log('')

  const prisma = createPrismaClient()

  try {
    // Find corrupted transactions
    const corrupted = await prisma.transaction.findMany({
      where: {
        OR: [
          { quantity: { equals: new Prisma.Decimal(0) } },
          { total: { equals: new Prisma.Decimal(0) } },
        ],
      },
      include: {
        asset: {
          select: {
            ticker: true,
            name: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    })

    console.log(`Found ${corrupted.length} corrupted transaction(s)`)
    console.log('')

    // Handle no corrupted transactions
    if (corrupted.length === 0) {
      console.log('✅ No corrupted transactions to clean up')
      console.log('')

      const result: CleanupResult = {
        dryRun,
        found: 0,
        deleted: 0,
        transactionIds: [],
      }
      console.log('Summary:', JSON.stringify(result, null, 2))
      return
    }

    // Show transactions that will be affected
    console.log('Transactions to be deleted:')
    console.table(
      corrupted.map((t) => ({
        id: t.id.slice(0, 12) + '...',
        ticker: t.asset.ticker,
        date: t.date.toISOString().split('T')[0],
        type: t.type,
        quantity: t.quantity.toString(),
        total: t.total.toString(),
      }))
    )
    console.log('')

    const transactionIds = corrupted.map((t) => t.id)

    if (dryRun) {
      // Dry run - just report what would happen
      console.log('='.repeat(60))
      console.log('DRY RUN COMPLETE')
      console.log('='.repeat(60))
      console.log('')
      console.log('To delete these transactions, run:')
      console.log('  npm run cleanup:transactions -- --execute')
      console.log('')
      console.log('Transaction IDs that would be deleted:')
      transactionIds.forEach((id) => console.log(`  - ${id}`))

      const result: CleanupResult = {
        dryRun: true,
        found: corrupted.length,
        deleted: 0,
        transactionIds,
      }
      console.log('')
      console.log('Summary:', JSON.stringify(result, null, 2))
    } else {
      // Execute mode - actually delete
      console.log('Deleting transactions...')

      const deleteResult = await prisma.transaction.deleteMany({
        where: {
          id: { in: transactionIds },
        },
      })

      console.log('')
      console.log('='.repeat(60))
      console.log('CLEANUP COMPLETE')
      console.log('='.repeat(60))
      console.log('')
      console.log(`✅ Deleted ${deleteResult.count} corrupted transaction(s)`)
      console.log('')
      console.log('Deleted Transaction IDs (for audit):')
      transactionIds.forEach((id) => console.log(`  - ${id}`))
      console.log('')
      console.log('='.repeat(60))
      console.log('⚠️  IMPORTANT: Manual Reconciliation Required')
      console.log('='.repeat(60))
      console.log('')
      console.log(
        'Holdings have NOT been automatically adjusted after deletion.'
      )
      console.log('You should:')
      console.log('  1. Review your current holdings for each affected asset')
      console.log('  2. Re-enter any valid transactions that were deleted')
      console.log('  3. Manually adjust holdings if they are out of sync')
      console.log('')
      console.log(
        'The deleted transactions had zero quantity or zero total, which'
      )
      console.log('typically indicates corrupted data from precision truncation.')

      const result: CleanupResult = {
        dryRun: false,
        found: corrupted.length,
        deleted: deleteResult.count,
        transactionIds,
      }
      console.log('')
      console.log('Summary:', JSON.stringify(result, null, 2))
    }
  } finally {
    await prisma.$disconnect()
  }
}

// Execute
cleanupCorruptedTransactions().catch((error) => {
  console.error('Error during cleanup:', error)
  process.exit(1)
})
