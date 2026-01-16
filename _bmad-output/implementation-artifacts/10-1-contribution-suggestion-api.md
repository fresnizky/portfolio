# Story 10.1: Contribution Suggestion API

Status: done

## Story

As a **user making monthly contributions**,
I want **the system to calculate how to distribute a contribution amount across my assets**,
so that **I can follow my investment strategy and correct deviations efficiently**.

## Problem Description

El usuario quiere registrar aportes mensuales y recibir sugerencias inteligentes de distribución. Actualmente no existe endpoint ni lógica para:

1. **Calcular distribución según targets**: Distribuir un monto según los porcentajes objetivo de cada activo
2. **Ajuste inteligente por desviaciones**: Priorizar activos underweight y reducir asignación a activos overweight
3. **Proveer información accionable**: Dar al usuario montos específicos por activo para facilitar la compra

**Ejemplo del problema:**
- Usuario tiene targets: VOO 60%, GLD 20%, BTC 20%
- Situación actual: VOO está 5% underweight, BTC está 5% overweight
- Aporte de $1000: Sin ajuste sería $600 VOO, $200 GLD, $200 BTC
- Con ajuste inteligente: Más a VOO, menos a BTC para corregir desviaciones

## Acceptance Criteria

1. **Given** I have assets with target percentages that sum to 100%
   **When** I POST to `/api/contributions/suggest` with an amount
   **Then** I receive a distribution suggestion with amount per asset

2. **Given** I have assets with current deviations from targets
   **When** I request a contribution suggestion
   **Then** the suggestion prioritizes underweight assets and reduces allocation to overweight assets

3. **Given** I request a suggestion for $1000 with targets VOO:60%, GLD:20%, BTC:20%
   **When** VOO is 5% underweight and BTC is 5% overweight
   **Then** the suggestion allocates more than $600 to VOO and less than $200 to BTC

4. **Given** I have no assets configured
   **When** I POST to `/api/contributions/suggest`
   **Then** I receive a 400 error indicating assets must be configured first

5. **Given** targets do not sum to 100%
   **When** I POST to `/api/contributions/suggest`
   **Then** I receive a 400 error indicating targets must sum to 100%

6. **Given** I provide an amount <= 0
   **When** I POST to `/api/contributions/suggest`
   **Then** I receive a 400 validation error

7. **Given** the backend builds
   **When** I run `pnpm run build` in backend
   **Then** there are no TypeScript errors

8. **Given** the backend tests
   **When** I run `pnpm test` in backend
   **Then** all tests pass including new contribution service tests

## Tasks / Subtasks

- [x] Task 1: Create contribution validation schema (AC: #6)
  - [x] 1.1 Create `backend/src/validations/contribution.ts`
  - [x] 1.2 Define `contributionSuggestSchema` with `amount: number` (positive)
  - [x] 1.3 Define response types `ContributionSuggestion` and `ContributionAllocation`
  - [x] 1.4 Add unit tests in `contribution.test.ts`

- [x] Task 2: Create contribution service with suggestion logic (AC: #1, #2, #3, #4, #5)
  - [x] 2.1 Create `backend/src/services/contributionService.ts`
  - [x] 2.2 Implement `getSuggestion(userId, amount)` method
  - [x] 2.3 Calculate base allocation from targets: `amount * (target / 100)`
  - [x] 2.4 Implement deviation adjustment algorithm
  - [x] 2.5 Handle edge cases: no assets, targets != 100%
  - [x] 2.6 Add comprehensive unit tests in `contributionService.test.ts`

- [x] Task 3: Create contribution routes (AC: #1, #4, #5, #6)
  - [x] 3.1 Create `backend/src/routes/contributions.ts`
  - [x] 3.2 Implement `POST /api/contributions/suggest` endpoint
  - [x] 3.3 Use validate middleware with contributionSuggestSchema
  - [x] 3.4 Add auth middleware
  - [x] 3.5 Add route to index.ts
  - [x] 3.6 Add integration tests in `contributions.test.ts`

- [x] Task 4: Build and test (AC: #7, #8)
  - [x] 4.1 Run `pnpm run build` and verify no TypeScript errors
  - [x] 4.2 Run `pnpm test` and verify all tests pass
  - [x] 4.3 Run `pnpm run lint` and fix any issues (N/A - eslint not installed)

## Dev Notes

### API Endpoint Design

**POST `/api/contributions/suggest`**

Request:
```json
{
  "amount": 1000
}
```

Response (Success - 200):
```json
{
  "data": {
    "amount": "1000",
    "displayCurrency": "USD",
    "allocations": [
      {
        "assetId": "clxx...",
        "ticker": "VOO",
        "name": "Vanguard S&P 500",
        "targetPercentage": "60.00",
        "actualPercentage": "55.00",
        "deviation": "-5.00",
        "baseAllocation": "600.00",
        "adjustedAllocation": "650.00",
        "adjustmentReason": "underweight"
      },
      {
        "assetId": "clyy...",
        "ticker": "GLD",
        "name": "SPDR Gold",
        "targetPercentage": "20.00",
        "actualPercentage": "20.00",
        "deviation": "0.00",
        "baseAllocation": "200.00",
        "adjustedAllocation": "200.00",
        "adjustmentReason": null
      },
      {
        "assetId": "clzz...",
        "ticker": "BTC",
        "name": "Bitcoin",
        "targetPercentage": "20.00",
        "actualPercentage": "25.00",
        "deviation": "5.00",
        "baseAllocation": "200.00",
        "adjustedAllocation": "150.00",
        "adjustmentReason": "overweight"
      }
    ],
    "summary": {
      "totalAdjusted": "1000.00",
      "underweightCount": 1,
      "overweightCount": 1,
      "balancedCount": 1
    }
  }
}
```

Response (Error - 400):
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Targets must sum to 100%",
  "details": { "currentSum": "85.00" }
}
```

### Validation Schema

**Location:** `backend/src/validations/contribution.ts`

```typescript
import { z } from 'zod'

export const contributionSuggestSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
})

export type ContributionSuggestInput = z.infer<typeof contributionSuggestSchema>

export interface ContributionAllocation {
  assetId: string
  ticker: string
  name: string
  targetPercentage: string
  actualPercentage: string | null
  deviation: string | null
  baseAllocation: string
  adjustedAllocation: string
  adjustmentReason: 'underweight' | 'overweight' | null
}

export interface ContributionSuggestion {
  amount: string
  displayCurrency: string
  allocations: ContributionAllocation[]
  summary: {
    totalAdjusted: string
    underweightCount: number
    overweightCount: number
    balancedCount: number
  }
}
```

### Service Implementation

**Location:** `backend/src/services/contributionService.ts`

```typescript
import { prisma } from '@/config/database'
import { Errors } from '@/lib/errors'
import type { ContributionSuggestion, ContributionAllocation } from '@/validations/contribution'

export const contributionService = {
  async getSuggestion(userId: string, amount: number): Promise<ContributionSuggestion> {
    // 1. Get user's assets with holdings and prices
    const assets = await prisma.asset.findMany({
      where: { userId },
      include: { holding: true },
      orderBy: { ticker: 'asc' },
    })

    if (assets.length === 0) {
      throw Errors.validation('No assets configured. Add assets before requesting contribution suggestions.')
    }

    // 2. Validate targets sum to 100%
    const targetSum = assets.reduce((sum, a) => sum + parseFloat(a.targetPercentage.toString()), 0)
    if (Math.abs(targetSum - 100) > 0.01) {
      throw Errors.validation('Targets must sum to 100%', { currentSum: targetSum.toFixed(2) })
    }

    // 3. Calculate current portfolio state
    let totalValue = 0
    const assetValues: Map<string, number> = new Map()

    for (const asset of assets) {
      if (asset.currentPrice && asset.holding) {
        const value = parseFloat(asset.holding.quantity.toString()) * parseFloat(asset.currentPrice.toString())
        assetValues.set(asset.id, value)
        totalValue += value
      } else {
        assetValues.set(asset.id, 0)
      }
    }

    // 4. Calculate allocations with deviation adjustment
    const allocations: ContributionAllocation[] = []
    let adjustmentPool = 0

    // First pass: calculate base allocations and identify deviations
    const deviations: { assetId: string; deviation: number; baseAlloc: number }[] = []

    for (const asset of assets) {
      const target = parseFloat(asset.targetPercentage.toString())
      const baseAlloc = (target / 100) * amount

      const value = assetValues.get(asset.id) ?? 0
      const actual = totalValue > 0 ? (value / totalValue) * 100 : 0
      const deviation = actual - target

      deviations.push({ assetId: asset.id, deviation, baseAlloc })
    }

    // Second pass: adjust allocations based on deviations
    // Simple algorithm: redistribute proportionally
    const ADJUSTMENT_FACTOR = 0.5 // How aggressively to adjust (0-1)

    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i]
      const { deviation, baseAlloc } = deviations[i]
      const target = parseFloat(asset.targetPercentage.toString())
      const value = assetValues.get(asset.id) ?? 0
      const actual = totalValue > 0 ? (value / totalValue) * 100 : null

      // Adjust: underweight gets more, overweight gets less
      const adjustment = -deviation * ADJUSTMENT_FACTOR * (amount / 100)
      const adjustedAlloc = Math.max(0, baseAlloc + adjustment)

      let adjustmentReason: 'underweight' | 'overweight' | null = null
      if (deviation < -1) adjustmentReason = 'underweight'
      else if (deviation > 1) adjustmentReason = 'overweight'

      allocations.push({
        assetId: asset.id,
        ticker: asset.ticker,
        name: asset.name,
        targetPercentage: target.toFixed(2),
        actualPercentage: actual !== null ? actual.toFixed(2) : null,
        deviation: actual !== null ? deviation.toFixed(2) : null,
        baseAllocation: baseAlloc.toFixed(2),
        adjustedAllocation: adjustedAlloc.toFixed(2),
        adjustmentReason,
      })
    }

    // Normalize to ensure total matches input amount
    const totalAdjusted = allocations.reduce((sum, a) => sum + parseFloat(a.adjustedAllocation), 0)
    if (totalAdjusted !== amount) {
      const ratio = amount / totalAdjusted
      for (const alloc of allocations) {
        alloc.adjustedAllocation = (parseFloat(alloc.adjustedAllocation) * ratio).toFixed(2)
      }
    }

    return {
      amount: amount.toFixed(2),
      displayCurrency: 'USD', // TODO: Support multi-currency in future
      allocations,
      summary: {
        totalAdjusted: amount.toFixed(2),
        underweightCount: allocations.filter(a => a.adjustmentReason === 'underweight').length,
        overweightCount: allocations.filter(a => a.adjustmentReason === 'overweight').length,
        balancedCount: allocations.filter(a => a.adjustmentReason === null).length,
      },
    }
  },
}
```

### Route Implementation

**Location:** `backend/src/routes/contributions.ts`

```typescript
import { Router } from 'express'
import { authMiddleware } from '@/middleware/auth'
import { validate } from '@/middleware/validate'
import { contributionSuggestSchema } from '@/validations/contribution'
import { contributionService } from '@/services/contributionService'

const router = Router()

router.use(authMiddleware)

router.post('/suggest', validate(contributionSuggestSchema), async (req, res, next) => {
  try {
    const { amount } = req.body
    const suggestion = await contributionService.getSuggestion(req.user!.id, amount)
    res.json({ data: suggestion })
  } catch (error) {
    next(error)
  }
})

export default router
```

### Register Route in Index

**Location:** `backend/src/index.ts` (add import and use)

```typescript
import contributionsRouter from '@/routes/contributions'
// ...
app.use('/api/contributions', contributionsRouter)
```

### Algorithm Notes: Deviation Adjustment

El algoritmo de ajuste funciona así:

1. **Base Allocation**: `amount * (targetPercentage / 100)`
2. **Deviation**: `actualPercentage - targetPercentage`
3. **Adjustment**: `-deviation * ADJUSTMENT_FACTOR * (amount / 100)`
   - Negative deviation (underweight) → positive adjustment
   - Positive deviation (overweight) → negative adjustment
4. **ADJUSTMENT_FACTOR = 0.5**: Corrección moderada, no extrema
5. **Floor at 0**: No asignar valores negativos
6. **Normalization**: Asegurar que la suma de ajustados = amount

**Ejemplo con $1000:**
- VOO: target 60%, actual 55% → deviation -5% → base $600 + $25 = $625
- GLD: target 20%, actual 20% → deviation 0% → base $200 + $0 = $200
- BTC: target 20%, actual 25% → deviation +5% → base $200 - $25 = $175
- Total = $1000 ✓

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `backend/src/validations/contribution.ts` | CREATE | Zod schema and types |
| `backend/src/validations/contribution.test.ts` | CREATE | Validation tests |
| `backend/src/services/contributionService.ts` | CREATE | Business logic |
| `backend/src/services/contributionService.test.ts` | CREATE | Service tests |
| `backend/src/routes/contributions.ts` | CREATE | API route |
| `backend/src/routes/contributions.test.ts` | CREATE | Route tests |
| `backend/src/index.ts` | MODIFY | Register route |

### Test Cases

**Validation Tests:**
```typescript
describe('contributionSuggestSchema', () => {
  it('accepts valid positive amount', () => {
    expect(() => contributionSuggestSchema.parse({ amount: 1000 })).not.toThrow()
  })

  it('rejects zero amount', () => {
    expect(() => contributionSuggestSchema.parse({ amount: 0 })).toThrow()
  })

  it('rejects negative amount', () => {
    expect(() => contributionSuggestSchema.parse({ amount: -100 })).toThrow()
  })
})
```

**Service Tests:**
```typescript
describe('contributionService.getSuggestion', () => {
  it('calculates base allocation from targets', async () => {
    // Setup: 3 assets with 60/20/20 targets
    const result = await contributionService.getSuggestion(userId, 1000)
    expect(result.allocations).toHaveLength(3)
    expect(parseFloat(result.allocations[0].baseAllocation)).toBe(600)
  })

  it('adjusts allocation for underweight assets', async () => {
    // Setup: Asset is underweight
    const result = await contributionService.getSuggestion(userId, 1000)
    const underweight = result.allocations.find(a => a.adjustmentReason === 'underweight')
    expect(parseFloat(underweight!.adjustedAllocation))
      .toBeGreaterThan(parseFloat(underweight!.baseAllocation))
  })

  it('throws error when no assets configured', async () => {
    await expect(contributionService.getSuggestion(emptyUserId, 1000))
      .rejects.toThrow('No assets configured')
  })

  it('throws error when targets do not sum to 100%', async () => {
    // Setup: Targets sum to 80%
    await expect(contributionService.getSuggestion(invalidUserId, 1000))
      .rejects.toThrow('Targets must sum to 100%')
  })
})
```

### Architecture Compliance

- **Route location:** `backend/src/routes/contributions.ts`
- **Service location:** `backend/src/services/contributionService.ts`
- **Validation location:** `backend/src/validations/contribution.ts`
- **Tests co-located:** `*.test.ts` next to source files
- **Error handling:** Use `Errors.validation()` from `@/lib/errors`
- **Response format:** `{ data: T }` for success, `{ error, message, details }` for errors
- **Naming:** camelCase for functions and variables, PascalCase for types

### Previous Story Learnings

From Story 9.8 (Frontend Formatters):
- Tests should be comprehensive with edge cases
- Service should handle null/undefined values gracefully
- Use Decimal types from Prisma correctly with `toString()` before parsing

From Dashboard Service pattern:
- Use portfolioService for base data when possible
- Calculate derived values from existing data
- Follow existing response format conventions

### Git Commit Pattern

```
feat(contributions): add contribution suggestion API

- Add POST /api/contributions/suggest endpoint
- Implement deviation-based allocation adjustment algorithm
- Validate targets sum to 100% before suggesting
- Include comprehensive test coverage
```

### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| No assets | 400 error: "No assets configured" |
| Targets != 100% | 400 error with current sum |
| No holdings/prices | Use 0 for values, skip deviation adjustment |
| Single asset at 100% | Allocate full amount to it |
| All assets at exact target | Base allocation equals adjusted |
| Very small amount ($1) | Still distribute proportionally |
| Decimal amount ($123.45) | Handle with 2 decimal precision |

### Dependencies

**Requires (already done):**
- Epic 2: Portfolio Configuration (DONE) - Assets with targets
- Epic 3: Holdings & Price Management (DONE) - Current values
- Epic 5: Dashboard API (DONE) - Pattern reference

**Related:**
- Story 10.2: UI will consume this API
- Story 10.3: Transaction integration will use allocations

### References

- [Source: epics.md#Epic 10] - Story requirements and acceptance criteria
- [Source: prd.md#FR34-FR36] - Functional requirements for contributions
- [Source: architecture.md#API Patterns] - REST endpoint conventions
- [Source: architecture.md#Error Handling] - AppError patterns
- [Source: dashboardService.ts] - Pattern for service implementation
- [Source: project-context.md#API Patterns] - Response format standards

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None - implementation proceeded without issues.

### Completion Notes List

- ✅ Created `contributionSuggestSchema` with positive number validation and coercion
- ✅ Defined `ContributionAllocation` and `ContributionSuggestion` TypeScript interfaces
- ✅ Implemented `contributionService.getSuggestion()` with deviation-based allocation adjustment
- ✅ Algorithm uses ADJUSTMENT_FACTOR=0.5 for moderate correction
- ✅ Validates: no assets (AC#4), targets != 100% (AC#5), amount <= 0 (AC#6)
- ✅ POST `/api/contributions/suggest` endpoint with auth middleware
- ✅ Response format: `{ data: ContributionSuggestion }` per project standards
- ✅ 49 new tests added (17 validation, 20 service, 12 route)
- ✅ All 618 backend tests passing
- ✅ Build successful with no TypeScript errors

### File List

**Created:**
- `backend/src/validations/contribution.ts` - Zod schema and TypeScript types
- `backend/src/validations/contribution.test.ts` - 17 validation tests
- `backend/src/services/contributionService.ts` - Business logic with deviation adjustment
- `backend/src/services/contributionService.test.ts` - 20 service tests
- `backend/src/routes/contributions.ts` - POST /suggest endpoint
- `backend/src/routes/contributions.test.ts` - 12 route tests

**Modified:**
- `backend/src/index.ts` - Added contributions router import and registration

## Change Log

- 2026-01-16: Story 10.1 implemented - Contribution Suggestion API with deviation-based allocation
