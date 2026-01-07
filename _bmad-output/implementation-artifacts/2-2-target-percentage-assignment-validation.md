# Story 2.2: Target Percentage Assignment with Validation

Status: done

## Story

As a **user**,
I want **to assign target percentages to each asset with validation that they sum to 100%**,
so that **I can define my investment strategy**.

## Acceptance Criteria

1. **Given** I have assets in my portfolio, **When** I PUT to `/api/assets/:id` with a `targetPercentage` value, **Then** the target is saved for that asset

2. **Given** I am updating targets, **When** the sum of all targets equals exactly 100%, **Then** the update is accepted

3. **Given** I am updating targets, **When** the sum of all targets does NOT equal 100%, **Then** I receive a validation error with the current sum

4. **Given** I have multiple assets, **When** I PUT to `/api/assets/targets` with an array of `{assetId, targetPercentage}`, **Then** all targets are updated atomically (all succeed or all fail)

## Tasks / Subtasks

- [x] Task 1: Extend Asset Validation Schema (AC: #1, #3)
  - [x] Add `targetPercentage` to `updateAssetSchema` in `backend/src/validations/asset.ts`
  - [x] Create `targetPercentageSchema` (Decimal 0-100, precision 2)
  - [x] Add tests for new validation rules

- [x] Task 2: Batch Targets Validation Schema (AC: #4)
  - [x] Create `batchUpdateTargetsSchema` in `backend/src/validations/asset.ts`
  - [x] Schema: array of `{assetId: cuid2, targetPercentage: decimal}`
  - [x] Add validation that array is not empty
  - [x] Add tests for batch schema

- [x] Task 3: Target Sum Validation Logic (AC: #2, #3)
  - [x] Create `validateTargetsSum` function in `backend/src/services/assetService.ts`
  - [x] Query all user's assets and calculate total target percentage
  - [x] Accept new values to be applied (for pre-validation)
  - [x] Return `{ valid: boolean, currentSum: number, difference: number }`

- [x] Task 4: Update Asset Service for Target Updates (AC: #1, #2, #3)
  - [x] Modify `assetService.update()` to validate target sum after update
  - [x] On validation failure, return error with current sum details
  - [x] Ensure update is rejected if sum would exceed/fall short of 100%

- [x] Task 5: Batch Update Targets Service Method (AC: #4)
  - [x] Create `assetService.batchUpdateTargets(userId, updates[])`
  - [x] Validate all assetIds belong to user (ownership check)
  - [x] Validate sum of ALL targets (existing + updated) equals 100%
  - [x] Use Prisma transaction for atomic update
  - [x] Return updated assets array

- [x] Task 6: Batch Update Targets Route (AC: #4)
  - [x] Create `PUT /api/assets/targets` route in `backend/src/routes/assets.ts`
  - [x] Apply `validate(batchUpdateTargetsSchema)` middleware
  - [x] Call `assetService.batchUpdateTargets()`
  - [x] Return `{ data: Asset[], message: "Targets updated successfully" }`

- [x] Task 7: Tests for Target Validation (AC: #1, #2, #3, #4)
  - [x] Test single asset target update with valid sum
  - [x] Test single asset target update with invalid sum (error case)
  - [x] Test batch update with valid sum (all succeed)
  - [x] Test batch update with invalid sum (all fail, atomic)
  - [x] Test batch update with invalid assetId (ownership failure)
  - [x] Test edge cases: 0%, 100% single asset, decimal precision

### Review Follow-ups (AI)

- [x] [AI-Review][CRITICAL] Fix Decimal handling redundancy in `validateTargetsSum()` - Remove defensive typeof check and handle null/undefined explicitly [assetService.ts:35-38, 125-151]
- [x] [AI-Review][CRITICAL] Review test mocks for `targetPercentage` - Ensure mocks match Prisma Decimal behavior consistently [assetService.test.ts:22-32, 304-400]
- [x] [AI-Review][MEDIUM] Add missing test: Single asset invalid batch update - Update 1 of 3 assets where resulting sum < 100 [assetService.test.ts:500-698]
- [x] [AI-Review][MEDIUM] Add validation test for negative string values - Test `"-1"` is rejected after coercion [asset.test.ts:256-264]
- [x] [AI-Review][MEDIUM] Complete JSDoc @returns type for new methods - Add explicit return types to `validateTargetsSum()` and `batchUpdateTargets()` [assetService.ts:125-128, 161-203]
- [x] [AI-Review][MEDIUM] Improve error message clarity - Change "would be" to "is" for better user understanding [assetService.ts:94, 186]
- [x] [AI-Review][LOW] Add edge case test - Validate all assets can be 0% except one (cash-only portfolio) [assetService.test.ts:635-654]
- [x] [AI-Review][LOW] Extract magic number to constant - Define `const TARGET_SUM_REQUIRED = 100` for consistency [assetService.ts:43-45, 147]

## Dev Notes

### Critical Architecture Patterns

**IMPORTANT - Build on Story 2.1:**
This story extends the Asset CRUD implementation from Story 2.1. The Asset model already has `targetPercentage Decimal @default(0)` field. We're adding:
1. Validation that targets sum to 100% across all user's assets
2. Batch update endpoint for atomic multi-asset target updates

**Target Percentage Business Rules:**
- Each asset has a `targetPercentage` (0-100)
- Sum of ALL user's assets' targetPercentage MUST equal exactly 100%
- Single asset updates must be validated against the total
- Batch updates validate the final sum before any changes
- Atomic operations: either all targets update or none do

**Decimal Precision:**
- Use `Decimal` type from Prisma (already configured in schema)
- Allow 2 decimal places (e.g., 33.33%)
- Sum validation must account for floating point: use `Decimal.js` or similar
- Consider tolerance of 0.01 for sum validation (99.99-100.01 acceptable)

### Extended Validation Schema

```typescript
// backend/src/validations/asset.ts (additions)
import { z } from 'zod'

// Target percentage: 0-100 with 2 decimal precision
export const targetPercentageSchema = z.coerce
  .number()
  .min(0, 'Target must be at least 0%')
  .max(100, 'Target cannot exceed 100%')
  .transform(val => Math.round(val * 100) / 100) // Round to 2 decimals

// Add to updateAssetSchema
export const updateAssetSchema = z.object({
  ticker: z.string().trim().min(1).max(20).toUpperCase().optional(),
  name: z.string().trim().min(1).max(100).optional(),
  category: assetCategorySchema.optional(),
  targetPercentage: targetPercentageSchema.optional(),
})

// Batch update targets
export const batchUpdateTargetsSchema = z.object({
  targets: z.array(z.object({
    assetId: z.string().cuid(),
    targetPercentage: targetPercentageSchema,
  })).min(1, 'At least one target update required'),
})

export type BatchUpdateTargetsInput = z.infer<typeof batchUpdateTargetsSchema>
```

### Service Implementation Pattern

```typescript
// backend/src/services/assetService.ts (additions)
import { Decimal } from '@prisma/client/runtime/library'

/**
 * Validate that targets sum to 100%
 * @param userId - The user's ID
 * @param pendingUpdates - Map of assetId -> new targetPercentage to apply
 * @returns Validation result with current sum
 */
async validateTargetsSum(
  userId: string, 
  pendingUpdates?: Map<string, number>
): Promise<{ valid: boolean; sum: number; difference: number }> {
  const { assets } = await this.list(userId)
  
  let sum = 0
  for (const asset of assets) {
    const newTarget = pendingUpdates?.get(asset.id)
    const targetValue = newTarget !== undefined 
      ? newTarget 
      : Number(asset.targetPercentage)
    sum += targetValue
  }
  
  // Round to avoid floating point issues
  sum = Math.round(sum * 100) / 100
  const difference = Math.round((sum - 100) * 100) / 100
  
  return {
    valid: sum === 100,
    sum,
    difference,
  }
},

/**
 * Update targets for multiple assets atomically
 * @param userId - The user's ID
 * @param updates - Array of { assetId, targetPercentage }
 * @returns Array of updated assets
 * @throws ValidationError if sum doesn't equal 100%
 * @throws NotFoundError if any assetId doesn't belong to user
 */
async batchUpdateTargets(
  userId: string, 
  updates: Array<{ assetId: string; targetPercentage: number }>
) {
  // 1. Verify all assets belong to user
  const assetIds = updates.map(u => u.assetId)
  const userAssets = await prisma.asset.findMany({
    where: { userId, id: { in: assetIds } },
    select: { id: true },
  })
  
  if (userAssets.length !== assetIds.length) {
    const foundIds = new Set(userAssets.map(a => a.id))
    const missingIds = assetIds.filter(id => !foundIds.has(id))
    throw Errors.notFound(`Assets not found: ${missingIds.join(', ')}`)
  }
  
  // 2. Build pending updates map
  const pendingUpdates = new Map(
    updates.map(u => [u.assetId, u.targetPercentage])
  )
  
  // 3. Validate sum would equal 100%
  const validation = await this.validateTargetsSum(userId, pendingUpdates)
  if (!validation.valid) {
    throw Errors.validation(
      `Targets must sum to 100%. Current sum: ${validation.sum}%`,
      { sum: validation.sum, difference: validation.difference }
    )
  }
  
  // 4. Atomic update using transaction
  const updatedAssets = await prisma.$transaction(
    updates.map(({ assetId, targetPercentage }) =>
      prisma.asset.update({
        where: { id: assetId },
        data: { targetPercentage },
      })
    )
  )
  
  return updatedAssets
}
```

### Route Implementation

```typescript
// backend/src/routes/assets.ts (additions)

/**
 * PUT /api/assets/targets
 * Batch update target percentages for multiple assets
 * All targets must sum to exactly 100%
 */
router.put(
  '/targets',
  validate(batchUpdateTargetsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { targets } = req.body as BatchUpdateTargetsInput
      const updatedAssets = await assetService.batchUpdateTargets(req.user!.id, targets)
      res.json({ 
        data: updatedAssets, 
        message: 'Targets updated successfully' 
      })
    } catch (error) {
      next(error)
    }
  }
)

// IMPORTANT: Place this route BEFORE '/:id' routes to avoid matching 'targets' as an ID
```

### API Response Examples

**Single Asset Target Update (Success):**
```json
PUT /api/assets/clx123
{
  "targetPercentage": 60
}

Response 200:
{
  "data": {
    "id": "clx123",
    "ticker": "VOO",
    "name": "Vanguard S&P 500 ETF",
    "category": "ETF",
    "targetPercentage": "60",
    "createdAt": "2026-01-07T12:00:00.000Z",
    "updatedAt": "2026-01-07T15:30:00.000Z",
    "userId": "clx..."
  }
}
```

**Single Asset Target Update (Validation Error):**
```json
PUT /api/assets/clx123
{
  "targetPercentage": 80
}

Response 400:
{
  "error": "VALIDATION_ERROR",
  "message": "Targets must sum to 100%. Current sum: 120%",
  "details": { 
    "sum": 120, 
    "difference": 20 
  }
}
```

**Batch Update Targets (Success):**
```json
PUT /api/assets/targets
{
  "targets": [
    { "assetId": "clx123", "targetPercentage": 60 },
    { "assetId": "clx456", "targetPercentage": 25 },
    { "assetId": "clx789", "targetPercentage": 15 }
  ]
}

Response 200:
{
  "data": [
    { "id": "clx123", "ticker": "VOO", "targetPercentage": "60", ... },
    { "id": "clx456", "ticker": "GLD", "targetPercentage": "25", ... },
    { "id": "clx789", "ticker": "BTC", "targetPercentage": "15", ... }
  ],
  "message": "Targets updated successfully"
}
```

**Batch Update Targets (Validation Error):**
```json
PUT /api/assets/targets
{
  "targets": [
    { "assetId": "clx123", "targetPercentage": 60 },
    { "assetId": "clx456", "targetPercentage": 30 }
  ]
}

Response 400:
{
  "error": "VALIDATION_ERROR",
  "message": "Targets must sum to 100%. Current sum: 90%",
  "details": { 
    "sum": 90, 
    "difference": -10 
  }
}
```

### Project Structure Notes

Files to modify:
```
backend/
├── src/
│   ├── routes/
│   │   └── assets.ts           # Add PUT /api/assets/targets route
│   ├── services/
│   │   ├── assetService.ts     # Add validateTargetsSum, batchUpdateTargets, modify update
│   │   └── assetService.test.ts # Add tests for new methods
│   └── validations/
│       ├── asset.ts            # Add targetPercentageSchema, batchUpdateTargetsSchema
│       └── asset.test.ts       # Add tests for new schemas
```

### Testing Strategy

**Unit Tests for Validation (asset.test.ts):**
- `targetPercentageSchema` accepts 0, 50, 100
- `targetPercentageSchema` rejects -1, 101
- `targetPercentageSchema` rounds to 2 decimals (33.333 -> 33.33)
- `batchUpdateTargetsSchema` requires non-empty array
- `batchUpdateTargetsSchema` validates each item structure

**Unit Tests for Service (assetService.test.ts):**
- `validateTargetsSum` returns valid:true when sum is 100
- `validateTargetsSum` returns valid:false with difference when sum != 100
- `validateTargetsSum` correctly applies pending updates
- `batchUpdateTargets` succeeds with valid sum
- `batchUpdateTargets` fails with invalid sum (no changes made)
- `batchUpdateTargets` fails if assetId doesn't belong to user
- `update` with targetPercentage validates sum before applying

**Edge Cases:**
- Single asset with 100% target (valid)
- All assets with 0% target (invalid - sum is 0)
- Decimal targets: 33.33 + 33.33 + 33.34 = 100 (valid)
- Floating point edge: 33.33 + 33.33 + 33.33 = 99.99 (use tolerance?)

### Previous Story Intelligence

From Story 2.1 implementation:
- Asset model already has `targetPercentage Decimal @default(0)`
- `assetService` pattern established with ownership verification
- Routes use `validate()` and `validateParams()` middleware
- Tests use Vitest with mocked Prisma client
- JSDoc comments expected on service methods
- CUID validation for IDs in params

### Important Implementation Notes

1. **Route Order Matters:** Place `/targets` route BEFORE `/:id` routes in Express
2. **Decimal Handling:** Prisma returns `Decimal` objects, convert to `Number` for calculations
3. **Transaction:** Use `prisma.$transaction()` for atomic batch updates
4. **Error Messages:** Include helpful context (current sum, difference) in validation errors
5. **Existing Tests:** Don't break the 97 existing tests from Story 2.1

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.2-Target-Percentage-Assignment]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data-Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#API-Response-Format]
- [Source: _bmad-output/planning-artifacts/prd.md#FR4-FR5]
- [Source: _bmad-output/implementation-artifacts/2-1-asset-crud-api-database-model.md]
- [Source: backend/src/services/assetService.ts]
- [Source: backend/src/validations/asset.ts]
- [Source: backend/prisma/schema.prisma]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4 (claude-sonnet-4-20250514)

### Debug Log References

### Completion Notes List

- **Task 1 (2026-01-07):** Implemented `targetPercentageSchema` with 0-100 range validation and 2-decimal rounding. Extended `updateAssetSchema` to include optional `targetPercentage`. Added 12 new tests covering validation, coercion, rounding, and edge cases.
- **Task 2 (2026-01-07):** Created `batchUpdateTargetsSchema` with array of `{assetId, targetPercentage}` using `z.cuid2()` (Zod v4 top-level validator). Added `BatchUpdateTargetsInput` type export. Added 10 new tests for batch schema validation.
- **Task 3 (2026-01-07):** Implemented `validateTargetsSum()` function in assetService. Queries all user assets, calculates sum with optional pending updates for pre-validation. Returns `{valid, sum, difference}` with 2-decimal rounding. Added 7 new tests.
- **Task 4 (2026-01-07):** Modified `assetService.update()` to validate target sum when updating `targetPercentage`. Rejects with ValidationError including sum/difference details if sum ≠ 100%. Non-targetPercentage updates bypass validation. Added 5 new tests.
- **Task 5 (2026-01-07):** Implemented `batchUpdateTargets()` for atomic multi-asset target updates. Verifies ownership, validates sum=100%, uses `prisma.$transaction()`. Added 6 new tests.
- **Task 6 (2026-01-07):** Created `PUT /api/assets/targets` route. Placed before `/:id` routes to avoid conflicts. Uses batchUpdateTargetsSchema validation and returns updated assets with success message.
- **Task 7 (2026-01-07):** Added edge case tests: single asset 100%, batch 0%+100%, decimal precision (33.33+33.33+33.34=100), reject all 0%. Total: 141 tests passing.
- **Code Review (2026-01-07):** Adversarial code review completed. Found 9 issues: 2 CRITICAL (Decimal handling redundancy, test mocks inconsistency), 4 MEDIUM (missing tests, incomplete JSDoc, error message clarity), 3 LOW (edge case tests, magic numbers). Created 8 action items for follow-up. All ACs verified as implemented.

### File List

- `backend/src/validations/asset.ts` (modified)
- `backend/src/validations/asset.test.ts` (modified)
- `backend/src/services/assetService.ts` (modified)
- `backend/src/services/assetService.test.ts` (modified)
- `backend/src/routes/assets.ts` (modified)

