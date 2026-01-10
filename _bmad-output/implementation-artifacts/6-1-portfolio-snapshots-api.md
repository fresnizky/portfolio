# Story 6.1: Portfolio Snapshots API

Status: in-progress

## Story

As a **user**,
I want **the system to save periodic snapshots of my portfolio state**,
So that **I can track my progress over time**.

## Acceptance Criteria

1. **Given** I have a configured portfolio with holdings and prices, **When** I POST to `/api/snapshots` (or triggered automatically), **Then** a snapshot is created with: date, totalValue, and breakdown by asset (quantity, price, value, percentage)

2. **Given** snapshots exist, **When** I GET `/api/snapshots`, **Then** I receive all snapshots sorted by date (newest first)

3. **Given** I want to see evolution, **When** I GET `/api/snapshots?from=2026-01-01&to=2026-03-31`, **Then** I receive only snapshots within that date range

4. **Given** I modify assets or targets, **When** I view historical snapshots, **Then** old snapshots retain their original values (immutable history)

5. **Given** a snapshot for today already exists, **When** I try to create another snapshot, **Then** the existing snapshot is updated (one snapshot per day max)

## Tasks / Subtasks

- [x] Task 1: Add Prisma models for snapshots (AC: #1, #4)
  - [x] Add `PortfolioSnapshot` model to `backend/prisma/schema.prisma`
  - [x] Add `SnapshotAsset` model to `backend/prisma/schema.prisma`
  - [x] Run `npx prisma migrate dev --name add_snapshots`
  - [x] Run `npx prisma generate`

- [x] Task 2: Create snapshot validation schemas (AC: #1, #3)
  - [x] Create `backend/src/validations/snapshot.ts`
  - [x] Define `snapshotQuerySchema` with optional `from` and `to` date filters
  - [x] Define `snapshotIdParamSchema` for URL parameter validation
  - [x] Create `backend/src/validations/snapshot.test.ts`

- [x] Task 3: Create snapshotService (AC: #1, #2, #3, #4, #5)
  - [x] Create `backend/src/services/snapshotService.ts`
  - [x] Implement `create(userId)` - creates snapshot from current portfolio state
  - [x] Implement `list(userId, query?)` - lists snapshots with optional date filtering
  - [x] Implement `getById(userId, snapshotId)` - retrieves single snapshot with breakdown
  - [x] Handle one-snapshot-per-day constraint (update if exists)
  - [x] Create `backend/src/services/snapshotService.test.ts`

- [x] Task 4: Create snapshots router (AC: #1, #2, #3)
  - [x] Create `backend/src/routes/snapshots.ts`
  - [x] Implement `POST /api/snapshots` endpoint
  - [x] Implement `GET /api/snapshots` endpoint with query filtering
  - [x] Implement `GET /api/snapshots/:id` endpoint
  - [x] Create `backend/src/routes/snapshots.test.ts`

- [x] Task 5: Register snapshots router (AC: #1, #2, #3)
  - [x] Modify `backend/src/index.ts` to import and use snapshots router
  - [x] Add route with authentication: `app.use('/api/snapshots', authMiddleware, snapshotsRouter)`

- [ ] Task 6: Ensure all tests pass
  - [ ] Run `pnpm test` to verify all tests pass
  - [ ] Fix any failing tests

## Dev Notes

### Prisma Schema Addition

```prisma
// Add to backend/prisma/schema.prisma

model PortfolioSnapshot {
  id           String          @id @default(cuid())
  date         DateTime        @db.Date
  totalValueCents BigInt
  userId       String
  user         User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  assets       SnapshotAsset[]
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt

  @@unique([userId, date])
  @@index([userId])
  @@index([date])
}

model SnapshotAsset {
  id          String            @id @default(cuid())
  snapshotId  String
  snapshot    PortfolioSnapshot @relation(fields: [snapshotId], references: [id], onDelete: Cascade)
  assetId     String
  ticker      String
  name        String
  quantity    Decimal           @db.Decimal(18, 8)
  priceCents  BigInt
  valueCents  BigInt
  percentage  Decimal           @db.Decimal(5, 2)

  @@unique([snapshotId, assetId])
  @@index([snapshotId])
}
```

**IMPORTANT**: Also add the relation to the User model:

```prisma
model User {
  // ... existing fields ...
  snapshots     PortfolioSnapshot[]
}
```

### Validation Schema Pattern

```typescript
// backend/src/validations/snapshot.ts
import { z } from 'zod'

export const snapshotQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
})

export const snapshotIdParamSchema = z.object({
  id: z.string().cuid2({ message: 'Invalid snapshot ID format' }),
})

export type SnapshotQuery = z.infer<typeof snapshotQuerySchema>
```

### Service Implementation Pattern

**CRITICAL**: Use existing utilities from the codebase:
- `fromCents()` from `@/lib/money` for BigInt to string conversion
- `prisma.$transaction()` for atomic snapshot + assets creation
- Always filter by `userId` for data ownership

```typescript
// backend/src/services/snapshotService.ts
import { prisma } from '@/config/database'
import { Errors } from '@/lib/errors'
import { fromCents, toCents } from '@/lib/money'

export const snapshotService = {
  async create(userId: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get current portfolio data
    const assets = await prisma.asset.findMany({
      where: { userId },
      include: { holding: true },
    })

    // Calculate total value
    let totalValueCents = BigInt(0)
    const assetBreakdown = assets
      .filter(asset => asset.holding && asset.currentPriceCents)
      .map(asset => {
        const valueCents = BigInt(
          Math.round(Number(asset.holding!.quantity) * Number(asset.currentPriceCents!))
        )
        totalValueCents += valueCents
        return {
          assetId: asset.id,
          ticker: asset.ticker,
          name: asset.name,
          quantity: asset.holding!.quantity,
          priceCents: asset.currentPriceCents!,
          valueCents,
        }
      })

    // Add percentage to each asset
    const assetsWithPercentage = assetBreakdown.map(asset => ({
      ...asset,
      percentage: totalValueCents > 0
        ? Number(asset.valueCents * BigInt(10000) / totalValueCents) / 100
        : 0,
    }))

    // Check if snapshot exists for today (upsert logic)
    const existingSnapshot = await prisma.portfolioSnapshot.findUnique({
      where: { userId_date: { userId, date: today } },
    })

    if (existingSnapshot) {
      // Update existing snapshot
      const updated = await prisma.$transaction(async (tx) => {
        // Delete old assets
        await tx.snapshotAsset.deleteMany({
          where: { snapshotId: existingSnapshot.id },
        })

        // Update snapshot
        const snapshot = await tx.portfolioSnapshot.update({
          where: { id: existingSnapshot.id },
          data: { totalValueCents },
        })

        // Create new assets
        await tx.snapshotAsset.createMany({
          data: assetsWithPercentage.map(a => ({
            snapshotId: snapshot.id,
            assetId: a.assetId,
            ticker: a.ticker,
            name: a.name,
            quantity: a.quantity,
            priceCents: a.priceCents,
            valueCents: a.valueCents,
            percentage: a.percentage,
          })),
        })

        return snapshot
      })

      return this.getById(userId, updated.id)
    }

    // Create new snapshot
    const snapshot = await prisma.$transaction(async (tx) => {
      const newSnapshot = await tx.portfolioSnapshot.create({
        data: {
          date: today,
          totalValueCents,
          userId,
        },
      })

      await tx.snapshotAsset.createMany({
        data: assetsWithPercentage.map(a => ({
          snapshotId: newSnapshot.id,
          assetId: a.assetId,
          ticker: a.ticker,
          name: a.name,
          quantity: a.quantity,
          priceCents: a.priceCents,
          valueCents: a.valueCents,
          percentage: a.percentage,
        })),
      })

      return newSnapshot
    })

    return this.getById(userId, snapshot.id)
  },

  async list(userId: string, query?: { from?: string; to?: string }) {
    const where: { userId: string; date?: { gte?: Date; lte?: Date } } = { userId }

    if (query?.from || query?.to) {
      where.date = {}
      if (query.from) where.date.gte = new Date(query.from)
      if (query.to) where.date.lte = new Date(query.to)
    }

    const snapshots = await prisma.portfolioSnapshot.findMany({
      where,
      include: { assets: true },
      orderBy: { date: 'desc' },
    })

    return {
      snapshots: snapshots.map(s => this.formatSnapshot(s)),
      total: snapshots.length,
    }
  },

  async getById(userId: string, id: string) {
    const snapshot = await prisma.portfolioSnapshot.findFirst({
      where: { id, userId },
      include: { assets: true },
    })

    if (!snapshot) {
      throw Errors.notFound('Snapshot')
    }

    return this.formatSnapshot(snapshot)
  },

  formatSnapshot(snapshot: PortfolioSnapshotWithAssets) {
    return {
      id: snapshot.id,
      date: snapshot.date.toISOString(),
      totalValue: fromCents(snapshot.totalValueCents),
      assets: snapshot.assets.map(a => ({
        assetId: a.assetId,
        ticker: a.ticker,
        name: a.name,
        quantity: a.quantity.toString(),
        price: fromCents(a.priceCents),
        value: fromCents(a.valueCents),
        percentage: a.percentage.toString(),
      })),
      createdAt: snapshot.createdAt.toISOString(),
    }
  },
}
```

### Route Implementation Pattern

```typescript
// backend/src/routes/snapshots.ts
import { Router, Request, Response, NextFunction } from 'express'
import { snapshotService } from '@/services/snapshotService'
import { validate, validateParams } from '@/middleware/validate'
import { snapshotQuerySchema, snapshotIdParamSchema } from '@/validations/snapshot'

const router: Router = Router()

// POST /api/snapshots - Create snapshot
router.post(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const snapshot = await snapshotService.create(req.user!.id)
      res.status(201).json({
        data: snapshot,
        message: 'Snapshot created',
      })
    } catch (error) {
      next(error)
    }
  }
)

// GET /api/snapshots - List snapshots
router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryResult = snapshotQuerySchema.safeParse(req.query)
      const query = queryResult.success ? queryResult.data : undefined

      const { snapshots, total } = await snapshotService.list(req.user!.id, query)
      res.json({
        data: snapshots,
        meta: { total },
      })
    } catch (error) {
      next(error)
    }
  }
)

// GET /api/snapshots/:id - Get single snapshot
router.get(
  '/:id',
  validateParams(snapshotIdParamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const snapshot = await snapshotService.getById(req.user!.id, req.params.id)
      res.json({ data: snapshot })
    } catch (error) {
      next(error)
    }
  }
)

export default router
```

### Register Router in index.ts

```typescript
// backend/src/index.ts
import snapshotsRouter from './routes/snapshots'

// ... existing routes ...
app.use('/api/snapshots', authMiddleware, snapshotsRouter)
```

### API Response Format

**POST /api/snapshots Response:**
```json
{
  "data": {
    "id": "clxyz123...",
    "date": "2026-01-10T00:00:00.000Z",
    "totalValue": "125000.00",
    "assets": [
      {
        "assetId": "clabc...",
        "ticker": "VOO",
        "name": "Vanguard S&P 500",
        "quantity": "15.50000000",
        "price": "450.75",
        "value": "6986.63",
        "percentage": "55.89"
      }
    ],
    "createdAt": "2026-01-10T15:30:00.000Z"
  },
  "message": "Snapshot created"
}
```

**GET /api/snapshots Response:**
```json
{
  "data": [
    { "id": "...", "date": "...", "totalValue": "...", "assets": [...] }
  ],
  "meta": { "total": 12 }
}
```

### File Structure

```
backend/
├── prisma/
│   └── schema.prisma                    (MODIFY - add models)
└── src/
    ├── services/
    │   ├── snapshotService.ts           (NEW)
    │   └── snapshotService.test.ts      (NEW)
    ├── routes/
    │   ├── snapshots.ts                 (NEW)
    │   └── snapshots.test.ts            (NEW)
    ├── validations/
    │   ├── snapshot.ts                  (NEW)
    │   └── snapshot.test.ts             (NEW)
    └── index.ts                         (MODIFY - add router)
```

### Testing Requirements

```typescript
// backend/src/services/snapshotService.test.ts
describe('snapshotService', () => {
  describe('create', () => {
    it('should create snapshot with current portfolio state')
    it('should calculate totalValue as sum of all position values')
    it('should include all assets with holdings in breakdown')
    it('should calculate percentage for each asset')
    it('should update existing snapshot if one exists for today')
    it('should handle empty portfolio gracefully')
  })

  describe('list', () => {
    it('should return all snapshots for user sorted by date desc')
    it('should filter by date range when from/to provided')
    it('should return empty array if no snapshots')
    it('should not return other users snapshots')
  })

  describe('getById', () => {
    it('should return snapshot with full breakdown')
    it('should throw notFound if snapshot does not exist')
    it('should throw notFound if snapshot belongs to other user')
  })
})

// backend/src/routes/snapshots.test.ts
describe('snapshots routes', () => {
  describe('POST /api/snapshots', () => {
    it('should create snapshot and return 201')
    it('should return 401 if not authenticated')
  })

  describe('GET /api/snapshots', () => {
    it('should return list of snapshots')
    it('should filter by date range when query params provided')
    it('should return 401 if not authenticated')
  })

  describe('GET /api/snapshots/:id', () => {
    it('should return snapshot by id')
    it('should return 404 if not found')
    it('should return 400 if invalid id format')
  })
})
```

### Anti-Patterns to Avoid

```typescript
// NEVER store monetary values as floats
totalValue: number // WRONG
totalValueCents: BigInt // CORRECT

// NEVER skip ownership check
const snapshot = await prisma.portfolioSnapshot.findUnique({ where: { id } }) // WRONG
const snapshot = await prisma.portfolioSnapshot.findFirst({ where: { id, userId } }) // CORRECT

// NEVER create multiple snapshots per day
await prisma.portfolioSnapshot.create({ ... }) // WRONG - check first
// CORRECT - use upsert logic or check/update

// NEVER modify historical snapshot data
await prisma.snapshotAsset.update({ ... }) // WRONG for old snapshots
// Snapshots are immutable history

// NEVER use raw numbers for Decimal fields
quantity: 15.5 // WRONG
quantity: new Prisma.Decimal('15.5') // CORRECT (Prisma handles conversion)
```

### Previous Story Context (Epic 5)

**Key Patterns Established:**
- API responses use `{ data: T }` or `{ data: T[], meta: { total } }` format
- All monetary values stored as BigInt (cents), returned as strings
- Services use format functions for consistent response structure
- Routes delegate to services, handle errors with `next(error)`
- Decimal values (quantities, percentages) returned as strings
- Tests mock prisma with `vi.mock()` pattern

**Files Referenced:**
- `backend/src/services/dashboardService.ts` - aggregation pattern
- `backend/src/services/transactionService.ts` - atomic transaction pattern
- `backend/src/routes/transactions.ts` - route structure pattern
- `backend/src/lib/money.ts` - `toCents()` and `fromCents()` utilities

### Key Technical Constraints

- **One snapshot per day**: Unique constraint on (userId, date)
- **Immutable history**: Old snapshots never modified, only current day can update
- **BigInt for money**: All monetary values in cents as BigInt
- **Decimal for quantities**: Use Prisma Decimal(18,8) for precision
- **Date handling**: Store as Date type with time set to midnight
- **Cascade delete**: SnapshotAsset deleted when snapshot deleted

### Project Context Reference

See `_bmad-output/project-context.md` for:
- TypeScript strict mode rules (no `any`)
- Path aliases (`@/services`, `@/lib`, `@/validations`)
- Naming conventions (camelCase for fields, PascalCase for models)
- API response format (`{ data: T }`)
- Error handling with `Errors.validation()`, `Errors.notFound()`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-6.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data-Architecture]
- [Source: backend/prisma/schema.prisma - Current models]
- [Source: backend/src/services/transactionService.ts - Atomic transaction pattern]
- [Source: backend/src/services/dashboardService.ts - Aggregation pattern]
- [Source: backend/src/lib/money.ts - Currency utilities]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

- **Task 1**: Added Prisma models `PortfolioSnapshot` and `SnapshotAsset` with proper constraints (unique userId+date, cascade deletes). Migration `20260110181020_add_snapshots` applied successfully.
- **Task 2**: Created validation schemas `snapshotQuerySchema` (from/to date filters) and `snapshotIdParamSchema`. 12 tests passing.
- **Task 3**: Implemented snapshotService with create, list, getById methods. Handles one-snapshot-per-day constraint. 17 tests passing.
- **Task 4**: Created snapshots router with POST, GET list, GET by ID endpoints. 13 route tests passing.
- **Task 5**: Registered snapshots router in index.ts with authMiddleware.

### File List

- `backend/prisma/schema.prisma` (modified)
- `backend/prisma/migrations/20260110181020_add_snapshots/migration.sql` (new)
- `backend/src/validations/snapshot.ts` (new)
- `backend/src/validations/snapshot.test.ts` (new)
- `backend/src/services/snapshotService.ts` (new)
- `backend/src/services/snapshotService.test.ts` (new)
- `backend/src/routes/snapshots.ts` (new)
- `backend/src/routes/snapshots.test.ts` (new)
- `backend/src/index.ts` (modified)
