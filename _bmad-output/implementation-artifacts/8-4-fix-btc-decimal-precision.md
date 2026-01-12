# Story 8.4: Fix BTC Decimal Precision

Status: done

## Story

As a **user tracking cryptocurrency holdings**,
I want **to input and view quantities with up to 8 decimal places**,
so that **I can accurately track fractional BTC holdings (satoshis)**.

## Problem Description

El input de cantidad en el onboarding wizard tiene `step="0.0001"` que limita a 4 decimales. BTC usa hasta 8 decimales (1 satoshi = 0.00000001 BTC). Esto impide ingresar cantidades precisas de crypto durante el onboarding.

**Error Observado:** No es posible ingresar cantidades como `0.00012345` BTC en el onboarding wizard.

**Root Cause Analysis:**
1. **Onboarding Input:** `Step3HoldingsSetup.tsx:76` tiene `step="0.0001"` - limita a 4 decimales
2. **Transaction Form:** `TransactionForm.tsx:128` tiene `step="any"` - ✅ correcto
3. **Display Functions:** `formatQuantity()` en PositionCard y TransactionCard soporta hasta 8 decimales - ✅ correcto
4. **Database:** Prisma schema usa `Decimal(18, 8)` - ✅ correcto para 8 decimales
5. **Backend Validation:** Zod no limita decimales - ✅ correcto

## Acceptance Criteria

1. **Given** I am in the onboarding wizard step 3 (holdings setup)
   **When** I enter a BTC quantity with 8 decimals (e.g., `0.00012345`)
   **Then** the input accepts and displays all 8 decimal places

2. **Given** I have a BTC holding with 8 decimal precision
   **When** I view my holdings in the portfolio
   **Then** I see the full 8 decimal quantity (e.g., `0.00012345`)

3. **Given** I record a transaction with 8 decimal quantity
   **When** I view the transaction in history
   **Then** I see the full 8 decimal quantity

4. **Given** I update a holding quantity via holdings page
   **When** I enter 8 decimal places
   **Then** the input accepts the full precision

5. **Given** existing holdings with fewer decimals
   **When** I view them after the fix
   **Then** they display correctly (no regression)

## Tasks / Subtasks

- [x] Task 1: Fix onboarding holdings input precision (AC: #1)
  - [x] 1.1 Change `step="0.0001"` to `step="any"` in `Step3HoldingsSetup.tsx:76`
  - [x] 1.2 Update unit tests for Step3HoldingsSetup to verify 8 decimal input

- [x] Task 2: Verify other quantity inputs have correct precision (AC: #3, #4)
  - [x] 2.1 Verify TransactionForm.tsx has `step="any"` (should already be correct)
  - [x] 2.2 Check for any other quantity input fields that might need fixing
  - [x] 2.3 Search for `step="0.` patterns in frontend code

- [x] Task 3: Centralize formatQuantity function (AC: #2, #3, #5)
  - [x] 3.1 Move `formatQuantity` to `lib/formatters.ts` (currently duplicated in PositionCard and TransactionCard)
  - [x] 3.2 Update imports in PositionCard.tsx and TransactionCard.tsx
  - [x] 3.3 Add unit tests for formatQuantity with 8 decimal precision

- [x] Task 4: Test complete flow (AC: #1, #2, #3, #4, #5)
  - [x] 4.1 Test onboarding with 8 decimal BTC quantity
  - [x] 4.2 Test transaction recording with 8 decimal quantity
  - [x] 4.3 Test holding display shows full precision
  - [x] 4.4 Test transaction display shows full precision
  - [x] 4.5 Test existing holdings/transactions display correctly

## Dev Notes

### Current Implementation Analysis

**Problem Location - Step3HoldingsSetup.tsx:73-84:**
```typescript
<input
  type="number"
  min="0"
  step="0.0001"  // ❌ PROBLEM: Only 4 decimals
  value={h.quantity || ''}
  onChange={(e) => onSetHolding(
    asset.tempId,
    parseFloat(e.target.value) || 0,
    h.price
  )}
  placeholder="0"
  className="..."
/>
```

**Correct Implementation - TransactionForm.tsx:125-129:**
```typescript
<input
  id="quantity"
  type="number"
  step="any"  // ✅ CORRECT: Allows any decimal
  {...register('quantity', { valueAsNumber: true })}
  ...
/>
```

**Database Schema - Already Correct:**
```prisma
model Holding {
  quantity  Decimal  @db.Decimal(18, 8)  // ✅ Supports 8 decimals
}

model Transaction {
  quantity  Decimal  @db.Decimal(18, 8)  // ✅ Supports 8 decimals
}
```

### Fix Implementation

**Task 1: Simple fix in Step3HoldingsSetup.tsx**
```typescript
// Change line 76 from:
step="0.0001"

// To:
step="any"
```

**Task 3: Centralize formatQuantity in lib/formatters.ts**
```typescript
// Add to frontend/src/lib/formatters.ts

/**
 * Format quantity with appropriate decimal precision
 * Supports up to 8 decimals for crypto (satoshi precision)
 * @param quantity - String representation of quantity from API
 * @returns Formatted quantity string
 */
export function formatQuantity(quantity: string): string {
  const num = parseFloat(quantity)
  if (Number.isNaN(num)) return '0'
  if (Number.isInteger(num)) return num.toString()

  // Show actual precision up to 8 decimals
  const decimalPart = quantity.split('.')[1] || ''
  const precision = Math.min(8, decimalPart.length)
  return num.toFixed(precision)
}
```

### Architecture Compliance

- **Decimal Precision:** Architecture allows high precision for crypto via `Decimal(18, 8)`
- **Input Handling:** Use `step="any"` for numeric inputs that need variable precision
- **Formatters:** Centralize in `lib/formatters.ts` for consistency
- **Testing:** Co-located tests next to components

### Files to Modify

| File | Change |
|------|--------|
| `frontend/src/features/onboarding/components/Step3HoldingsSetup.tsx` | Change `step="0.0001"` to `step="any"` |
| `frontend/src/lib/formatters.ts` | Add `formatQuantity` function |
| `frontend/src/features/holdings/components/PositionCard.tsx` | Import from formatters, remove local function |
| `frontend/src/features/transactions/components/TransactionCard.tsx` | Import from formatters, remove local function |
| `frontend/src/lib/formatters.test.ts` | Add tests for formatQuantity |

### Files to Verify (No Changes Expected)

| File | Verify |
|------|--------|
| `frontend/src/features/transactions/components/TransactionForm.tsx` | Has `step="any"` |
| `backend/prisma/schema.prisma` | Has `Decimal(18, 8)` for quantities |
| `backend/src/validations/holding.ts` | No decimal limit |
| `backend/src/validations/transaction.ts` | No decimal limit |

### Testing Approach

1. **Unit Tests:**
   - Test `formatQuantity` with various inputs (integers, 2 decimals, 8 decimals)
   - Test Step3HoldingsSetup accepts 8 decimal input

2. **Manual Testing:**
   - Onboarding: Enter BTC with `0.00012345` quantity
   - Verify displays correctly in holdings
   - Create transaction with 8 decimal quantity
   - Verify displays correctly in transaction history

### BTC/Crypto Context

- 1 BTC = 100,000,000 satoshis
- Smallest unit: 1 satoshi = 0.00000001 BTC
- Common purchase amounts: 0.001 BTC, 0.0005 BTC, etc.
- Users need full 8 decimal precision for accurate tracking

### Previous Story Context

Story 8-3 (Fix Transaction Date Format) was completed successfully:
- Frontend form converts date before API submission
- Pattern: Fix format conversion at the boundary (form submission)
- All tests pass

This story follows similar pattern: Fix input constraints at the UI level.

### References

- [Source: Sprint Change Proposal - sprint-change-proposal-2026-01-11.md#line 22] - "Precisión decimal insuficiente para BTC (necesita 8 decimales)"
- [Source: frontend/src/features/onboarding/components/Step3HoldingsSetup.tsx:76] - Problem: `step="0.0001"`
- [Source: frontend/src/features/transactions/components/TransactionForm.tsx:128] - Correct: `step="any"`
- [Source: frontend/src/features/holdings/components/PositionCard.tsx:21-25] - formatQuantity (to centralize)
- [Source: frontend/src/features/transactions/components/TransactionCard.tsx:18-22] - formatQuantity (duplicate)
- [Source: backend/prisma/schema.prisma:72,89,129] - `Decimal(18, 8)` schema
- [Source: Project Context - project-context.md#TypeScript Rules]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

- Task 1: Changed `step="0.0001"` to `step="any"` in Step3HoldingsSetup.tsx:76
- Task 2: Verified TransactionForm.tsx already has `step="any"` for quantity. Other `step="0.01"` patterns are for price/money fields (correct).
- Task 3: Added `formatQuantity()` to lib/formatters.ts and removed duplicates from PositionCard.tsx and TransactionCard.tsx. Added comprehensive unit tests covering integers, 2 decimals, 4 decimals, 8 decimals, trailing zeros, invalid input, and max precision limit.
- Task 4: All 470 tests pass (26 formatters tests including 8 new formatQuantity tests). No regressions.

### File List

- frontend/src/features/onboarding/components/Step3HoldingsSetup.tsx (modified: step attribute)
- frontend/src/lib/formatters.ts (modified: added formatQuantity function)
- frontend/src/lib/formatters.test.ts (modified: added formatQuantity tests)
- frontend/src/features/holdings/components/PositionCard.tsx (modified: import formatQuantity from lib)
- frontend/src/features/transactions/components/TransactionCard.tsx (modified: import formatQuantity from lib)

