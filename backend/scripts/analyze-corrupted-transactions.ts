/**
 * Analyze Corrupted Transactions Script
 *
 * Identifies transactions with corrupted data (quantity=0 or total=0) that
 * may have resulted from the pre-9.1 *Cents model truncating high-precision values.
 *
 * Usage:
 *   npx ts-node --transpile-only scripts/analyze-corrupted-transactions.ts
 *
 * Output:
 *   - Console table with corrupted transactions
 *   - Full JSON report for detailed inspection
 *
 * Note: This script is READ-ONLY and does not modify any data.
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

interface CorruptedTransactionReport {
  analyzed: number
  corrupted: number
  transactions: Array<{
    id: string
    date: string
    type: string
    asset: {
      ticker: string
      name: string
      category: string
    }
    quantity: string
    price: string
    commission: string
    total: string
    reason: string
  }>
}

async function analyzeCorruptedTransactions(): Promise<void> {
  console.log('='.repeat(60))
  console.log('Analyzing transactions for data corruption...')
  console.log('='.repeat(60))
  console.log('')

  const prisma = createPrismaClient()

  try {
    const allTransactions = await prisma.transaction.count()

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
            category: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    })

    console.log(`Total transactions analyzed: ${allTransactions}`)
    console.log(`Corrupted transactions found: ${corrupted.length}`)
    console.log('')

    if (corrupted.length === 0) {
      console.log('✅ No corrupted transactions found!')
      console.log('')
      console.log('Your transaction data appears to be clean.')
    } else {
      console.log('⚠️  Corrupted transactions detected:')
      console.log('')

      // Display console table for quick overview
      console.table(
        corrupted.map((t) => ({
          id: t.id.slice(0, 8) + '...',
          date: t.date.toISOString().split('T')[0],
          type: t.type,
          ticker: t.asset.ticker,
          quantity: t.quantity.toString(),
          price: t.price.toString(),
          total: t.total.toString(),
          reason: t.quantity.equals(new Prisma.Decimal(0))
            ? 'quantity=0'
            : 'total=0',
        }))
      )
    }

    // Output full JSON for detailed inspection
    const report: CorruptedTransactionReport = {
      analyzed: allTransactions,
      corrupted: corrupted.length,
      transactions: corrupted.map((t) => ({
        id: t.id,
        date: t.date.toISOString(),
        type: t.type,
        asset: t.asset,
        quantity: t.quantity.toString(),
        price: t.price.toString(),
        commission: t.commission.toString(),
        total: t.total.toString(),
        reason: t.quantity.equals(new Prisma.Decimal(0))
          ? 'quantity is zero'
          : 'total is zero',
      })),
    }

    console.log('')
    console.log('='.repeat(60))
    console.log('Full JSON Report:')
    console.log('='.repeat(60))
    console.log(JSON.stringify(report, null, 2))

    if (corrupted.length > 0) {
      console.log('')
      console.log('='.repeat(60))
      console.log('Next Steps:')
      console.log('='.repeat(60))
      console.log(
        '1. Review the corrupted transactions above to verify they are invalid'
      )
      console.log(
        '2. Run `npm run cleanup:transactions` (dry-run) to preview cleanup'
      )
      console.log(
        '3. Run `npm run cleanup:transactions -- --execute` to delete corrupted data'
      )
      console.log(
        '4. After cleanup, manually re-enter valid transactions if needed'
      )
    }
  } finally {
    await prisma.$disconnect()
  }
}

// Execute
analyzeCorruptedTransactions().catch((error) => {
  console.error('Error analyzing transactions:', error)
  process.exit(1)
})
