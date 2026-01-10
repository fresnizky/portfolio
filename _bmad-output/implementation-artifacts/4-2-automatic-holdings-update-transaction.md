# Story 4.2: Automatic Holdings Update on Transaction

Status: done

## Story

As a **user**,
I want **my holdings to update automatically when I record transactions**,
So that **I don't have to manually update quantities**.

## Acceptance Criteria

1. **Given** I have 10 units of VOO, **When** I record a buy transaction for 5 units of VOO, **Then** my VOO holding is automatically updated to 15 units

2. **Given** I have 10 units of VOO, **When** I record a sell transaction for 3 units of VOO, **Then** my VOO holding is automatically updated to 7 units

3. **Given** I have no holding for GLD, **When** I record a buy transaction for 2 units of GLD, **Then** a new holding is created with 2 units of GLD

4. **Given** I record a transaction, **When** the transaction fails validation, **Then** the holding remains unchanged (atomic operation)

5. **Given** I have 5 units of BTC, **When** I record a sell transaction for 5 units of BTC, **Then** my BTC holding is updated to 0 (not deleted)

## Tasks / Subtasks

- [x] Task 1: Modify transactionService.create to update holdings atomically (AC: #1, #2, #3, #4, #5)
  - [x] Wrap transaction creation and holding update in a Prisma transaction
  - [x] For BUY: add quantity to holding (create if doesn't exist)
  - [x] For SELL: subtract quantity from holding
  - [x] Ensure atomicity - if either fails, rollback both
  - [x] Update existing unit tests in `transactionService.test.ts`

- [x] Task 2: Update integration tests (AC: #1, #2, #3, #4, #5)
  - [x] Add tests verifying holdings update after buy transaction
  - [x] Add tests verifying holdings update after sell transaction
  - [x] Add tests for new holding creation on first buy
  - [x] Add tests for atomicity (failed transaction = unchanged holding)
  - [x] Add tests for selling all units (quantity = 0, not deleted)
  - [x] Verify existing transaction tests still pass

## Dev Notes

### Critical Implementation Detail

**MODIFY EXISTING SERVICE - DO NOT CREATE NEW FILES**

This story modifies `transactionService.create()` in `backend/src/services/transactionService.ts`. The entire change is contained within this single function using Prisma transactions.

### Prisma Transaction Pattern

```typescript
// backend/src/services/transactionService.ts
async create(userId: string, input: CreateTransactionInput) {
  // Verify asset belongs to user (existing code)
  const asset = await prisma.asset.findFirst({
    where: { id: input.assetId, userId },
  })

  if (!asset) {
    throw Errors.notFound('Asset')
  }

  // For SELL, validate sufficient holdings (existing code)
  if (input.type === 'sell') {
    await this.validateSellQuantity(userId, input.assetId, input.quantity)
  }

  // Calculate amounts in cents (existing code)
  const priceCents = toCents(input.price)
  const commissionCents = toCents(input.commission)
  const baseAmountCents = BigInt(Math.round(input.quantity * Number(priceCents)))
  const totalCents = input.type === 'buy'
    ? baseAmountCents + commissionCents
    : baseAmountCents - commissionCents

  // NEW: Atomic transaction - transaction + holding update
  const result = await prisma.$transaction(async (tx) => {
    // Create the transaction record
    const transaction = await tx.transaction.create({
      data: {
        type: input.type.toUpperCase() as 'BUY' | 'SELL',
        date: new Date(input.date),
        quantity: input.quantity,
        priceCents,
        commissionCents,
        totalCents,
        userId,
        assetId: input.assetId,
      },
      include: {
        asset: { select: { ticker: true, name: true } },
      },
    })

    // Update or create holding
    const existingHolding = await tx.holding.findUnique({
      where: { assetId: input.assetId },
    })

    if (existingHolding) {
      // Update existing holding
      const currentQty = Number(existingHolding.quantity.toString())
      const newQty = input.type === 'buy'
        ? currentQty + input.quantity
        : currentQty - input.quantity

      await tx.holding.update({
        where: { assetId: input.assetId },
        data: { quantity: newQty },
      })
    } else {
      // Create new holding (only for BUY - SELL already validated above)
      await tx.holding.create({
        data: {
          userId,
          assetId: input.assetId,
          quantity: input.quantity,
        },
      })
    }

    return transaction
  })

  return formatTransaction(result)
}
```

### Key Implementation Notes

1. **Use Prisma `$transaction()`** - The interactive transaction API (`prisma.$transaction(async (tx) => {...})`) ensures atomicity. All operations use `tx` instead of `prisma`.

2. **Holding update logic:**
   - BUY: `newQty = currentQty + transactionQty`
   - SELL: `newQty = currentQty - transactionQty`
   - First BUY (no holding exists): Create new holding with `transactionQty`

3. **Decimal handling:** Convert `Decimal` to number for arithmetic, store back as number (Prisma handles conversion).

4. **Atomicity guarantee:** If transaction creation succeeds but holding update fails, both are rolled back. If validateSellQuantity throws, nothing is committed.

5. **Sell to zero:** Selling all units sets quantity to 0. The holding record is NOT deleted.

### Existing Code to Modify

**File:** `backend/src/services/transactionService.ts`

Current `create` method (lines 48-96) creates transaction without updating holdings. Replace the `prisma.transaction.create()` call with the `prisma.$transaction()` block above.

### Testing Strategy

**Modify existing integration tests in:** `backend/src/routes/transactions.integration.test.ts`

Add these test scenarios:

```typescript
describe('Holdings update on transaction', () => {
  it('should increase holding quantity on buy transaction', async () => {
    // Setup: Create asset with initial holding of 10 units
    // Action: POST buy transaction for 5 units
    // Assert: GET holdings shows 15 units
  })

  it('should decrease holding quantity on sell transaction', async () => {
    // Setup: Create asset with holding of 10 units
    // Action: POST sell transaction for 3 units
    // Assert: GET holdings shows 7 units
  })

  it('should create new holding on first buy', async () => {
    // Setup: Create asset with NO holding
    // Action: POST buy transaction for 2 units
    // Assert: GET holdings shows 2 units
  })

  it('should not modify holding if transaction validation fails', async () => {
    // Setup: Create asset with 5 units
    // Action: POST sell transaction for 10 units (should fail)
    // Assert: GET holdings still shows 5 units
  })

  it('should set holding to zero when selling all units', async () => {
    // Setup: Create asset with 5 units
    // Action: POST sell transaction for 5 units
    // Assert: GET holdings shows 0 units (not deleted)
  })
})
```

### Anti-Patterns to Avoid

```typescript
// ❌ WRONG - Separate operations without transaction
await prisma.transaction.create({ ... })
await prisma.holding.update({ ... })  // Not atomic!

// ✅ CORRECT - Use Prisma transaction
await prisma.$transaction(async (tx) => {
  await tx.transaction.create({ ... })
  await tx.holding.update({ ... })
})

// ❌ WRONG - Deleting holding when quantity is 0
if (newQty === 0) {
  await tx.holding.delete({ where: { assetId } })
}

// ✅ CORRECT - Keep holding with quantity 0
await tx.holding.update({
  where: { assetId },
  data: { quantity: 0 },
})

// ❌ WRONG - Using prisma inside transaction block
await prisma.$transaction(async (tx) => {
  await prisma.holding.update({ ... })  // WRONG! Use tx
})

// ✅ CORRECT - Use tx for all operations
await prisma.$transaction(async (tx) => {
  await tx.holding.update({ ... })  // Use tx
})
```

### Project Structure (Files to Modify)

```
backend/
└── src/
    ├── services/
    │   ├── transactionService.ts       # MODIFY: Add atomic holding update
    │   └── transactionService.test.ts  # MODIFY: Update mocks for transaction
    │
    └── routes/
        └── transactions.integration.test.ts # MODIFY: Add holdings verification tests
```

### Previous Story Learnings (4.1)

1. **BigInt for money values**: Prices and totals stored in cents as BigInt
2. **Decimal for quantities**: Prisma Decimal with `@db.Decimal(18, 8)` for fractional units
3. **Asset ownership validation**: Already implemented in transactionService.create
4. **Sell validation**: Already checks holdings before allowing sell
5. **Error patterns**: Use `Errors.validation()` with details object

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.2]
- [Source: _bmad-output/implementation-artifacts/4-1-transaction-recording-api.md]
- [Source: backend/src/services/transactionService.ts]
- [Source: backend/src/services/holdingService.ts]
- [Source: backend/prisma/schema.prisma]
- [Source: Prisma Transactions Docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - Implementation completed without issues.

### Completion Notes List

- Modified `transactionService.create()` to use `prisma.$transaction()` for atomic transaction + holding updates
- BUY transactions: increment holding quantity (create if first buy)
- SELL transactions: decrement holding quantity (set to 0 when selling all, not delete)
- Added 5 unit tests for atomic holding update behavior
- Added 7 integration tests covering all 5 acceptance criteria
- Fixed `vitest.integration.config.ts` to include `*.integration.test.ts` pattern
- All 430 tests passing (375 unit + 55 integration)

### File List

- `backend/src/services/transactionService.ts` (modified)
- `backend/src/services/transactionService.test.ts` (modified)
- `backend/src/routes/transactions.integration.test.ts` (modified)
- `backend/vitest.integration.config.ts` (modified)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified)
- `_bmad-output/implementation-artifacts/4-2-automatic-holdings-update-transaction.md` (modified)

