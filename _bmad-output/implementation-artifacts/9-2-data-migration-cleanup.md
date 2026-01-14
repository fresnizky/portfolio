# Story 9.2: Data Migration & Cleanup

Status: done

## Story

As a **user with existing transaction data**,
I want **corrupted transactions (with zero quantities or totals) to be identified and cleaned up**,
so that **my portfolio calculations are accurate and I don't have ghost transactions**.

## Problem Description

Antes de la migración de Story 9-1, algunas transacciones se guardaron con datos corruptos debido al modelo `*Cents` que truncaba valores de alta precisión:

- **Transacciones con `quantity: 0.00000000`** cuando el valor real era ej: 0.00012345 BTC
- **Transacciones con `total: 0`** (convertido de `totalCents: 0`) para compras válidas
- **Holdings desincronizados** que no reflejan las transacciones reales

Estos datos corruptos persisten en la base de datos post-migración y necesitan ser identificados y limpiados.

## Acceptance Criteria

1. **Given** the database after schema migration (Story 9-1)
   **When** I run a data analysis query
   **Then** I get a report of all transactions with `quantity = 0` or `total = 0`

2. **Given** corrupted transactions are identified
   **When** I review the report
   **Then** I can see: transaction ID, asset ticker, date, original values for manual verification

3. **Given** a corrupted transaction record
   **When** I decide to delete it (user-confirmed)
   **Then** the transaction is removed from the database

4. **Given** transactions are deleted
   **When** the cleanup completes
   **Then** the associated holdings are NOT automatically adjusted (manual reconciliation required)

5. **Given** the cleanup process runs
   **When** it completes
   **Then** a summary report shows: transactions analyzed, corrupted found, deleted count

6. **Given** no corrupted transactions exist
   **When** I run the cleanup
   **Then** the report shows "0 corrupted transactions found"

## Tasks / Subtasks

- [x] Task 1: Create data analysis script (AC: #1, #2)
  - [x] 1.1 Create `backend/scripts/analyze-corrupted-transactions.ts`
  - [x] 1.2 Query transactions where `quantity = 0` OR `total = 0`
  - [x] 1.3 Include asset ticker, date, and all transaction fields in output
  - [x] 1.4 Output results as JSON and console table

- [x] Task 2: Create cleanup script (AC: #3, #4, #5, #6)
  - [x] 2.1 Create `backend/scripts/cleanup-corrupted-transactions.ts`
  - [x] 2.2 Add `--dry-run` flag (default) to preview deletions
  - [x] 2.3 Add `--execute` flag to actually perform deletions
  - [x] 2.4 Generate summary report with counts
  - [x] 2.5 Log all deleted transaction IDs for audit trail

- [x] Task 3: Add npm scripts for easy execution (AC: #1-6)
  - [x] 3.1 Add `"analyze:transactions": "npx ts-node scripts/analyze-corrupted-transactions.ts"` to package.json
  - [x] 3.2 Add `"cleanup:transactions": "npx ts-node scripts/cleanup-corrupted-transactions.ts"` to package.json

- [x] Task 4: Document manual reconciliation process (AC: #4)
  - [x] 4.1 Add comments in script about holdings reconciliation
  - [x] 4.2 Note in completion notes that user must manually re-enter valid transactions

## Dev Notes

### Data Analysis Query

```typescript
// Find potentially corrupted transactions
const corrupted = await prisma.transaction.findMany({
  where: {
    OR: [
      { quantity: { equals: new Decimal(0) } },
      { total: { equals: new Decimal(0) } },
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
```

### Expected Output Format

```json
{
  "analyzed": 150,
  "corrupted": 3,
  "transactions": [
    {
      "id": "clx123...",
      "date": "2026-01-10T00:00:00.000Z",
      "type": "BUY",
      "asset": { "ticker": "BTC", "name": "Bitcoin" },
      "quantity": "0.00000000",
      "price": "45000.00",
      "total": "0.00000000",
      "reason": "quantity is zero"
    }
  ]
}
```

### Script Structure

```typescript
// backend/scripts/analyze-corrupted-transactions.ts
import { PrismaClient, Decimal } from '@prisma/client'

const prisma = new PrismaClient()

async function analyzeCorruptedTransactions() {
  console.log('Analyzing transactions for data corruption...\n')

  const allTransactions = await prisma.transaction.count()

  const corrupted = await prisma.transaction.findMany({
    where: {
      OR: [
        { quantity: { equals: new Decimal(0) } },
        { total: { equals: new Decimal(0) } },
      ],
    },
    include: {
      asset: { select: { ticker: true, name: true, category: true } },
    },
    orderBy: { date: 'desc' },
  })

  console.log(`Total transactions: ${allTransactions}`)
  console.log(`Corrupted found: ${corrupted.length}\n`)

  if (corrupted.length > 0) {
    console.table(corrupted.map(t => ({
      id: t.id.slice(0, 8) + '...',
      date: t.date.toISOString().split('T')[0],
      type: t.type,
      ticker: t.asset.ticker,
      quantity: t.quantity.toString(),
      price: t.price.toString(),
      total: t.total.toString(),
    })))
  }

  // Output full JSON for detailed inspection
  console.log('\nFull report:')
  console.log(JSON.stringify({
    analyzed: allTransactions,
    corrupted: corrupted.length,
    transactions: corrupted.map(t => ({
      id: t.id,
      date: t.date.toISOString(),
      type: t.type,
      asset: t.asset,
      quantity: t.quantity.toString(),
      price: t.price.toString(),
      commission: t.commission.toString(),
      total: t.total.toString(),
      reason: t.quantity.equals(new Decimal(0)) ? 'quantity is zero' : 'total is zero',
    })),
  }, null, 2))

  await prisma.$disconnect()
}

analyzeCorruptedTransactions()
```

### Cleanup Script

```typescript
// backend/scripts/cleanup-corrupted-transactions.ts
import { PrismaClient, Decimal } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupCorruptedTransactions() {
  const dryRun = !process.argv.includes('--execute')

  console.log(dryRun
    ? '🔍 DRY RUN - No changes will be made\n'
    : '⚠️  EXECUTING - Transactions will be deleted\n'
  )

  const corrupted = await prisma.transaction.findMany({
    where: {
      OR: [
        { quantity: { equals: new Decimal(0) } },
        { total: { equals: new Decimal(0) } },
      ],
    },
    select: { id: true },
  })

  console.log(`Found ${corrupted.length} corrupted transactions`)

  if (corrupted.length === 0) {
    console.log('✅ No corrupted transactions to clean up')
    await prisma.$disconnect()
    return
  }

  if (dryRun) {
    console.log('\nRun with --execute to delete these transactions')
    console.log('IDs to delete:', corrupted.map(t => t.id))
  } else {
    const result = await prisma.transaction.deleteMany({
      where: {
        id: { in: corrupted.map(t => t.id) },
      },
    })

    console.log(`\n✅ Deleted ${result.count} corrupted transactions`)
    console.log('Deleted IDs:', corrupted.map(t => t.id))
    console.log('\n⚠️  IMPORTANT: Holdings may need manual reconciliation')
    console.log('Review your holdings and re-enter valid transactions as needed')
  }

  await prisma.$disconnect()
}

cleanupCorruptedTransactions()
```

### Architecture Compliance

- **Scripts location:** `backend/scripts/` for database utility scripts
- **Prisma Client:** Use existing client pattern from `backend/src/config/database.ts` or standalone
- **Decimal handling:** Use Prisma's Decimal class for comparisons
- **Logging:** Console output for CLI scripts

### Critical Considerations

1. **Non-destructive by default:** Scripts should be read-only unless explicitly told to modify data

2. **Holdings NOT auto-adjusted:** Deleting transactions does NOT recalculate holdings - this is intentional to prevent cascading data issues. User must manually verify holdings.

3. **Audit trail:** All deleted transaction IDs should be logged for potential recovery needs

4. **Backup reminder:** User should backup database before running cleanup with `--execute`

### Files to Create

| File | Purpose |
|------|---------|
| `backend/scripts/analyze-corrupted-transactions.ts` | Analyze and report corrupted transactions |
| `backend/scripts/cleanup-corrupted-transactions.ts` | Delete corrupted transactions (with flags) |

### Files to Modify

| File | Change |
|------|--------|
| `backend/package.json` | Add npm scripts for analyze and cleanup |

### Testing Approach

1. **Before running scripts:**
   - Ensure database has been migrated (Story 9-1)
   - Create a database backup: `pg_dump portfolio > backup_pre_cleanup.sql`

2. **Test analyze script:**
   - Run `npm run analyze:transactions`
   - Verify output format is correct
   - Verify it identifies known corrupted data (if any)

3. **Test cleanup script (dry run):**
   - Run `npm run cleanup:transactions` (default is dry run)
   - Verify it lists transactions to delete without modifying

4. **Test cleanup script (execute):**
   - Run `npm run cleanup:transactions -- --execute`
   - Verify transactions are deleted
   - Verify holdings remain unchanged

### Previous Story Learnings

From Story 9-1:
- Schema migration completed successfully with data conversion (cents / 100)
- Prisma client regenerated with new types
- Backend/frontend TypeScript errors exist and will be fixed in Stories 9-3 and 9-4

**Key insight:** The migration converted `totalCents: 0` to `total: 0.00000000`, which preserves the corrupted state. This story cleans up that corrupted data.

### Dependencies

**Requires:**
- Story 9-1: Schema Migration (DONE) - provides new Decimal fields

**Blocks:**
- None - this is independent data cleanup

**Optional follow-up:**
- Manual re-entry of valid transactions by user
- Holdings reconciliation if needed

### References

- [Source: sprint-change-proposal-2026-01-13.md#4.4] - Data migration requirements
- [Source: 9-1-schema-migration-decimal-places.md] - Previous story completion notes
- [Source: backend/prisma/schema.prisma] - Current schema with Decimal fields
- [Source: project-context.md#Testing Rules] - Co-located tests pattern
- [Source: architecture.md#Backend Patterns] - Script and service patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - Scripts created without compilation issues

### Completion Notes List

- Created `analyze-corrupted-transactions.ts` script that queries for transactions with `quantity=0` or `total=0`, outputs both console table and full JSON report
- Created `cleanup-corrupted-transactions.ts` script with `--dry-run` (default) and `--execute` modes, logs all deleted IDs for audit
- Both scripts use the same Prisma client pattern with PrismaPg adapter as existing codebase
- Scripts include extensive documentation about manual holdings reconciliation requirement
- Added npm scripts to `package.json` for easy execution
- **IMPORTANT for user:** After running cleanup with `--execute`, holdings are NOT auto-adjusted. User must manually verify holdings and re-enter valid transactions if needed.

### File List

- `backend/scripts/analyze-corrupted-transactions.ts` (new)
- `backend/scripts/cleanup-corrupted-transactions.ts` (new)
- `backend/package.json` (modified - added npm scripts)

### Change Log

- 2026-01-13: Story 9-2 implementation complete - data analysis and cleanup scripts created

