# Story 3.2: Price Update & Portfolio Valuation

Status: in-progress

## Story

As a **user**,
I want **to update current prices and see my portfolio's total value**,
so that **I know how much my investments are worth**.

## Acceptance Criteria

1. **Given** I have an asset, **When** I PUT to `/api/prices/:assetId` with currentPrice, **Then** the price is saved with the current timestamp as priceUpdatedAt

2. **Given** I have assets with prices and holdings, **When** I GET `/api/portfolio/summary`, **Then** I receive for each asset: quantity, currentPrice, value (quantity × price), priceUpdatedAt

3. **Given** I have multiple assets with holdings and prices, **When** I GET `/api/portfolio/summary`, **Then** I receive totalValue as the sum of all position values

4. **Given** I update multiple prices, **When** I PUT to `/api/prices/batch` with array of {assetId, price}, **Then** all prices are updated with current timestamp

## Tasks / Subtasks

- [x] Task 1: Update Asset Model with Price Fields (AC: #1, #2, #3)
  - [x] Add `currentPrice` and `priceUpdatedAt` fields to Asset model in `backend/prisma/schema.prisma`
  - [x] Run `pnpm prisma migrate dev` to create migration
  - [x] Run `pnpm prisma generate` to update client types

- [x] Task 2: Create Price Zod Validation Schemas (AC: #1, #4)
  - [x] Create `backend/src/validations/price.ts`
  - [x] Define `updatePriceSchema` with price validation (positive, 2 decimals)
  - [x] Define `batchUpdatePricesSchema` for array of {assetId, price}
  - [x] Define `priceParamsSchema` for route params validation

- [x] Task 3: Create Portfolio Service (AC: #2, #3)
  - [x] Create `backend/src/services/portfolioService.ts`
  - [x] Implement `getSummary(userId)` - calculates value per asset and total portfolio value
  - [x] Add calculations: value = quantity × currentPrice
  - [x] Include priceUpdatedAt with each asset
  - [x] Add unit tests in `backend/src/services/portfolioService.test.ts`

- [ ] Task 4: Create Price Routes (AC: #1, #4)
  - [ ] Create `backend/src/routes/prices.ts`
  - [ ] Implement `PUT /api/prices/:assetId` - update single asset price
  - [ ] Implement `PUT /api/prices/batch` - update multiple asset prices atomically
  - [ ] Add validation middleware for request body and params
  - [ ] Register routes in `backend/src/index.ts`
  - [ ] Add route tests in `backend/src/routes/prices.test.ts`

- [ ] Task 5: Create Portfolio Routes (AC: #2, #3)
  - [ ] Create `backend/src/routes/portfolio.ts`
  - [ ] Implement `GET /api/portfolio/summary` - get portfolio valuation with all position details
  - [ ] Register routes in `backend/src/index.ts`
  - [ ] Add route tests in `backend/src/routes/portfolio.test.ts`

- [ ] Task 6: Integration Testing
  - [ ] Test full flow: create asset → add holding → update price → get summary
  - [ ] Test valuation calculation accuracy (quantity × price)
  - [ ] Test totalValue aggregation
  - [ ] Test batch price updates are atomic (all succeed or all fail)
  - [ ] Test price precision (2 decimals)
  - [ ] Test asset not found error
  - [ ] Test unauthorized access (wrong user's asset)
  - [ ] Test priceUpdatedAt timestamp accuracy

## Dev Notes

### Database Schema Changes (Prisma)

Add to `backend/prisma/schema.prisma` - **Asset model**:

```prisma
model Asset {
  id               String   @id @default(cuid())
  ticker           String
  name             String
  category         AssetCategory
  targetPercentage Decimal? @db.Decimal(5, 2)  // Existing field

  // NEW FIELDS for Story 3.2
  currentPrice     Decimal? @db.Decimal(18, 2)  // 2 decimals for currency
  priceUpdatedAt   DateTime?                     // Tracks price freshness

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  // Relations
  userId   String
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  holding  Holding?

  @@unique([userId, ticker])
  @@index([userId])
}
```

**Why Decimal(18, 2)?**
- 18 total digits supports very high-priced assets (e.g., BTC at $100,000)
- 2 decimal precision matches currency standards
- Consistent with financial calculation requirements

### API Contracts

#### PUT /api/prices/:assetId

**Request Body:**
```json
{
  "price": 450.75
}
```

**Response (200) - Price Updated:**
```json
{
  "data": {
    "id": "clx...",
    "ticker": "VOO",
    "name": "Vanguard S&P 500 ETF",
    "category": "ETF",
    "currentPrice": "450.75",
    "priceUpdatedAt": "2026-01-09T15:30:00.000Z",
    "targetPercentage": "60.00"
  },
  "message": "Price updated"
}
```

**Error Responses:**

- **400 Validation Error** (price <= 0):
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Price must be greater than 0",
  "details": { "field": "price", "value": -10 }
}
```

- **404 Not Found** (asset doesn't exist or belongs to different user):
```json
{
  "error": "NOT_FOUND",
  "message": "Asset not found"
}
```

#### PUT /api/prices/batch

**Request Body:**
```json
{
  "prices": [
    { "assetId": "clx1...", "price": 450.75 },
    { "assetId": "clx2...", "price": 85.30 },
    { "assetId": "clx3...", "price": 42000.00 }
  ]
}
```

**Response (200) - Batch Update Success:**
```json
{
  "data": {
    "updated": 3,
    "assets": [
      {
        "id": "clx1...",
        "ticker": "VOO",
        "currentPrice": "450.75",
        "priceUpdatedAt": "2026-01-09T15:30:00.000Z"
      },
      {
        "id": "clx2...",
        "ticker": "GLD",
        "currentPrice": "85.30",
        "priceUpdatedAt": "2026-01-09T15:30:00.000Z"
      },
      {
        "id": "clx3...",
        "ticker": "BTC",
        "currentPrice": "42000.00",
        "priceUpdatedAt": "2026-01-09T15:30:00.000Z"
      }
    ]
  },
  "message": "3 prices updated"
}
```

**Error Responses:**

- **400 Validation Error** (invalid price in batch):
```json
{
  "error": "VALIDATION_ERROR",
  "message": "All prices must be greater than 0",
  "details": {
    "invalidPrices": [
      { "assetId": "clx2...", "price": -5, "reason": "Negative price" }
    ]
  }
}
```

- **404 Not Found** (any asset doesn't exist or belongs to different user):
```json
{
  "error": "NOT_FOUND",
  "message": "One or more assets not found",
  "details": {
    "notFound": ["clx2..."]
  }
}
```

#### GET /api/portfolio/summary

**Response (200):**
```json
{
  "data": {
    "totalValue": "10350.50",
    "positions": [
      {
        "assetId": "clx1...",
        "ticker": "VOO",
        "name": "Vanguard S&P 500 ETF",
        "category": "ETF",
        "quantity": "10.5",
        "currentPrice": "450.75",
        "value": "4732.88",
        "targetPercentage": "60.00",
        "priceUpdatedAt": "2026-01-09T15:30:00.000Z"
      },
      {
        "assetId": "clx2...",
        "ticker": "GLD",
        "name": "SPDR Gold Trust",
        "category": "ETF",
        "quantity": "50",
        "currentPrice": "85.30",
        "value": "4265.00",
        "targetPercentage": "30.00",
        "priceUpdatedAt": "2026-01-08T10:15:00.000Z"
      },
      {
        "assetId": "clx3...",
        "ticker": "BTC",
        "name": "Bitcoin",
        "category": "Crypto",
        "quantity": "0.03",
        "currentPrice": "42000.00",
        "value": "1260.00",
        "targetPercentage": "10.00",
        "priceUpdatedAt": "2026-01-09T14:45:00.000Z"
      }
    ]
  }
}
```

**Special Cases:**

- **Holdings without prices** (currentPrice is null):
```json
{
  "assetId": "clx4...",
  "ticker": "CASH",
  "quantity": "1000",
  "currentPrice": null,
  "value": "0",
  "priceUpdatedAt": null
}
```

- **Assets without holdings** (not included in positions array)

- **Empty portfolio** (no holdings):
```json
{
  "data": {
    "totalValue": "0",
    "positions": []
  }
}
```

### Zod Validation Schemas

```typescript
// backend/src/validations/price.ts
import { z } from 'zod'

// Price validation: positive number, rounded to 2 decimals
export const priceSchema = z.coerce
  .number()
  .positive('Price must be greater than 0')
  .transform(val => Math.round(val * 100) / 100)

// Single price update
export const updatePriceSchema = z.object({
  price: priceSchema,
})

// Batch price update
export const batchUpdatePricesSchema = z.object({
  prices: z.array(
    z.object({
      assetId: z.string().min(1, 'Asset ID is required'),
      price: priceSchema,
    })
  ).min(1, 'At least one price update is required'),
})

// Route params
export const priceParamsSchema = z.object({
  assetId: z.string().min(1, 'Asset ID is required'),
})

export type UpdatePriceInput = z.infer<typeof updatePriceSchema>
export type BatchUpdatePricesInput = z.infer<typeof batchUpdatePricesSchema>
```

### Service Implementation Pattern

```typescript
// backend/src/services/portfolioService.ts
import { prisma } from '@/config/database'
import { Errors } from '@/lib/errors'

export const portfolioService = {
  /**
   * Get portfolio summary with valuation
   * Returns positions (assets with holdings) and total portfolio value
   */
  async getSummary(userId: string) {
    // Get all holdings with asset details
    const holdings = await prisma.holding.findMany({
      where: { userId },
      include: {
        asset: {
          select: {
            id: true,
            ticker: true,
            name: true,
            category: true,
            targetPercentage: true,
            currentPrice: true,
            priceUpdatedAt: true,
          },
        },
      },
      orderBy: { asset: { ticker: 'asc' } },
    })

    // Calculate positions with values
    const positions = holdings.map(holding => {
      const quantity = Number(holding.quantity)
      const currentPrice = holding.asset.currentPrice
        ? Number(holding.asset.currentPrice)
        : null

      // value = quantity × currentPrice (or 0 if price not set)
      const value = currentPrice !== null
        ? Math.round(quantity * currentPrice * 100) / 100
        : 0

      return {
        assetId: holding.asset.id,
        ticker: holding.asset.ticker,
        name: holding.asset.name,
        category: holding.asset.category,
        quantity: holding.quantity.toString(),
        currentPrice: currentPrice !== null ? currentPrice.toFixed(2) : null,
        value: value.toFixed(2),
        targetPercentage: holding.asset.targetPercentage
          ? Number(holding.asset.targetPercentage).toFixed(2)
          : null,
        priceUpdatedAt: holding.asset.priceUpdatedAt,
      }
    })

    // Calculate total portfolio value
    const totalValue = positions.reduce(
      (sum, pos) => sum + parseFloat(pos.value),
      0
    )

    return {
      totalValue: totalValue.toFixed(2),
      positions,
    }
  },
}
```

### Price Update Service Pattern

```typescript
// backend/src/services/priceService.ts (NEW FILE)
import { prisma } from '@/config/database'
import { Errors } from '@/lib/errors'
import { UpdatePriceInput, BatchUpdatePricesInput } from '@/validations/price'

export const priceService = {
  /**
   * Update price for a single asset
   * Verifies asset ownership before updating
   */
  async updatePrice(userId: string, assetId: string, data: UpdatePriceInput) {
    // Verify asset exists and belongs to user
    const asset = await prisma.asset.findFirst({
      where: { id: assetId, userId },
    })

    if (!asset) {
      throw Errors.notFound('Asset')
    }

    // Update price with current timestamp
    return prisma.asset.update({
      where: { id: assetId },
      data: {
        currentPrice: data.price,
        priceUpdatedAt: new Date(),
      },
    })
  },

  /**
   * Batch update prices for multiple assets
   * Uses transaction for atomic operation
   */
  async batchUpdatePrices(userId: string, data: BatchUpdatePricesInput) {
    const { prices } = data
    const assetIds = prices.map(p => p.assetId)

    // Verify all assets exist and belong to user
    const assets = await prisma.asset.findMany({
      where: {
        id: { in: assetIds },
        userId,
      },
      select: { id: true },
    })

    if (assets.length !== prices.length) {
      const foundIds = assets.map(a => a.id)
      const notFound = assetIds.filter(id => !foundIds.includes(id))
      throw Errors.notFound('One or more assets not found', { notFound })
    }

    // Update all prices atomically
    const timestamp = new Date()
    const updates = await prisma.$transaction(
      prices.map(({ assetId, price }) =>
        prisma.asset.update({
          where: { id: assetId },
          data: {
            currentPrice: price,
            priceUpdatedAt: timestamp,
          },
          select: {
            id: true,
            ticker: true,
            currentPrice: true,
            priceUpdatedAt: true,
          },
        })
      )
    )

    return {
      updated: updates.length,
      assets: updates,
    }
  },
}
```

### Route Implementation Pattern

```typescript
// backend/src/routes/prices.ts (NEW FILE)
import { Router } from 'express'
import { priceService } from '@/services/priceService'
import { validate } from '@/middleware/validate'
import {
  updatePriceSchema,
  batchUpdatePricesSchema,
  priceParamsSchema,
} from '@/validations/price'

const router = Router()

// PUT /api/prices/:assetId - Update single asset price
router.put(
  '/:assetId',
  validate({ body: updatePriceSchema, params: priceParamsSchema }),
  async (req, res) => {
    const { assetId } = req.params
    const asset = await priceService.updatePrice(req.user!.id, assetId, req.body)
    res.json({ data: asset, message: 'Price updated' })
  }
)

// PUT /api/prices/batch - Update multiple prices atomically
router.put(
  '/batch',
  validate({ body: batchUpdatePricesSchema }),
  async (req, res) => {
    const result = await priceService.batchUpdatePrices(req.user!.id, req.body)
    res.json({
      data: result,
      message: `${result.updated} prices updated`,
    })
  }
)

export default router
```

```typescript
// backend/src/routes/portfolio.ts (NEW FILE)
import { Router } from 'express'
import { portfolioService } from '@/services/portfolioService'

const router = Router()

// GET /api/portfolio/summary - Get portfolio valuation
router.get('/summary', async (req, res) => {
  const summary = await portfolioService.getSummary(req.user!.id)
  res.json({ data: summary })
})

export default router
```

### Project Structure Notes

**Files to create:**
```
backend/src/
├── validations/
│   └── price.ts              # Zod schemas for prices
├── services/
│   ├── priceService.ts       # Price update logic (NEW)
│   ├── priceService.test.ts
│   ├── portfolioService.ts   # Portfolio valuation logic (NEW)
│   └── portfolioService.test.ts
└── routes/
    ├── prices.ts             # Price update routes (NEW)
    ├── prices.test.ts
    ├── portfolio.ts          # Portfolio summary routes (NEW)
    └── portfolio.test.ts
```

**Files to modify:**
```
backend/
├── prisma/
│   └── schema.prisma         # Add currentPrice + priceUpdatedAt to Asset
└── src/
    └── index.ts              # Register prices and portfolio routes
```

### Testing Strategy

**Unit Tests (priceService.test.ts):**
- `updatePrice` updates price with current timestamp
- `updatePrice` throws notFound for non-existent asset
- `updatePrice` throws notFound for other user's asset
- `updatePrice` rounds price to 2 decimals
- `batchUpdatePrices` updates all prices atomically
- `batchUpdatePrices` throws notFound if any asset doesn't exist
- `batchUpdatePrices` validates all prices are positive

**Unit Tests (portfolioService.test.ts):**
- `getSummary` returns empty portfolio when no holdings
- `getSummary` calculates value = quantity × currentPrice correctly
- `getSummary` returns value = 0 when currentPrice is null
- `getSummary` calculates totalValue as sum of all position values
- `getSummary` includes all asset details (ticker, name, category)
- `getSummary` includes priceUpdatedAt timestamp
- `getSummary` orders positions by ticker alphabetically

**Integration Tests (prices.integration.test.ts):**
- `PUT /api/prices/:assetId` returns 401 without auth
- `PUT /api/prices/:assetId` updates price with valid data
- `PUT /api/prices/:assetId` returns 400 for price <= 0
- `PUT /api/prices/:assetId` returns 404 for non-existent asset
- `PUT /api/prices/:assetId` returns 404 for other user's asset
- `PUT /api/prices/:assetId` rounds price to 2 decimals
- `PUT /api/prices/batch` updates all prices atomically
- `PUT /api/prices/batch` returns 404 if any asset doesn't belong to user
- `PUT /api/prices/batch` rolls back all updates if one fails

**Integration Tests (portfolio.integration.test.ts):**
- `GET /api/portfolio/summary` returns 401 without auth
- `GET /api/portfolio/summary` returns empty portfolio for new user
- `GET /api/portfolio/summary` calculates values correctly
- `GET /api/portfolio/summary` includes all position details
- `GET /api/portfolio/summary` calculates totalValue correctly
- `GET /api/portfolio/summary` handles assets without prices (value = 0)
- `GET /api/portfolio/summary` excludes assets without holdings

### Previous Story Learnings

**From Story 3.1 (Holdings Management API):**
- Use Decimal(18, 8) for quantity precision - here we use Decimal(18, 2) for prices (currency standard)
- Upsert pattern works well - not needed here, Asset model is already created
- Always verify asset ownership with `findFirst({ id, userId })`
- Use `Errors.notFound()`, `Errors.forbidden()` from `@/lib/errors`
- Response format: `{ data: T, message?: string }`
- All endpoints require authentication via JWT middleware
- Prisma returns Decimal as string in JSON - frontend must parse with `Number()`

**From Story 2.1 & 2.2 (Asset API):**
- Batch operations require `prisma.$transaction()` for atomicity
- Validation middleware pattern: `validate({ body, params })`
- Error handling via centralized middleware
- User isolation: always filter by `userId` from JWT
- Route registration: add to index.ts with `requireAuth` middleware

**From Git Analysis (commit 358d21e):**
- 59 new tests added in story 3.1 (19 validation, 12 service, 14 route unit, 14 integration)
- Co-located tests: `*.test.ts` next to source files
- Integration tests check DATABASE_URL before running (CI-friendly)
- Service methods return holding object directly (no wrapper objects)

### Critical Implementation Rules

1. **Price Precision:** Use `Decimal(18, 2)` for prices - 2 decimals for currency standards

2. **Timestamp Handling:** Set `priceUpdatedAt` to `new Date()` on every price update

3. **Atomic Batch Updates:** Use `prisma.$transaction()` for batch price updates - all succeed or all fail

4. **Asset Ownership:** ALWAYS verify asset belongs to user before updating price

5. **Null Price Handling:** If `currentPrice` is null, position value should be 0 (not error)

6. **Value Calculation:** value = Math.round(quantity × currentPrice × 100) / 100 (2 decimal precision)

7. **Error Handling:** Use `Errors` utility - never throw raw `Error`

8. **Route Registration:** Add to index.ts:
   - `router.use('/prices', requireAuth, pricesRouter)`
   - `router.use('/portfolio', requireAuth, portfolioRouter)`

9. **Response Consistency:** Include asset details in all price responses

10. **Batch Order:** Define `/batch` route BEFORE `/:assetId` to avoid route conflicts

### Anti-Patterns to Avoid

```typescript
// ❌ WRONG - Don't store price as Float
currentPrice Float

// ✅ CORRECT - Use Decimal with 2 decimal precision
currentPrice Decimal @db.Decimal(18, 2)

// ❌ WRONG - Don't calculate value in frontend
const value = quantity * currentPrice

// ✅ CORRECT - Calculate in backend service
const value = Math.round(quantity * currentPrice * 100) / 100

// ❌ WRONG - Don't ignore null prices
if (!currentPrice) throw Errors.validation('Price is required')

// ✅ CORRECT - Handle null prices gracefully
const value = currentPrice !== null ? quantity * currentPrice : 0

// ❌ WRONG - Don't update prices individually in loop
for (const { assetId, price } of prices) {
  await prisma.asset.update({ where: { id: assetId }, data: { currentPrice: price } })
}

// ✅ CORRECT - Use transaction for atomic batch updates
await prisma.$transaction(
  prices.map(({ assetId, price }) =>
    prisma.asset.update({ where: { id: assetId }, data: { currentPrice: price } })
  )
)

// ❌ WRONG - Don't verify ownership after update
await prisma.asset.update({ where: { id: assetId }, data: { currentPrice: price } })

// ✅ CORRECT - Verify ownership before update
const asset = await prisma.asset.findFirst({ where: { id: assetId, userId } })
if (!asset) throw Errors.notFound('Asset')
await prisma.asset.update({ where: { id: assetId }, data: { currentPrice: price } })
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.2-Price-Update-Portfolio-Valuation]
- [Source: _bmad-output/planning-artifacts/architecture.md#API-Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data-Architecture]
- [Source: _bmad-output/planning-artifacts/prd.md#FR8-FR11]
- [Source: _bmad-output/implementation-artifacts/3-1-holdings-management-api.md]
- [Source: backend/prisma/schema.prisma]
- [Source: backend/src/services/assetService.ts]
- [Source: backend/src/services/holdingService.ts]
- [Source: BACKEND_PATTERNS.md]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (Anthropic)

### Debug Log References

N/A - Story file created, awaiting implementation

### Completion Notes List

- Task 1: Added currentPrice (Decimal 18,2) and priceUpdatedAt (DateTime?) fields to Asset model. Migration 20260109220727_add_price_fields created and applied. All 206 existing tests pass.
- Task 2: Created Zod validation schemas for price operations. priceSchema rounds to 2 decimals, updatePriceSchema for single updates, batchUpdatePricesSchema for batch operations. 33 new tests added.
- Task 3: Created portfolioService with getSummary method. Calculates position values (quantity × price), totalValue, handles null prices. 12 new tests added.

### File List

- backend/prisma/schema.prisma (modified)
- backend/prisma/migrations/20260109220727_add_price_fields/migration.sql (new)
- backend/src/validations/price.ts (new)
- backend/src/validations/price.test.ts (new)
- backend/src/services/portfolioService.ts (new)
- backend/src/services/portfolioService.test.ts (new)
