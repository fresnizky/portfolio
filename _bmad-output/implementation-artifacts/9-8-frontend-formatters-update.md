# Story 9.8: Frontend Formatters Update

Status: done

## Story

As a **user viewing quantities in the UI**,
I want **quantities formatted according to each asset's configured decimal precision**,
so that **I see appropriate precision for different asset types (2 decimals for USD, 8 for BTC) without misleading trailing zeros**.

## Problem Description

El frontend actualmente tiene formatters que infieren la precisión decimal del valor recibido, pero no utilizan el campo `decimalPlaces` que ya existe en el modelo Asset del backend. Esto causa:

1. **Precisión inconsistente**: `formatQuantity` adivina la precisión basándose en trailing zeros del string, lo cual es frágil
2. **decimalPlaces no expuesto**: El frontend no recibe `decimalPlaces` del backend aunque existe en el schema Prisma
3. **Formateo subóptimo**: No hay manera de formatear cantidades según las reglas del asset específico

**Ejemplo del problema actual:**
- Asset BTC tiene `decimalPlaces: 8` en DB pero frontend no lo sabe
- `formatQuantity("0.00100000")` muestra `0.00100000` (8 decimals)
- `formatQuantity("0.001")` muestra `0.001` (3 decimals)
- Inconsistencia visual para el mismo asset

**Solución:**
- Exponer `decimalPlaces` en la respuesta de Assets API
- Agregar parámetro opcional `decimalPlaces` a `formatQuantity`
- Actualizar componentes para usar `decimalPlaces` del asset cuando disponible

## Acceptance Criteria

1. **Given** the Asset interface in `frontend/src/types/api.ts`
   **When** I review the type definition
   **Then** it includes `decimalPlaces: number` field

2. **Given** a call to GET `/api/assets`
   **When** I inspect the response
   **Then** each asset includes `decimalPlaces` field (e.g., 2 for CASH, 8 for CRYPTO)

3. **Given** the `formatQuantity` function
   **When** I call it with `(value, decimalPlaces)` parameters
   **Then** it formats the value with the specified precision
   **And** it removes unnecessary trailing zeros beyond the precision

4. **Given** a position or holding displayed in the UI
   **When** the component has access to the asset's `decimalPlaces`
   **Then** it uses `formatQuantity(quantity, asset.decimalPlaces)`

5. **Given** the existing `formatQuantity` behavior
   **When** I call it WITHOUT the `decimalPlaces` parameter
   **Then** it falls back to current inference behavior (backward compatible)

6. **Given** the frontend builds
   **When** I run `npm run build` in frontend
   **Then** there are no TypeScript errors

7. **Given** the frontend tests
   **When** I run `npm test` in frontend
   **Then** all tests pass including new formatter tests

## Tasks / Subtasks

- [x] Task 1: Update Asset type in frontend (AC: #1)
  - [x] 1.1 Add `decimalPlaces: number` to Asset interface in `frontend/src/types/api.ts`
  - [x] 1.2 Add `decimalPlaces` to Holding.asset embedded type
  - [x] 1.3 Add `decimalPlaces` to DashboardPosition type (if not already present)

- [x] Task 2: Verify backend exposes decimalPlaces (AC: #2)
  - [x] 2.1 Confirm Prisma returns `decimalPlaces` in asset queries (should be automatic)
  - [x] 2.2 Test GET /api/assets response includes decimalPlaces
  - [x] 2.3 No backend changes needed - Prisma already returns all model fields

- [x] Task 3: Update formatQuantity function (AC: #3, #5)
  - [x] 3.1 Add optional `decimalPlaces?: number` parameter to `formatQuantity`
  - [x] 3.2 When `decimalPlaces` provided: format to that precision, trim trailing zeros
  - [x] 3.3 When `decimalPlaces` NOT provided: keep current inference behavior
  - [x] 3.4 Update function JSDoc

- [x] Task 4: Update formatQuantity tests (AC: #7)
  - [x] 4.1 Add tests for `formatQuantity(value, decimalPlaces)` with explicit precision
  - [x] 4.2 Add tests for backward compatibility (no decimalPlaces param)
  - [x] 4.3 Add edge cases: decimalPlaces=0, very large precision

- [x] Task 5: Update components to use decimalPlaces (AC: #4)
  - [x] 5.1 Update PositionCard.tsx to use `formatQuantity(qty, asset.decimalPlaces)`
  - [x] 5.2 Update TransactionCard.tsx (if it formats quantity) - N/A: Transaction.asset doesn't include decimalPlaces
  - [x] 5.3 Update TransactionTable.tsx to pass decimalPlaces - N/A: Transaction.asset doesn't include decimalPlaces
  - [x] 5.4 Update any other components that format quantities with asset context - N/A: No other components with asset context

- [x] Task 6: Build and test (AC: #6, #7)
  - [x] 6.1 Run `pnpm run build` and verify no TypeScript errors
  - [x] 6.2 Run `pnpm test` and verify all tests pass (frontend: 513, backend: 569)
  - [x] 6.3 Run `pnpm run lint` and fix any issues

## Dev Notes

### Current formatQuantity Implementation

**Location:** `frontend/src/lib/formatters.ts:51-66`

```typescript
// CURRENT - Infers precision from string value
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

### Updated formatQuantity Implementation

```typescript
/**
 * Format quantity with appropriate decimal precision
 * @param quantity - String representation of quantity from API
 * @param decimalPlaces - Optional: explicit decimal places from asset config
 * @returns Formatted quantity string
 */
export function formatQuantity(quantity: string, decimalPlaces?: number): string {
  const num = parseFloat(quantity)
  if (Number.isNaN(num)) return '0'

  // If decimalPlaces explicitly provided, use it
  if (decimalPlaces !== undefined) {
    // Format to precision, then remove unnecessary trailing zeros
    const formatted = num.toFixed(decimalPlaces)
    // Remove trailing zeros but keep at least one decimal if originally decimal
    if (decimalPlaces > 0) {
      return formatted.replace(/\.?0+$/, '') || formatted.split('.')[0]
    }
    return formatted
  }

  // Fallback: infer from string (backward compatibility)
  if (Number.isInteger(num)) return num.toString()
  const decimalPart = quantity.split('.')[1] || ''
  const precision = Math.min(8, decimalPart.length)
  return num.toFixed(precision)
}
```

**Alternative cleaner approach:**

```typescript
export function formatQuantity(quantity: string, decimalPlaces?: number): string {
  const num = parseFloat(quantity)
  if (Number.isNaN(num)) return '0'

  if (decimalPlaces !== undefined) {
    // Use Intl.NumberFormat for cleaner trailing zero handling
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimalPlaces,
    }).format(num)
  }

  // Fallback: existing inference behavior
  if (Number.isInteger(num)) return num.toString()
  const decimalPart = quantity.split('.')[1] || ''
  const precision = Math.min(8, decimalPart.length)
  return num.toFixed(precision)
}
```

### Type Updates Required

**frontend/src/types/api.ts - Asset interface:**
```typescript
export interface Asset {
  id: string
  ticker: string
  name: string
  category: AssetCategory
  currency: Currency
  decimalPlaces: number  // ✅ ADD THIS
  targetPercentage: string
  createdAt: string
  updatedAt: string
  userId: string
}
```

**frontend/src/types/api.ts - Holding.asset:**
```typescript
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
    currentPrice?: string | null
    decimalPlaces: number  // ✅ ADD THIS
  }
}
```

### Component Update Pattern

```typescript
// BEFORE
<span>{formatQuantity(position.quantity)}</span>

// AFTER (when asset has decimalPlaces)
<span>{formatQuantity(position.quantity, position.decimalPlaces)}</span>

// Or via asset relation
<span>{formatQuantity(holding.quantity, holding.asset.decimalPlaces)}</span>
```

### Files to Modify

| File | Changes |
|------|---------|
| `frontend/src/types/api.ts` | Add `decimalPlaces` to Asset and Holding.asset |
| `frontend/src/lib/formatters.ts` | Add optional `decimalPlaces` param to `formatQuantity` |
| `frontend/src/lib/formatters.test.ts` | Add tests for new parameter |
| `frontend/src/features/holdings/components/PositionCard.tsx` | Use decimalPlaces in formatQuantity |
| `frontend/src/features/transactions/components/TransactionCard.tsx` | Use decimalPlaces if available |
| `frontend/src/features/transactions/components/TransactionTable.tsx` | Pass decimalPlaces to formatQuantity |

### Backend Verification

**No backend changes required** - Prisma automatically includes all model fields:

```typescript
// assetService.ts already returns full asset including decimalPlaces
const asset = await prisma.asset.findFirst({ where: { id, userId } })
// asset.decimalPlaces is already in the response
```

### Default decimalPlaces by Category

The backend auto-sets these defaults (from schema migration 9-1):

| Category | decimalPlaces | Rationale |
|----------|---------------|-----------|
| CASH | 2 | USD/ARS standard |
| ETF | 4 | Fractional shares |
| FCI | 6 | Argentine fund quotapartes |
| CRYPTO | 8 | BTC satoshi precision |
| STOCK | 0 | Whole shares only |

### Test Cases for formatQuantity

```typescript
describe('formatQuantity with decimalPlaces', () => {
  it('formats integer with decimalPlaces=0', () => {
    expect(formatQuantity('10', 0)).toBe('10')
    expect(formatQuantity('10.5', 0)).toBe('11') // rounds
  })

  it('formats with decimalPlaces=2 (CASH)', () => {
    expect(formatQuantity('100.50', 2)).toBe('100.5')
    expect(formatQuantity('100.00', 2)).toBe('100')
    expect(formatQuantity('100.126', 2)).toBe('100.13')
  })

  it('formats with decimalPlaces=8 (CRYPTO)', () => {
    expect(formatQuantity('0.00000001', 8)).toBe('0.00000001')
    expect(formatQuantity('1.00000000', 8)).toBe('1')
    expect(formatQuantity('0.12345678', 8)).toBe('0.12345678')
  })

  it('falls back to inference when decimalPlaces not provided', () => {
    expect(formatQuantity('10')).toBe('10')
    expect(formatQuantity('10.50')).toBe('10.50')
  })
})
```

### Architecture Compliance

- **Types location:** `frontend/src/types/api.ts`
- **Formatters location:** `frontend/src/lib/formatters.ts`
- **Naming convention:** camelCase for function params
- **Tests co-located:** `formatters.test.ts` next to `formatters.ts`
- **Backward compatibility:** Existing calls without param continue working

### Previous Story Learnings

From Story 9-4 (Frontend Types Update):
- Type changes in api.ts are straightforward
- Components mostly already use correct patterns
- Tests can be run in parallel

From Story 9-7 (Transactions UI Table):
- `formatQuantity` is already imported from `@/lib/formatters`
- TransactionTable has access to `tx.asset` which includes decimalPlaces

### Git Commit Pattern

```
feat(formatters): add decimalPlaces parameter to formatQuantity

- Add decimalPlaces to Asset and Holding types
- Update formatQuantity to accept optional decimalPlaces param
- Use asset-specific precision in UI components
- Maintain backward compatibility for calls without param
- Add comprehensive tests for new functionality
```

### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| decimalPlaces=0 | Format as integer, round if needed |
| decimalPlaces=8, value="0" | Show "0" |
| decimalPlaces undefined | Use current inference behavior |
| Very small crypto value | Preserve full precision up to decimalPlaces |
| Trailing zeros | Remove unnecessary zeros (100.00 → 100) |

### Dependencies

**Requires (already done):**
- Story 9-1: Schema Migration (DONE) - `decimalPlaces` field exists in Asset model
- Story 9-3/9-4: API Types Update (DONE) - using new decimal field patterns

**Note:** Backend already returns `decimalPlaces` in API responses - this story only updates frontend to use it.

### References

- [Source: sprint-change-proposal-2026-01-13.md#4.5] - Frontend formatters requirements
- [Source: backend/prisma/schema.prisma:53] - `decimalPlaces Int @default(2)` field
- [Source: frontend/src/lib/formatters.ts:51-66] - Current formatQuantity implementation
- [Source: frontend/src/types/api.ts] - Current Asset type definition
- [Source: project-context.md#TypeScript Rules] - Naming conventions
- [Source: architecture.md#Frontend Structure] - File organization

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

- Added `decimalPlaces: number` field to Asset, Position, DashboardPosition, and Holding.asset types in frontend
- Updated `formatQuantity` function to accept optional `decimalPlaces` parameter
- When `decimalPlaces` is provided, uses `Intl.NumberFormat` for automatic trailing zero handling
- When `decimalPlaces` is omitted, falls back to original inference behavior (backward compatible)
- Updated PositionCard to use `formatQuantity(position.quantity, position.decimalPlaces)`
- TransactionCard and TransactionTable not updated because Transaction.asset schema doesn't include decimalPlaces (would require shared schema changes beyond story scope)
- Updated backend portfolioService to include `decimalPlaces` in asset select
- Updated backend dashboardService to pass `decimalPlaces` through to response
- Added comprehensive tests for new `decimalPlaces` parameter in formatters.test.ts
- All builds pass (frontend + backend)
- All tests pass (frontend: 513, backend: 569)
- Lint passes

### File List

**Frontend:**
- frontend/src/types/api.ts (modified - added decimalPlaces to Asset, Position, DashboardPosition, Holding.asset)
- frontend/src/lib/formatters.ts (modified - updated formatQuantity signature and implementation)
- frontend/src/lib/formatters.test.ts (modified - added tests for decimalPlaces parameter)
- frontend/src/features/holdings/components/PositionCard.tsx (modified - use decimalPlaces in formatQuantity call)

**Backend:**
- backend/src/services/portfolioService.ts (modified - added decimalPlaces to asset select and return)
- backend/src/services/portfolioService.test.ts (modified - updated test expectation for decimalPlaces)
- backend/src/services/dashboardService.ts (modified - pass decimalPlaces through to response)
- backend/src/validations/dashboard.ts (modified - added decimalPlaces to DashboardPosition interface)

**Project:**
- CLAUDE.md (created - added pnpm package manager rule)
