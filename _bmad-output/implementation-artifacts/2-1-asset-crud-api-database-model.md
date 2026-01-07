# Story 2.1: Asset CRUD API & Database Model

Status: in-progress

## Story

As a **user**,
I want **to create, read, update and delete assets in my portfolio**,
so that **I can define which investments I'm tracking**.

## Acceptance Criteria

1. **Given** I am authenticated, **When** I POST to `/api/assets` with ticker, name, and category (ETF/FCI/Crypto/Cash), **Then** a new asset is created and returned with its ID

2. **Given** I have assets in my portfolio, **When** I GET `/api/assets`, **Then** I receive a list of all my assets with their details

3. **Given** an existing asset, **When** I PUT to `/api/assets/:id` with updated data, **Then** the asset is updated and the new data is returned

4. **Given** an existing asset, **When** I DELETE `/api/assets/:id`, **Then** the asset is removed from my portfolio

5. **Given** I try to create an asset with duplicate ticker, **When** I POST to `/api/assets`, **Then** I receive a 400 validation error

## Tasks / Subtasks

- [x] Task 1: Prisma Schema Update (AC: #1, #2, #3, #4)
  - [x] Add Asset model to `backend/prisma/schema.prisma`
  - [x] Add AssetCategory enum (ETF, FCI, CRYPTO, CASH)
  - [x] Add relation to User model (userId foreign key)
  - [x] Add unique constraint on (userId, ticker) combination
  - [x] Run `pnpm prisma migrate dev --name add-asset-model`
  - [x] Run `pnpm prisma generate`

- [x] Task 2: Zod Validation Schemas (AC: #1, #3, #5)
  - [x] Create `backend/src/validations/asset.ts`
  - [x] Define `createAssetSchema` with ticker, name, category validation
  - [x] Define `updateAssetSchema` for partial updates
  - [x] Export schemas for route middleware

- [x] Task 3: Asset Service Layer (AC: #1, #2, #3, #4, #5)
  - [x] Create `backend/src/services/assetService.ts`
  - [x] Implement `create(userId, data)` - check duplicate ticker
  - [x] Implement `list(userId)` - return all user's assets
  - [x] Implement `getById(userId, assetId)` - with ownership check
  - [x] Implement `update(userId, assetId, data)` - with ownership check
  - [x] Implement `delete(userId, assetId)` - with ownership check

- [x] Task 4: Asset Routes (AC: #1, #2, #3, #4, #5)
  - [x] Create `backend/src/routes/assets.ts`
  - [x] POST `/api/assets` - create asset
  - [x] GET `/api/assets` - list assets
  - [x] GET `/api/assets/:id` - get single asset
  - [x] PUT `/api/assets/:id` - update asset
  - [x] DELETE `/api/assets/:id` - delete asset
  - [x] Register routes in `backend/src/index.ts` (with authMiddleware)

- [ ] Task 5: Tests (AC: #1, #2, #3, #4, #5)
  - [ ] Create `backend/src/services/assetService.test.ts`
  - [ ] Test create with valid data
  - [ ] Test create with duplicate ticker returns error
  - [ ] Test list returns only user's assets
  - [ ] Test update with valid data
  - [ ] Test delete removes asset
  - [ ] Test ownership validation (can't access other user's assets)

## Dev Notes

### Critical Architecture Patterns

**Database Schema (Prisma):**
```prisma
model Asset {
  id               String        @id @default(cuid())
  ticker           String
  name             String
  category         AssetCategory
  targetPercentage Decimal       @default(0)
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
  
  // Relations
  userId           String
  user             User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Constraints
  @@unique([userId, ticker])  // Same user can't have duplicate tickers
  @@index([userId])
}

enum AssetCategory {
  ETF
  FCI
  CRYPTO
  CASH
}
```

**Note:** Add `assets Asset[]` relation to existing User model.

**Zod Validation Schema:**
```typescript
// backend/src/validations/asset.ts
import { z } from 'zod'

export const assetCategorySchema = z.enum(['ETF', 'FCI', 'CRYPTO', 'CASH'])

export const createAssetSchema = z.object({
  ticker: z.string().min(1).max(20).toUpperCase(),
  name: z.string().min(1).max(100),
  category: assetCategorySchema,
})

export const updateAssetSchema = createAssetSchema.partial()

export type CreateAssetInput = z.infer<typeof createAssetSchema>
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>
```

**Service Pattern:**
```typescript
// backend/src/services/assetService.ts
import { prisma } from '@/config/database'
import { Errors } from '@/lib/errors'
import type { CreateAssetInput, UpdateAssetInput } from '@/validations/asset'

export const assetService = {
  async create(userId: string, data: CreateAssetInput) {
    // Check for duplicate ticker for this user
    const existing = await prisma.asset.findFirst({
      where: { userId, ticker: data.ticker }
    })
    if (existing) {
      throw Errors.validation('Asset with this ticker already exists', { ticker: data.ticker })
    }
    
    return prisma.asset.create({
      data: { ...data, userId }
    })
  },

  async list(userId: string) {
    return prisma.asset.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    })
  },

  async getById(userId: string, id: string) {
    const asset = await prisma.asset.findFirst({
      where: { id, userId }
    })
    if (!asset) {
      throw Errors.notFound('Asset')
    }
    return asset
  },

  async update(userId: string, id: string, data: UpdateAssetInput) {
    await this.getById(userId, id) // Verify ownership
    
    // If updating ticker, check for duplicates
    if (data.ticker) {
      const existing = await prisma.asset.findFirst({
        where: { userId, ticker: data.ticker, NOT: { id } }
      })
      if (existing) {
        throw Errors.validation('Asset with this ticker already exists', { ticker: data.ticker })
      }
    }
    
    return prisma.asset.update({
      where: { id },
      data
    })
  },

  async delete(userId: string, id: string) {
    await this.getById(userId, id) // Verify ownership
    return prisma.asset.delete({ where: { id } })
  }
}
```

**Route Pattern:**
```typescript
// backend/src/routes/assets.ts
import { Router } from 'express'
import { assetService } from '@/services/assetService'
import { validate } from '@/middleware/validate'
import { createAssetSchema, updateAssetSchema } from '@/validations/asset'

const router = Router()

router.post('/', validate(createAssetSchema), async (req, res) => {
  const asset = await assetService.create(req.user!.id, req.body)
  res.status(201).json({ data: asset })
})

router.get('/', async (req, res) => {
  const assets = await assetService.list(req.user!.id)
  res.json({ data: assets })
})

router.get('/:id', async (req, res) => {
  const asset = await assetService.getById(req.user!.id, req.params.id)
  res.json({ data: asset })
})

router.put('/:id', validate(updateAssetSchema), async (req, res) => {
  const asset = await assetService.update(req.user!.id, req.params.id, req.body)
  res.json({ data: asset })
})

router.delete('/:id', async (req, res) => {
  await assetService.delete(req.user!.id, req.params.id)
  res.status(204).send()
})

export default router
```

**Register in routes/index.ts:**
```typescript
import assetRoutes from './assets'

// In the router setup
router.use('/assets', authMiddleware, assetRoutes)
```

### API Response Format

**Success (Create):**
```json
{
  "data": {
    "id": "clx...",
    "ticker": "VOO",
    "name": "Vanguard S&P 500 ETF",
    "category": "ETF",
    "targetPercentage": "0",
    "createdAt": "2026-01-07T12:00:00.000Z",
    "updatedAt": "2026-01-07T12:00:00.000Z",
    "userId": "clx..."
  }
}
```

**Error (Validation):**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Asset with this ticker already exists",
  "details": { "ticker": "VOO" }
}
```

### Project Structure Notes

Files to create/modify:
```
backend/
├── prisma/
│   └── schema.prisma           # Add Asset model + AssetCategory enum
├── src/
│   ├── routes/
│   │   ├── index.ts            # Register asset routes
│   │   └── assets.ts           # NEW: Asset CRUD routes
│   ├── services/
│   │   ├── assetService.ts     # NEW: Asset business logic
│   │   └── assetService.test.ts # NEW: Asset service tests
│   └── validations/
│       └── asset.ts            # NEW: Zod schemas
```

### Testing Standards

Use Vitest with the existing test setup:
```typescript
// backend/src/services/assetService.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { assetService } from './assetService'
// Mock prisma client or use test database
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-2-Portfolio-Configuration]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.1-Asset-CRUD-API]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data-Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#API-Naming]
- [Source: _bmad-output/planning-artifacts/architecture.md#Error-Handling-Backend]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4 (claude-sonnet-4-20250514)

### Debug Log References

### Completion Notes List

- ✅ Task 1: Prisma Schema Update - Added Asset model with AssetCategory enum, relation to User, unique constraint on (userId, ticker), and index on userId. Migration `20260107183904_add_asset_model` applied successfully.
- ✅ Task 2: Zod Validation Schemas - Created assetCategorySchema, createAssetSchema, updateAssetSchema with proper validations (ticker uppercase transform, length limits). 17 unit tests added.
- ✅ Task 3: Asset Service Layer - Implemented assetService with create, list, getById, update, delete methods. All include ownership verification and duplicate ticker validation.
- ✅ Task 4: Asset Routes - Created CRUD routes (POST, GET, GET/:id, PUT/:id, DELETE/:id) with validation middleware. Routes protected with authMiddleware.

### File List

- `backend/prisma/schema.prisma` (modified)
- `backend/prisma/migrations/20260107183904_add_asset_model/migration.sql` (new)
- `backend/src/validations/asset.ts` (new)
- `backend/src/validations/asset.test.ts` (new)
- `backend/src/services/assetService.ts` (new)
- `backend/src/routes/assets.ts` (new)
- `backend/src/index.ts` (modified)

