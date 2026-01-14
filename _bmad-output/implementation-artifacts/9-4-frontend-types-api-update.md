# Story 9.4: Frontend Types & API Client Update

Status: done

## Story

As a **frontend developer**,
I want **the frontend types to use `currentPrice` instead of `currentPriceCents`**,
so that **the frontend aligns with the new backend API contract after the schema migration**.

## Problem Description

Después de la migración del schema de Prisma (Story 9-1) y la actualización del backend (Story 9-3), el frontend tiene tipos desactualizados:

**Tipo `Holding.asset` usa campo legacy:**
```typescript
// frontend/src/types/api.ts:251-264
export interface Holding {
  // ...
  asset: {
    id: string
    ticker: string
    name: string
    category: AssetCategory
    currentPriceCents?: string | null  // ❌ Legacy - debe ser currentPrice
  }
}
```

El backend ahora devuelve `currentPrice` (Decimal como string), no `currentPriceCents`.

**Nota importante:** Los tipos de Transaction ya están correctos gracias al shared schema (`@shared`) que usa `price`, `commission`, `totalCost`, `totalProceeds`.

## Acceptance Criteria

1. **Given** the `Holding` interface in `frontend/src/types/api.ts`
   **When** I review the `asset` property
   **Then** it uses `currentPrice?: string | null` instead of `currentPriceCents`

2. **Given** any component that reads `currentPriceCents` from holdings
   **When** I search the frontend codebase
   **Then** all references are updated to use `currentPrice`

3. **Given** the frontend builds
   **When** I run `npm run build` in frontend
   **Then** there are no TypeScript errors related to `currentPriceCents`

4. **Given** the frontend tests
   **When** I run `npm test` in frontend
   **Then** all tests pass with updated mock data using `currentPrice`

5. **Given** a holding is displayed in the UI
   **When** I view the price
   **Then** it displays correctly from the `currentPrice` field

## Tasks / Subtasks

- [x] Task 1: Update Holding type in api.ts (AC: #1)
  - [x] 1.1 Change `currentPriceCents?: string | null` to `currentPrice?: string | null` in Holding.asset
  - [x] 1.2 Verify no other types reference `currentPriceCents`

- [x] Task 2: Update all usages in components (AC: #2, #5)
  - [x] 2.1 Search for `currentPriceCents` in frontend/src and update all references
  - [x] 2.2 Update PositionCard.tsx if it uses currentPriceCents (N/A - already uses currentPrice)
  - [x] 2.3 Update PriceUpdateModal.tsx if it uses currentPriceCents (N/A - already uses currentPrice)
  - [x] 2.4 Update BatchPriceUpdateModal.tsx if it uses currentPriceCents (N/A - already uses currentPrice)
  - [x] 2.5 Update any other components found in search (none found)

- [x] Task 3: Update test mocks (AC: #4)
  - [x] 3.1 Update mock data in PositionCard.test.tsx (N/A - already uses currentPrice)
  - [x] 3.2 Update mock data in PriceUpdateModal.test.tsx (N/A - already uses currentPrice)
  - [x] 3.3 Update mock data in BatchPriceUpdateModal.test.tsx (N/A - already uses currentPrice)
  - [x] 3.4 Update mock data in usePortfolio.test.tsx (N/A - already uses currentPrice)
  - [x] 3.5 Update mock data in holdings/index.test.tsx (N/A - already uses currentPrice)
  - [x] 3.6 Update mock data in api.test.ts (N/A - already uses currentPrice)
  - [x] 3.7 Update any other test files that mock Holding data (all 13 test files verified)

- [x] Task 4: Verify build and tests (AC: #3, #4)
  - [x] 4.1 Run `npm run build` and verify no TypeScript errors
  - [x] 4.2 Run `npm test` and verify all tests pass (478 tests passing)
  - [x] 4.3 Run `npm run lint` and fix any issues (no issues)

## Dev Notes

### Files Requiring Changes

Based on grep analysis, these files reference `currentPriceCents` or `currentPrice`:

**Type Definition (must change):**
- `frontend/src/types/api.ts:262` - `currentPriceCents?: string | null`

**Components (verify and update if needed):**
- `frontend/src/features/holdings/components/PositionCard.tsx`
- `frontend/src/features/holdings/components/PriceUpdateModal.tsx`
- `frontend/src/features/holdings/components/BatchPriceUpdateModal.tsx`

**Tests (update mock data):**
- `frontend/src/lib/api.test.ts`
- `frontend/src/features/holdings/index.test.tsx`
- `frontend/src/features/holdings/hooks/usePortfolio.test.tsx`
- `frontend/src/features/holdings/components/PositionCard.test.tsx`
- `frontend/src/features/holdings/components/PriceUpdateModal.test.tsx`
- `frontend/src/features/holdings/components/BatchPriceUpdateModal.test.tsx`
- `frontend/src/features/holdings/components/PositionList.test.tsx`
- `frontend/src/features/holdings/components/StaleAlertBanner.test.tsx`
- `frontend/src/features/holdings/utils/staleness.test.ts`
- `frontend/src/features/dashboard/index.test.tsx`
- `frontend/src/features/dashboard/hooks/useDashboard.test.tsx`
- `frontend/src/features/dashboard/components/AllocationChart.test.tsx`
- `frontend/src/features/dashboard/components/PositionsList.test.tsx`

### Type Change

```typescript
// BEFORE (frontend/src/types/api.ts:251-264)
export interface Holding {
  id: string
  assetId: string
  quantity: string
  createdAt: string
  updatedAt: string
  asset: {
    id: string
    ticker: string
    name: string
    category: AssetCategory
    currentPriceCents?: string | null  // ❌ Legacy
  }
}

// AFTER
export interface Holding {
  id: string
  assetId: string
  quantity: string
  createdAt: string
  updatedAt: string
  asset: {
    id: string
    ticker: string
    name: string
    category: AssetCategory
    currentPrice?: string | null  // ✅ New - Decimal as string
  }
}
```

### Mock Data Update Pattern

```typescript
// BEFORE
const mockHolding = {
  id: 'hold-1',
  assetId: 'asset-1',
  quantity: '10',
  asset: {
    id: 'asset-1',
    ticker: 'VOO',
    name: 'Vanguard S&P 500',
    category: 'ETF',
    currentPriceCents: '45000',  // ❌ Legacy (was cents)
  }
}

// AFTER
const mockHolding = {
  id: 'hold-1',
  assetId: 'asset-1',
  quantity: '10',
  asset: {
    id: 'asset-1',
    ticker: 'VOO',
    name: 'Vanguard S&P 500',
    category: 'ETF',
    currentPrice: '450.00',  // ✅ New (actual price as string)
  }
}
```

### Transaction Types - Already Correct

The Transaction types from `@shared` already use the correct field names:
- `price` (not `priceCents`)
- `commission` (not `commissionCents`)
- `totalCost` / `totalProceeds` (not `totalCents`)

This is because the shared schema was already updated or designed with the new naming.

### Architecture Compliance

- **Types location:** `frontend/src/types/api.ts`
- **Naming convention:** camelCase for fields (`currentPrice`)
- **Decimal as string:** Prisma Decimal comes as string from API
- **Test co-location:** Tests next to their source files

### Search Commands

```bash
# Find all usages of currentPriceCents
grep -r "currentPriceCents" frontend/src/

# Find all test files that might need mock updates
grep -rn "currentPrice" frontend/src/ --include="*.test.ts*"
```

### Dependencies

**Requires:**
- Story 9-1: Schema Migration (DONE) - provides new Decimal fields
- Story 9-3: Backend API & Types Update - backend must return `currentPrice`

**Important:** Story 9-4 should only be implemented AFTER Story 9-3 is done. If 9-3 is not done, the frontend will break because it expects `currentPrice` but backend still sends `currentPriceCents`.

### Testing Approach

1. **Search & Replace:**
   - Use IDE search to find all `currentPriceCents` occurrences
   - Replace with `currentPrice`
   - Update values from cents (45000) to dollars ("450.00")

2. **Type Check:**
   - Run `npm run build` to catch type errors
   - TypeScript will flag any mismatches

3. **Test Run:**
   - Run `npm test` to verify all mocks are updated
   - Fix any failing tests due to mock shape changes

4. **Manual Verification:**
   - Run the app and verify holdings display correctly
   - Check that prices show as expected

### Previous Story Learnings

From Story 9-1:
- Schema migration converted `currentPriceCents BigInt` → `currentPrice Decimal`
- Backend TypeScript errors are expected until Story 9-3 is done

From shared schema:
- Transaction types already use `price`, `commission`, `total` naming
- Frontend Transaction types are correct via `@shared` import

### Git Commit Pattern

```
fix(frontend): update Holding type to use currentPrice instead of currentPriceCents

- Update Holding.asset.currentPriceCents -> currentPrice in types/api.ts
- Update all component references to use new field name
- Update test mocks with new field name and decimal values
- Aligns frontend with backend API changes from Story 9-3
```

### References

- [Source: sprint-change-proposal-2026-01-13.md#4.9] - Frontend types update requirements
- [Source: frontend/src/types/api.ts:262] - currentPriceCents location
- [Source: shared/schemas/transaction.ts] - Transaction schema (already correct)
- [Source: project-context.md#TypeScript Rules] - Naming conventions
- [Source: architecture.md#Frontend Architecture] - Type location patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None - implementation was straightforward.

### Completion Notes List

- **Task 1:** Updated `Holding.asset.currentPriceCents` to `currentPrice` in `frontend/src/types/api.ts:262`. Verified no other type references exist.
- **Task 2:** Components already use `currentPrice` field (PositionCard, PriceUpdateModal, BatchPriceUpdateModal). No changes needed.
- **Task 3:** All 13 test files already use `currentPrice` in mock data. No changes needed.
- **Task 4:** Build passes (tsc + vite), 478 tests pass, lint clean.

**Note:** The codebase was mostly already aligned with the new API contract. Only the type definition in `api.ts` needed updating. Components and tests had been updated in a previous iteration.

### File List

**Modified:**
- `frontend/src/types/api.ts` - Changed `currentPriceCents` to `currentPrice` in Holding interface

### Change Log

- 2026-01-14: Updated Holding.asset type from `currentPriceCents` to `currentPrice` to align with backend API (Story 9-3)

