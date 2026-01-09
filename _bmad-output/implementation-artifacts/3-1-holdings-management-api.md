# Story 3.1: Holdings Management API

Status: review

## Story

As a **user**,
I want **to register and update the quantity I hold of each asset**,
so that **I can track my actual positions**.

## Acceptance Criteria

1. **Given** I have an asset in my portfolio, **When** I PUT to `/api/holdings/:assetId` with quantity, **Then** the holding is created or updated for that asset

2. **Given** I have holdings registered, **When** I GET `/api/holdings`, **Then** I receive all my holdings with assetId, quantity, and last update date

3. **Given** I update a holding, **When** the quantity is 0 or negative, **Then** I receive a validation error

4. **Given** I have holdings for multiple assets, **When** I GET `/api/holdings`, **Then** each holding includes the related asset details (ticker, name, category)

## Tasks / Subtasks

- [x] Task 1: Create Holding Database Model (AC: #1, #2, #4)
  - [x] Add Holding model to `backend/prisma/schema.prisma`
  - [x] Add relation to Asset model (one-to-one)
  - [x] Add relation to User model
  - [x] Run `pnpm prisma migrate dev` to create migration
  - [x] Run `pnpm prisma generate` to update client types

- [x] Task 2: Create Holding Zod Validation Schemas (AC: #1, #3)
  - [x] Create `backend/src/validations/holding.ts`
  - [x] Define `createOrUpdateHoldingSchema` with quantity validation (positive number)
  - [x] Define `holdingParamsSchema` for route params validation

- [x] Task 3: Create Holding Service (AC: #1, #2, #3, #4)
  - [x] Create `backend/src/services/holdingService.ts`
  - [x] Implement `getHoldings(userId)` - returns all holdings with asset details
  - [x] Implement `createOrUpdateHolding(userId, assetId, quantity)` - upsert logic
  - [x] Validate asset belongs to user before creating/updating
  - [x] Add unit tests in `backend/src/services/holdingService.test.ts`

- [x] Task 4: Create Holding Routes (AC: #1, #2, #3, #4)
  - [x] Create `backend/src/routes/holdings.ts`
  - [x] Implement `GET /api/holdings` - list all holdings for user
  - [x] Implement `PUT /api/holdings/:assetId` - create or update holding
  - [x] Add validation middleware for request body and params
  - [x] Register routes in `backend/src/index.ts`
  - [x] Add route tests in `backend/src/routes/holdings.test.ts`

- [x] Task 5: Integration Testing
  - [x] Test full flow: create asset → create holding → get holdings
  - [x] Test validation errors for invalid quantity
  - [x] Test holding update (existing holding)
  - [x] Test holdings include asset details
  - [x] Test asset not found error
  - [x] Test unauthorized access (wrong user's asset)

## Dev Notes

### Database Schema (Prisma)

Add to `backend/prisma/schema.prisma`:

```prisma
model Holding {
  id        String   @id @default(cuid())
  quantity  Decimal  @db.Decimal(18, 8)  // Supports fractional shares/crypto
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  userId  String
  user    User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  assetId String @unique  // One holding per asset (enforces uniqueness)
  asset   Asset  @relation(fields: [assetId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

**Update User model** - add holdings relation:
```prisma
model User {
  // ... existing fields
  holdings Holding[]
}
```

**Update Asset model** - add holding relation:
```prisma
model Asset {
  // ... existing fields
  holding Holding?  // Optional one-to-one relation
}
```

### API Contracts

#### GET /api/holdings

**Response (200):**
```json
{
  "data": [
    {
      "id": "clx...",
      "quantity": "10.5",
      "assetId": "clx...",
      "createdAt": "2026-01-08T...",
      "updatedAt": "2026-01-08T...",
      "asset": {
        "id": "clx...",
        "ticker": "VOO",
        "name": "Vanguard S&P 500 ETF",
        "category": "ETF"
      }
    }
  ]
}
```

#### PUT /api/holdings/:assetId

**Request Body:**
```json
{
  "quantity": 10.5
}
```

**Response (200) - Created or Updated:**
```json
{
  "data": {
    "id": "clx...",
    "quantity": "10.5",
    "assetId": "clx...",
    "createdAt": "2026-01-08T...",
    "updatedAt": "2026-01-08T...",
    "asset": {
      "id": "clx...",
      "ticker": "VOO",
      "name": "Vanguard S&P 500 ETF",
      "category": "ETF"
    }
  },
  "message": "Holding created" | "Holding updated"
}
```

**Error Responses:**

- **400 Validation Error** (quantity <= 0):
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Quantity must be greater than 0",
  "details": { "field": "quantity", "value": -5 }
}
```

- **404 Not Found** (asset doesn't exist):
```json
{
  "error": "NOT_FOUND",
  "message": "Asset not found"
}
```

- **403 Forbidden** (asset belongs to different user):
```json
{
  "error": "FORBIDDEN",
  "message": "Access denied"
}
```

### Zod Validation Schemas

```typescript
// backend/src/validations/holding.ts
import { z } from 'zod'

export const createOrUpdateHoldingSchema = z.object({
  quantity: z.coerce.number()
    .positive('Quantity must be greater than 0')
})

export const holdingParamsSchema = z.object({
  assetId: z.string().min(1, 'Asset ID is required')
})

export type CreateOrUpdateHoldingInput = z.infer<typeof createOrUpdateHoldingSchema>
```

### Service Implementation Pattern

```typescript
// backend/src/services/holdingService.ts
import { prisma } from '@/config/database'
import { Errors } from '@/lib/errors'

export const holdingService = {
  async getHoldings(userId: string) {
    return prisma.holding.findMany({
      where: { userId },
      include: {
        asset: {
          select: {
            id: true,
            ticker: true,
            name: true,
            category: true,
          },
        },
      },
      orderBy: { asset: { ticker: 'asc' } },
    })
  },

  async createOrUpdateHolding(userId: string, assetId: string, quantity: number) {
    // Verify asset exists and belongs to user
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
    })

    if (!asset) {
      throw Errors.notFound('Asset')
    }

    if (asset.userId !== userId) {
      throw Errors.forbidden()
    }

    // Upsert holding
    const holding = await prisma.holding.upsert({
      where: { assetId },
      create: {
        userId,
        assetId,
        quantity,
      },
      update: {
        quantity,
      },
      include: {
        asset: {
          select: {
            id: true,
            ticker: true,
            name: true,
            category: true,
          },
        },
      },
    })

    return holding
  },
}
```

### Route Implementation Pattern

```typescript
// backend/src/routes/holdings.ts
import { Router } from 'express'
import { holdingService } from '@/services/holdingService'
import { validate } from '@/middleware/validate'
import { createOrUpdateHoldingSchema, holdingParamsSchema } from '@/validations/holding'

const router = Router()

// GET /api/holdings - List all holdings
router.get('/', async (req, res) => {
  const holdings = await holdingService.getHoldings(req.user!.id)
  res.json({ data: holdings })
})

// PUT /api/holdings/:assetId - Create or update holding
router.put(
  '/:assetId',
  validate({ body: createOrUpdateHoldingSchema, params: holdingParamsSchema }),
  async (req, res) => {
    const { assetId } = req.params
    const { quantity } = req.body

    const existing = await prisma.holding.findUnique({
      where: { assetId },
    })

    const holding = await holdingService.createOrUpdateHolding(
      req.user!.id,
      assetId,
      quantity
    )

    res.json({
      data: holding,
      message: existing ? 'Holding updated' : 'Holding created',
    })
  }
)

export default router
```

### Project Structure Notes

**Files to create:**
```
backend/src/
├── validations/
│   └── holding.ts           # Zod schemas for holdings
├── services/
│   ├── holdingService.ts    # Business logic
│   └── holdingService.test.ts
└── routes/
    ├── holdings.ts          # Route handlers
    └── holdings.test.ts
```

**Files to modify:**
```
backend/
├── prisma/
│   └── schema.prisma        # Add Holding model + relations
└── src/routes/
    └── index.ts             # Register holdings routes
```

### Testing Strategy

**Unit Tests (holdingService.test.ts):**
- `getHoldings` returns empty array for user with no holdings
- `getHoldings` returns holdings with asset details
- `createOrUpdateHolding` creates new holding when none exists
- `createOrUpdateHolding` updates existing holding
- `createOrUpdateHolding` throws notFound for non-existent asset
- `createOrUpdateHolding` throws forbidden for other user's asset

**Integration Tests (holdings.test.ts):**
- `GET /api/holdings` returns 401 without auth
- `GET /api/holdings` returns empty array for new user
- `GET /api/holdings` returns holdings with asset details
- `PUT /api/holdings/:assetId` creates holding with valid data
- `PUT /api/holdings/:assetId` updates existing holding
- `PUT /api/holdings/:assetId` returns 400 for quantity <= 0
- `PUT /api/holdings/:assetId` returns 404 for non-existent asset
- `PUT /api/holdings/:assetId` returns 403 for other user's asset

### Previous Story Learnings

**From Story 2.3 (Portfolio Configuration UI):**
- Backend returns Decimal fields as strings in JSON - frontend must parse with `Number()`
- Use Prisma `include` for eager loading relations
- All endpoints require authentication via JWT middleware
- Use `Errors.notFound()`, `Errors.forbidden()` from `@/lib/errors`
- Tests use Vitest with ~140 tests passing

**From Story 2.1 & 2.2 (Asset API):**
- Asset CRUD patterns established - follow same structure
- Validation middleware pattern: `validate({ body, params })`
- Response format: `{ data: T, message?: string }`
- Error handling via centralized middleware
- User isolation: always filter by `userId` from JWT

### Critical Implementation Rules

1. **Decimal Precision:** Use `Decimal(18, 8)` for quantity to support fractional shares and crypto

2. **Upsert Pattern:** Use Prisma `upsert` for create-or-update logic in one query

3. **Asset Ownership:** ALWAYS verify asset belongs to user before creating holding

4. **Response Consistency:** Include asset details in all holding responses

5. **Error Handling:** Use `Errors` utility - never throw raw `Error`

6. **Route Registration:** Add to index.ts: `router.use('/holdings', requireAuth, holdingsRouter)`

### Anti-Patterns to Avoid

```typescript
// ❌ WRONG - Don't check quantity in route
if (quantity <= 0) { return res.status(400).json(...) }

// ✅ CORRECT - Use Zod validation
const createOrUpdateHoldingSchema = z.object({
  quantity: z.coerce.number().positive()
})

// ❌ WRONG - Don't use raw Error
throw new Error('Asset not found')

// ✅ CORRECT - Use Errors utility
throw Errors.notFound('Asset')

// ❌ WRONG - Don't forget user isolation
await prisma.holding.findMany()

// ✅ CORRECT - Always filter by userId
await prisma.holding.findMany({ where: { userId } })

// ❌ WRONG - Separate create/update endpoints
POST /api/holdings
PUT /api/holdings/:id

// ✅ CORRECT - Single upsert endpoint
PUT /api/holdings/:assetId
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.1-Holdings-Management-API]
- [Source: _bmad-output/planning-artifacts/architecture.md#API-Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data-Architecture]
- [Source: _bmad-output/planning-artifacts/prd.md#FR7-FR11]
- [Source: _bmad-output/project-context.md#Backend-Patterns]
- [Source: backend/prisma/schema.prisma]
- [Source: backend/src/services/assetService.ts]
- [Source: backend/src/routes/assets.ts]
- [Source: _bmad-output/implementation-artifacts/2-3-portfolio-configuration-ui.md]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4 (Anthropic)

### Debug Log References

N/A - Implementation completed without issues

### Completion Notes List

- Task 1: Added Holding model to Prisma schema with Decimal(18,8) for high-precision quantity support. Created migration `20260109021337_add_holding_model`. One-to-one relation with Asset via unique constraint on assetId.
- Task 2: Created Zod validation schemas with `z.coerce.number().positive()` for quantity and `z.cuid2()` for assetId validation.
- Task 3: Implemented holdingService with getHoldings (ordered by ticker) and createOrUpdateHolding (upsert pattern with ownership verification).
- Task 4: Created holdings routes with proper validation middleware. Registered in index.ts with authMiddleware.
- Task 5: Created comprehensive integration tests covering full flow, validation errors, updates, asset details, and authorization.
- All 204 tests passing (59 new tests added: 19 validation, 12 service, 14 route unit, 14 integration)

### File List

**New Files:**
- backend/prisma/migrations/20260109021337_add_holding_model/migration.sql
- backend/src/validations/holding.ts
- backend/src/validations/holding.test.ts
- backend/src/services/holdingService.ts
- backend/src/services/holdingService.test.ts
- backend/src/routes/holdings.ts
- backend/src/routes/holdings.test.ts
- backend/src/routes/holdings.integration.test.ts

**Modified Files:**
- backend/prisma/schema.prisma (added Holding model, relations to User and Asset)
- backend/src/index.ts (registered holdings routes)
- _bmad-output/implementation-artifacts/sprint-status.yaml (status updated)
- _bmad-output/implementation-artifacts/3-1-holdings-management-api.md (this file)

## Change Log

- 2026-01-09: Implemented Holdings Management API - all 5 tasks completed, 204 tests passing
