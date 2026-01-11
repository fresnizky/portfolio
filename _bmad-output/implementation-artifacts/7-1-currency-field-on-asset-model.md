# Story 7.1: Currency Field on Asset Model

Status: done

## Story

As a **user**,
I want **to specify the currency for each asset**,
So that **the system knows which assets are in USD vs ARS**.

## Acceptance Criteria

1. **Given** I am creating a new asset, **When** I fill the asset form, **Then** I can select the currency (USD or ARS, default USD)

2. **Given** I have existing assets, **When** I edit an asset, **Then** I can change its currency

3. **Given** I view my assets list, **When** I look at each asset, **Then** I see the currency indicator (USD/ARS) next to the price

4. **Given** the database migration runs, **When** existing assets are migrated, **Then** all existing assets default to USD currency

## Tasks / Subtasks

- [x] Task 1: Backend - Add Currency enum and field to Prisma schema (AC: #4)
  - [x] Add `Currency` enum with values `USD`, `ARS` to `backend/prisma/schema.prisma`
  - [x] Add `currency Currency @default(USD)` field to Asset model
  - [x] Run migration: `npx prisma migrate dev --name add_currency_to_asset`
  - [x] Run `npx prisma generate` to update client types

- [x] Task 2: Backend - Update asset validation schemas (AC: #1, #2)
  - [x] Add `currencySchema` to `backend/src/validations/asset.ts`
  - [x] Add `currency` to `createAssetSchema` (required, default USD)
  - [x] Add `currency` to `updateAssetSchema` (optional)
  - [x] Write tests for validation

- [x] Task 3: Backend - Update asset service (AC: #1, #2)
  - [x] Update `assetService.create()` to accept currency
  - [x] Update `assetService.update()` to accept currency
  - [x] Update `assetService.createBatch()` for onboarding
  - [x] Write tests for service methods

- [x] Task 4: Frontend - Add Currency type and update interfaces (AC: all)
  - [x] Add `Currency` type to `frontend/src/types/api.ts`
  - [x] Add `currency` field to `Asset` interface
  - [x] Add `currency` field to `CreateAssetInput` interface
  - [x] Add `currency` field to `UpdateAssetInput` interface

- [x] Task 5: Frontend - Update asset validation schema (AC: #1, #2)
  - [x] Add `currencySchema` to `frontend/src/validations/asset.ts`
  - [x] Add `currency` to `assetFormSchema`

- [x] Task 6: Frontend - Update AssetForm component (AC: #1, #2)
  - [x] Add `currencies` array with labels
  - [x] Add currency Select dropdown after category field
  - [x] Set default value to 'USD'
  - [x] Write tests

- [x] Task 7: Frontend - Update AssetCard component (AC: #3)
  - [x] Add currency display next to price/value
  - [x] Add optional styling for currency badge
  - [x] Write tests

- [x] Task 8: Frontend - Update onboarding to include currency (AC: #1)
  - [x] Check if onboarding asset form needs currency field
  - [x] Update if necessary

- [x] Task 9: Run all tests and ensure passing
  - [x] Run `pnpm test` in backend
  - [x] Run `pnpm test` in frontend
  - [x] Fix any failing tests

## Dev Notes

### Prisma Schema Changes

```prisma
// backend/prisma/schema.prisma

// Add new enum (after AssetCategory)
enum Currency {
  USD
  ARS
}

// Update Asset model
model Asset {
  id               String        @id @default(cuid())
  ticker           String
  name             String
  category         AssetCategory
  currency         Currency      @default(USD)  // NEW FIELD
  targetPercentage Decimal       @default(0)
  currentPriceCents BigInt?
  priceUpdatedAt   DateTime?
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  userId       String
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  holding      Holding?
  transactions Transaction[]

  @@unique([userId, ticker])
  @@index([userId])
}
```

### Migration Command

```bash
cd backend
npx prisma migrate dev --name add_currency_to_asset
npx prisma generate
```

### Backend Validation Schema

```typescript
// backend/src/validations/asset.ts

import { z } from 'zod'

export const currencySchema = z.enum(['USD', 'ARS'])

export const createAssetSchema = z.object({
  ticker: z.string().trim().min(1).max(20).transform(val => val.toUpperCase()),
  name: z.string().trim().min(1).max(100),
  category: assetCategorySchema,
  currency: currencySchema.default('USD'),  // NEW - defaults to USD
})

export const updateAssetSchema = createAssetSchema.partial().extend({
  targetPercentage: targetPercentageSchema.optional(),
  currency: currencySchema.optional(),  // NEW - optional for updates
})
```

### Frontend Types

```typescript
// frontend/src/types/api.ts

export type Currency = 'USD' | 'ARS'

export interface Asset {
  id: string
  ticker: string
  name: string
  category: AssetCategory
  currency: Currency  // NEW
  targetPercentage: string
  createdAt: string
  updatedAt: string
  userId: string
}

export interface CreateAssetInput {
  ticker: string
  name: string
  category: AssetCategory
  currency?: Currency  // NEW - optional, defaults on backend
  targetPercentage?: number
}

export interface UpdateAssetInput {
  ticker?: string
  name?: string
  category?: AssetCategory
  currency?: Currency  // NEW
  targetPercentage?: number
}
```

### Frontend Validation Schema

```typescript
// frontend/src/validations/asset.ts

export const currencySchema = z.enum(['USD', 'ARS'])

export const assetFormSchema = z.object({
  ticker: z.string().trim().min(1).max(20).transform(val => val.toUpperCase()),
  name: z.string().trim().min(1).max(100),
  category: assetCategorySchema,
  currency: currencySchema.default('USD'),  // NEW
})
```

### AssetForm Component Update

```typescript
// frontend/src/features/portfolio/components/AssetForm.tsx

import type { Currency } from '@/types/api'

const currencies: { value: Currency; label: string }[] = [
  { value: 'USD', label: 'USD - Dólar' },
  { value: 'ARS', label: 'ARS - Peso Argentino' },
]

// In the form JSX, add after category Select:
<div>
  <label className="block text-sm font-medium mb-1">Moneda</label>
  <select
    {...register('currency')}
    className="w-full px-3 py-2 border rounded-md"
    defaultValue="USD"
  >
    {currencies.map((curr) => (
      <option key={curr.value} value={curr.value}>
        {curr.label}
      </option>
    ))}
  </select>
  {errors.currency && (
    <p className="text-sm text-destructive mt-1">{errors.currency.message}</p>
  )}
</div>
```

### AssetCard Component Update

```typescript
// frontend/src/features/portfolio/components/AssetCard.tsx

// Add currency styling (optional - can be simpler)
const currencySymbols: Record<Currency, string> = {
  USD: '$',
  ARS: 'AR$',
}

// In the JSX, display currency next to price:
<span className="text-muted-foreground text-sm">
  {currencySymbols[asset.currency]} {formatPrice(asset.currentPriceCents)}
</span>

// Or as a badge:
<span className="text-xs text-muted-foreground ml-1">
  ({asset.currency})
</span>
```

### File Structure

```
backend/
├── prisma/
│   └── schema.prisma                    (MODIFY - add Currency enum and field)
├── src/
│   ├── validations/
│   │   └── asset.ts                     (MODIFY - add currencySchema)
│   └── services/
│       └── assetService.ts              (MINOR - types auto-update from Prisma)

frontend/src/
├── types/
│   └── api.ts                           (MODIFY - add Currency type and fields)
├── validations/
│   └── asset.ts                         (MODIFY - add currencySchema)
└── features/
    └── portfolio/
        └── components/
            ├── AssetForm.tsx            (MODIFY - add currency dropdown)
            └── AssetCard.tsx            (MODIFY - display currency)
```

### Anti-Patterns to Avoid

```typescript
// NEVER hardcode currency in logic
if (asset.currency === 'USD') { ... }  // OK for display
const price = asset.price * 1100  // WRONG - hardcoded conversion

// NEVER mix currency types without explicit handling
totalUSD + totalARS  // WRONG - different currencies
totalUSD + (totalARS / exchangeRate)  // CORRECT

// NEVER assume currency
const symbol = '$'  // WRONG - assumes USD
const symbol = currencySymbols[asset.currency]  // CORRECT
```

### Testing Requirements

```typescript
// Backend tests
describe('Asset Validation', () => {
  it('should accept valid currency USD')
  it('should accept valid currency ARS')
  it('should default to USD if not provided')
  it('should reject invalid currency')
})

describe('Asset Service', () => {
  it('should create asset with currency')
  it('should update asset currency')
  it('should return currency in asset list')
})

// Frontend tests
describe('AssetForm', () => {
  it('should display currency dropdown')
  it('should default to USD')
  it('should allow selecting ARS')
  it('should submit with selected currency')
})

describe('AssetCard', () => {
  it('should display currency symbol for USD')
  it('should display currency symbol for ARS')
})
```

### Key Technical Constraints

- **Default value**: USD must be the default for new assets
- **Migration**: Existing assets get USD automatically via `@default(USD)`
- **No conversion yet**: This story only adds the field, conversion is Story 7.2+
- **Backward compatible**: API should work without currency param (defaults to USD)

### Previous Story Intelligence

**Patterns from Epic 6 (Settings story):**
- Enum handling with Zod: `z.enum(['VALUE1', 'VALUE2'])`
- Form pattern: React Hook Form + Zod resolver
- Select component pattern with mapping array
- Type definitions in `types/api.ts`

### Git Patterns

**Commit message format:**
```
feat(7-1-currency-field-on-asset-model): add currency enum and field to Asset
```

**Branch pattern:**
```
feature/7-1-currency-field-on-asset-model
```

### Project Context Reference

See `_bmad-output/project-context.md` for:
- TypeScript strict mode rules (no `any`)
- Path aliases (`@/features`, `@/lib`, `@/types`)
- Naming conventions (camelCase for files, PascalCase for components)
- Prisma enum patterns (PascalCase values)
- Zod schema naming (camelCase + Schema suffix)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-7.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#Currency-Enum]
- [Source: _bmad-output/planning-artifacts/prd.md#FR34]
- [Source: backend/prisma/schema.prisma - Current Asset model]
- [Source: backend/src/validations/asset.ts - Validation patterns]
- [Source: frontend/src/features/portfolio/components/AssetForm.tsx - Form patterns]
- [Source: frontend/src/features/portfolio/components/AssetCard.tsx - Display patterns]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- No debug issues encountered during implementation

### Completion Notes List

- Migration `20260111162314_add_currency_to_asset` applied successfully
- All existing assets default to USD via Prisma `@default(USD)`
- Backend tests: 505 passing (64 new currency validation tests)
- Frontend tests: 407 passing (updated 3 test files for currency field)
- Currency dropdown added to AssetForm with labels "USD - Dólar" and "ARS - Peso Argentino"
- Currency indicator displayed in AssetCard as "(USD)" or "(ARS)"
- Onboarding Step1AssetSetup updated with currency field
- PR #22 created: https://github.com/fresnizky/portfolio/pull/22

### File List

**Backend (Modified):**
- `backend/prisma/schema.prisma` - Added Currency enum and field to Asset model
- `backend/prisma/migrations/20260111162314_add_currency_to_asset/migration.sql` - New migration
- `backend/src/validations/asset.ts` - Added currencySchema and currency to schemas
- `backend/src/validations/asset.test.ts` - Added currency validation tests
- `backend/src/services/assetService.ts` - Updated batchCreate type signature

**Frontend (Modified):**
- `frontend/src/types/api.ts` - Added Currency type and updated interfaces
- `frontend/src/validations/asset.ts` - Added currencySchema
- `frontend/src/features/portfolio/components/AssetForm.tsx` - Added currency dropdown
- `frontend/src/features/portfolio/components/AssetForm.test.tsx` - Updated tests
- `frontend/src/features/portfolio/components/AssetCard.tsx` - Added currency display
- `frontend/src/features/portfolio/components/CreateAssetModal.test.tsx` - Updated tests
- `frontend/src/features/portfolio/index.test.tsx` - Updated tests
- `frontend/src/features/onboarding/components/Step1AssetSetup.tsx` - Added currency field

**Documentation (Modified):**
- `_bmad-output/implementation-artifacts/sprint-status.yaml` - Updated story status
- `_bmad-output/implementation-artifacts/7-1-currency-field-on-asset-model.md` - This file
