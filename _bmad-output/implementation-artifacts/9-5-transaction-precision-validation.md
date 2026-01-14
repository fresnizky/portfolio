# Story 9.5: Transaction Precision Validation

Status: done

## Story

As a **user recording transactions**,
I want **the system to validate that quantity decimal places don't exceed my asset's configured precision**,
so that **I receive clear errors for invalid inputs instead of silent data corruption**.

## Problem Description

Después de la migración de schema (Story 9-1) que agregó `decimalPlaces` a Asset y convirtió campos `*Cents` a `Decimal`, falta implementar la validación de precisión:

1. **Sin validación actual:** El service `transactionService.create()` ya obtiene el asset con `decimalPlaces`, pero no lo usa
2. **Riesgo de datos inválidos:** Usuarios podrían ingresar cantidades con más decimales de los permitidos
3. **Inconsistencia de datos:** Sin validación, la DB puede almacenar valores que no respetan la configuración del asset

**Ejemplo del problema:**
- Asset BTC tiene `decimalPlaces: 8`
- Usuario intenta crear transacción con `quantity: 0.000000001` (9 decimales)
- Sin validación, esto podría aceptarse o truncarse silenciosamente

## Acceptance Criteria

1. **Given** a transaction with quantity having more decimals than asset.decimalPlaces
   **When** I POST to `/api/transactions`
   **Then** I receive a 400 validation error with message "Quantity exceeds X decimal places" where X is asset.decimalPlaces
   **And** the error includes `{ decimalPlaces: X, provided: Y }` in details

2. **Given** a transaction with quantity having exactly asset.decimalPlaces decimals
   **When** I POST to `/api/transactions`
   **Then** the transaction is created successfully

3. **Given** a transaction with quantity having fewer decimals than asset.decimalPlaces
   **When** I POST to `/api/transactions`
   **Then** the transaction is created successfully

4. **Given** a BTC asset (decimalPlaces: 8)
   **When** I create a transaction with quantity "0.00000001"
   **Then** the transaction is created successfully (exactly 8 decimals)

5. **Given** a USD asset (decimalPlaces: 2)
   **When** I create a transaction with quantity "10.123"
   **Then** I receive a validation error (3 decimals > 2 allowed)

6. **Given** the backend tests
   **When** I run `npm test` in backend
   **Then** all existing tests pass and new precision validation tests pass

## Tasks / Subtasks

- [x] Task 1: Add decimal counting utility (AC: #1)
  - [x] 1.1 Create `countDecimalPlaces(value: number): number` function in `backend/src/lib/money.ts`
  - [x] 1.2 Handle edge cases: integers return 0, trailing zeros ignored
  - [x] 1.3 Add unit tests for the utility

- [x] Task 2: Add precision validation in transactionService (AC: #1, #2, #3, #4, #5)
  - [x] 2.1 In `transactionService.create()`, after asset lookup (line ~50)
  - [x] 2.2 Call `countDecimalPlaces(input.quantity)`
  - [x] 2.3 If decimals > asset.decimalPlaces, throw `Errors.validation()` with details
  - [x] 2.4 Add tests for validation logic

- [x] Task 3: Verify integration (AC: #6)
  - [x] 3.1 Run existing transaction tests
  - [x] 3.2 Run backend typecheck (eslint not installed)
  - [x] 3.3 Validated via unit tests (API test covered in transactionService.test.ts)

## Dev Notes

### Current State (Analyze Before Modifying)

El servicio ya obtiene el asset con `decimalPlaces` pero NO lo usa:

```typescript
// backend/src/services/transactionService.ts (lines ~48-62)
async create(userId: string, input: CreateTransactionInput) {
  const asset = await prisma.asset.findFirst({
    where: { id: input.assetId, userId },
  })

  if (!asset) {
    throw Errors.notFound('Asset')
  }

  // asset.decimalPlaces is available but NEVER USED!
  // ADD VALIDATION HERE
```

### Implementation Pattern

```typescript
// backend/src/lib/money.ts - ADD THIS FUNCTION
export function countDecimalPlaces(value: number): number {
  if (Number.isInteger(value)) return 0
  const str = value.toString()
  // Handle scientific notation (e.g., 1e-8)
  if (str.includes('e-')) {
    const [, exp] = str.split('e-')
    return parseInt(exp, 10)
  }
  const parts = str.split('.')
  return parts[1]?.length ?? 0
}

// backend/src/services/transactionService.ts - ADD AFTER LINE ~55
const quantityDecimals = countDecimalPlaces(input.quantity)
if (quantityDecimals > asset.decimalPlaces) {
  throw Errors.validation(
    `Quantity exceeds ${asset.decimalPlaces} decimal places for ${asset.ticker}`,
    {
      decimalPlaces: asset.decimalPlaces,
      provided: quantityDecimals,
      ticker: asset.ticker
    }
  )
}
```

### Error Response Format

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Quantity exceeds 2 decimal places for USD",
  "details": {
    "decimalPlaces": 2,
    "provided": 3,
    "ticker": "USD"
  }
}
```

### Edge Cases to Handle

| Input | Asset decimalPlaces | Expected Result |
|-------|---------------------|-----------------|
| `10` | 2 | Valid (0 decimals) |
| `10.00` | 2 | Valid (2 decimals, trailing zeros OK) |
| `10.001` | 2 | **Error** (3 > 2) |
| `0.00000001` | 8 | Valid (8 decimals, BTC satoshi) |
| `0.000000001` | 8 | **Error** (9 > 8) |
| `1.5` | 0 | **Error** (1 > 0, for STOCK assets) |

### Scientific Notation Handling

JavaScript representa números muy pequeños en notación científica:
```javascript
0.00000001.toString() // "1e-8"
0.000000001.toString() // "1e-9"
```

La función `countDecimalPlaces` debe manejar esto correctamente.

### Default decimalPlaces by Category

| Category | decimalPlaces | Example |
|----------|---------------|---------|
| CRYPTO | 8 | BTC, ETH |
| FCI | 6 | Cuotapartes argentinas |
| ETF | 4 | Acciones fraccionarias |
| CASH | 2 | USD, ARS |

### Files to Modify

| File | Change |
|------|--------|
| `backend/src/lib/money.ts` | Add `countDecimalPlaces()` function |
| `backend/src/services/transactionService.ts` | Add validation after asset lookup |
| `backend/src/lib/money.test.ts` | Add tests for new function |
| `backend/src/services/transactionService.test.ts` | Add precision validation tests |

### Architecture Compliance

- **Error Handling:** Use `Errors.validation()` from `backend/src/lib/errors.ts` - NEVER throw raw errors
- **Validation Location:** In service layer, not schema (schema doesn't have async access to asset)
- **Naming:** camelCase for functions and variables
- **Tests:** Co-located next to source files (`*.test.ts`)

### Testing Approach

```typescript
// backend/src/lib/money.test.ts
describe('countDecimalPlaces', () => {
  it('returns 0 for integers', () => {
    expect(countDecimalPlaces(10)).toBe(0)
  })

  it('returns correct count for decimals', () => {
    expect(countDecimalPlaces(10.5)).toBe(1)
    expect(countDecimalPlaces(10.123)).toBe(3)
  })

  it('handles scientific notation', () => {
    expect(countDecimalPlaces(0.00000001)).toBe(8)
    expect(countDecimalPlaces(0.000000001)).toBe(9)
  })
})

// backend/src/services/transactionService.test.ts
describe('create transaction precision validation', () => {
  it('rejects quantity with too many decimals', async () => {
    // Setup: Create asset with decimalPlaces: 2
    // Act: Try to create transaction with quantity: 10.123
    // Assert: Errors.validation thrown with correct details
  })

  it('accepts quantity within decimal limit', async () => {
    // Setup: Create asset with decimalPlaces: 8
    // Act: Create transaction with quantity: 0.00000001
    // Assert: Transaction created successfully
  })
})
```

### Previous Story Learnings

From Story 9-1 (Schema Migration):
- `decimalPlaces` field added to Asset model with defaults: CRYPTO=8, FCI=6, ETF/CASH=2
- All `*Cents` fields converted to `Decimal(18, 8)` for high precision storage

From Story 9-3/9-4 (API Updates):
- Backend and frontend now use `price`, `commission`, `total` instead of `*Cents`
- The service calculation logic was updated but precision validation was NOT added

### Git Commit Pattern

```
feat(transactions): add decimal precision validation

- Add countDecimalPlaces utility function
- Validate quantity decimals against asset.decimalPlaces
- Return clear error when precision exceeds limit
- Add unit tests for precision validation
```

### Dependencies

**Requires (already done):**
- Story 9-1: Schema Migration (DONE) - provides `decimalPlaces` field on Asset
- Story 9-3: Backend API Update (ready-for-dev) - may or may not be done

**Note:** This story can proceed independently since it only reads `asset.decimalPlaces` which was added in 9-1.

### References

- [Source: sprint-change-proposal-2026-01-13.md#4.3] - Validation requirements
- [Source: backend/src/services/transactionService.ts:48-62] - Current create() method
- [Source: backend/src/lib/money.ts] - Money utilities location
- [Source: backend/src/lib/errors.ts] - Error handling patterns
- [Source: project-context.md#Backend Patterns] - Error handling rules
- [Source: architecture.md#Process Patterns] - AppError usage

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Tests verified passing: 563 unit tests (36 files), 0 regressions
- TypeScript typecheck: passed with no errors

### Completion Notes List

- ✅ Created `countDecimalPlaces()` utility in `backend/src/lib/money.ts` with:
  - Integer detection (returns 0)
  - Regular decimal handling
  - Scientific notation handling (e.g., 1e-8 → 8, 1.2e-8 → 9)
- ✅ Added 16 unit tests for `countDecimalPlaces()` covering all edge cases
- ✅ Implemented precision validation in `transactionService.create()`:
  - Validates quantity decimals against `asset.decimalPlaces`
  - Throws `Errors.validation()` with message format: "Quantity exceeds X decimal places for TICKER"
  - Error details include: `{ decimalPlaces, provided, ticker }`
- ✅ Added 7 precision validation tests in `transactionService.test.ts`:
  - Rejects quantity with more decimals than allowed
  - Accepts quantity with exactly allowed decimals
  - Accepts quantity with fewer decimals
  - Accepts integers
  - Specific BTC satoshi test (8 decimals)
  - Stock/whole-unit test (0 decimals)
  - SELL transaction validation test
- ✅ All 563 backend tests pass, no regressions

### File List

| File | Status |
|------|--------|
| `backend/src/lib/money.ts` | **NEW** |
| `backend/src/lib/money.test.ts` | **NEW** |
| `backend/src/services/transactionService.ts` | Modified |
| `backend/src/services/transactionService.test.ts` | Modified |

## Change Log

- 2026-01-14: Implemented decimal precision validation for transactions (Story 9.5)
