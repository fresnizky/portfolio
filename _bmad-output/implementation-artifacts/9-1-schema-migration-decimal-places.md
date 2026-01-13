# Story 9.1: Schema Migration - Decimal Fields & decimalPlaces

Status: done

## Story

As a **developer maintaining data integrity**,
I want **the database schema to use Decimal fields instead of *Cents fields for transactions**,
so that **high-precision quantities (like BTC with 8 decimals) are stored correctly without truncation**.

## Problem Description

El modelo actual de Transaction usa campos `*Cents` como `BigInt`:
- `priceCents BigInt` - Precio por unidad en centavos
- `commissionCents BigInt @default(0)` - Comisión en centavos
- `totalCents BigInt` - Total calculado en centavos

Este diseño asume 2 decimales fijos (centavos), lo cual es incompatible con:
- **Crypto (8 decimales):** BTC usa satoshis (0.00000001)
- **FCIs argentinos (6 decimales):** Cuotapartes con precisión de 6 decimales
- **ETFs (4 decimales):** Acciones fraccionarias

**Problema observado:** Transacciones con cantidades precisas (ej: 0.00012345 BTC) se guardan como `quantity: 0.00000000` y `totalCents: 0` en la base de datos.

## Acceptance Criteria

1. **Given** the Prisma schema
   **When** I review the Transaction model
   **Then** I see `price Decimal`, `commission Decimal`, `total Decimal` instead of `*Cents BigInt`

2. **Given** the Asset model
   **When** I review its fields
   **Then** I see a new `decimalPlaces Int @default(2)` field

3. **Given** an existing asset with category CRYPTO
   **When** I check its default decimalPlaces after migration
   **Then** it should be 8 (for satoshi precision)

4. **Given** an existing asset with category FCI
   **When** I check its default decimalPlaces after migration
   **Then** it should be 6 (for cuotapartes precision)

5. **Given** an existing asset with category ETF or CASH
   **When** I check its default decimalPlaces after migration
   **Then** it should be 2 (standard cents precision)

6. **Given** a fresh Prisma migration
   **When** I run `npx prisma migrate dev`
   **Then** the migration applies successfully without data loss

7. **Given** the currentPriceCents field on Asset
   **When** I review the schema after migration
   **Then** it should be renamed to `currentPrice Decimal` (BigInt -> Decimal)

## Tasks / Subtasks

- [x] Task 1: Update Prisma schema with new Decimal fields (AC: #1, #2)
  - [x] 1.1 Add `decimalPlaces Int @default(2)` to Asset model
  - [x] 1.2 Change Transaction model: `priceCents BigInt` -> `price Decimal @db.Decimal(18, 8)`
  - [x] 1.3 Change Transaction model: `commissionCents BigInt` -> `commission Decimal @db.Decimal(18, 8) @default(0)`
  - [x] 1.4 Change Transaction model: `totalCents BigInt` -> `total Decimal @db.Decimal(18, 8)`
  - [x] 1.5 Change Asset model: `currentPriceCents BigInt?` -> `currentPrice Decimal? @db.Decimal(18, 8)`
  - [x] 1.6 Change SnapshotAsset model: `priceCents BigInt` -> `price Decimal @db.Decimal(18, 8)`
  - [x] 1.7 Change SnapshotAsset model: `valueCents BigInt` -> `value Decimal @db.Decimal(18, 8)`
  - [x] 1.8 Change PortfolioSnapshot model: `totalValueCents BigInt` -> `totalValue Decimal @db.Decimal(18, 8)`

- [x] Task 2: Create Prisma migration with data conversion (AC: #6)
  - [x] 2.1 Create migration file with proper SQL for column type changes
  - [x] 2.2 Add SQL to convert existing `*Cents` values by dividing by 100
  - [x] 2.3 Verify migration works on test database

- [x] Task 3: Set default decimalPlaces based on category (AC: #3, #4, #5)
  - [x] 3.1 Create SQL update statement to set decimalPlaces = 8 for CRYPTO assets
  - [x] 3.2 Create SQL update statement to set decimalPlaces = 6 for FCI assets
  - [x] 3.3 Keep decimalPlaces = 2 (default) for ETF and CASH assets
  - [x] 3.4 Add data migration step to migration file

- [x] Task 4: Verify migration integrity (AC: #6)
  - [x] 4.1 Run migration on local development database
  - [x] 4.2 Verify all existing data is correctly converted
  - [x] 4.3 Verify Prisma client regenerates with new types

## Dev Notes

### Current Schema (BEFORE)

```prisma
model Asset {
  id               String        @id @default(cuid())
  ticker           String
  name             String
  category         AssetCategory
  currency         Currency      @default(USD)
  targetPercentage Decimal       @default(0)
  currentPriceCents BigInt?      // <-- Problem: Uses cents (2 decimals)
  priceUpdatedAt   DateTime?
  // ... other fields
}

model Transaction {
  id              String          @id @default(cuid())
  type            TransactionType
  date            DateTime
  quantity        Decimal         @db.Decimal(18, 8)  // Already correct!
  priceCents      BigInt          // <-- Problem: Uses cents
  commissionCents BigInt          @default(0)  // <-- Problem
  totalCents      BigInt          // <-- Problem
  // ... other fields
}

model SnapshotAsset {
  // ...
  priceCents BigInt      // <-- Problem
  valueCents BigInt      // <-- Problem
  // ...
}

model PortfolioSnapshot {
  // ...
  totalValueCents BigInt  // <-- Problem
  // ...
}
```

### Target Schema (AFTER)

```prisma
model Asset {
  id               String        @id @default(cuid())
  ticker           String
  name             String
  category         AssetCategory
  currency         Currency      @default(USD)
  decimalPlaces    Int           @default(2)  // NEW: 2=USD, 8=BTC, 6=FCI
  targetPercentage Decimal       @default(0)
  currentPrice     Decimal?      @db.Decimal(18, 8)  // Renamed from currentPriceCents
  priceUpdatedAt   DateTime?
  // ... other fields
}

model Transaction {
  id              String          @id @default(cuid())
  type            TransactionType
  date            DateTime
  quantity        Decimal         @db.Decimal(18, 8)  // Already correct
  price           Decimal         @db.Decimal(18, 8)  // Changed from priceCents
  commission      Decimal         @db.Decimal(18, 8) @default(0)  // Changed
  total           Decimal         @db.Decimal(18, 8)  // Changed from totalCents
  // ... other fields
}

model SnapshotAsset {
  // ...
  price      Decimal  @db.Decimal(18, 8)  // Changed from priceCents
  value      Decimal  @db.Decimal(18, 8)  // Changed from valueCents
  // ...
}

model PortfolioSnapshot {
  // ...
  totalValue Decimal  @db.Decimal(18, 8)  // Changed from totalValueCents
  // ...
}
```

### Default decimalPlaces by Category

```typescript
const DEFAULT_DECIMAL_PLACES: Record<AssetCategory, number> = {
  CRYPTO: 8,      // BTC, ETH - satoshi/wei precision
  ETF: 4,         // Acciones fraccionarias
  FCI: 6,         // Cuotapartes argentinas
  CASH: 2,        // USD, ARS - centavos
}
```

### Migration SQL Example

```sql
-- Add decimalPlaces column with default
ALTER TABLE "Asset" ADD COLUMN "decimalPlaces" INTEGER NOT NULL DEFAULT 2;

-- Set decimalPlaces based on category
UPDATE "Asset" SET "decimalPlaces" = 8 WHERE "category" = 'CRYPTO';
UPDATE "Asset" SET "decimalPlaces" = 6 WHERE "category" = 'FCI';
-- ETF and CASH keep default 2

-- Rename and convert Transaction columns
ALTER TABLE "Transaction" RENAME COLUMN "priceCents" TO "price";
ALTER TABLE "Transaction" ALTER COLUMN "price" TYPE DECIMAL(18, 8) USING price::DECIMAL / 100;

ALTER TABLE "Transaction" RENAME COLUMN "commissionCents" TO "commission";
ALTER TABLE "Transaction" ALTER COLUMN "commission" TYPE DECIMAL(18, 8) USING commission::DECIMAL / 100;

ALTER TABLE "Transaction" RENAME COLUMN "totalCents" TO "total";
ALTER TABLE "Transaction" ALTER COLUMN "total" TYPE DECIMAL(18, 8) USING total::DECIMAL / 100;

-- Rename and convert Asset.currentPriceCents
ALTER TABLE "Asset" RENAME COLUMN "currentPriceCents" TO "currentPrice";
ALTER TABLE "Asset" ALTER COLUMN "currentPrice" TYPE DECIMAL(18, 8) USING "currentPrice"::DECIMAL / 100;

-- Convert SnapshotAsset columns
ALTER TABLE "SnapshotAsset" RENAME COLUMN "priceCents" TO "price";
ALTER TABLE "SnapshotAsset" ALTER COLUMN "price" TYPE DECIMAL(18, 8) USING price::DECIMAL / 100;

ALTER TABLE "SnapshotAsset" RENAME COLUMN "valueCents" TO "value";
ALTER TABLE "SnapshotAsset" ALTER COLUMN "value" TYPE DECIMAL(18, 8) USING value::DECIMAL / 100;

-- Convert PortfolioSnapshot columns
ALTER TABLE "PortfolioSnapshot" RENAME COLUMN "totalValueCents" TO "totalValue";
ALTER TABLE "PortfolioSnapshot" ALTER COLUMN "totalValue" TYPE DECIMAL(18, 8) USING "totalValue"::DECIMAL / 100;
```

### Architecture Compliance

- **Prisma v7+:** No Rust engine, schema file at `backend/prisma/schema.prisma`
- **Decimal precision:** Use `@db.Decimal(18, 8)` for up to 8 decimal places
- **Naming:** camelCase for fields (price, commission, total - not price_cents)
- **Migrations:** Use Prisma Migrate with custom SQL when needed for data conversion

### Critical Considerations

1. **Data Preservation:** The migration MUST preserve existing transaction data by converting cents to decimal (divide by 100)

2. **Atomicity:** All schema changes should be in a single migration to maintain consistency

3. **Rollback Plan:** Keep backup of database before running migration in production

4. **Frontend Impact:** Stories 9-3 and 9-4 will update backend services and frontend types to use new field names

### Files to Modify

| File | Change |
|------|--------|
| `backend/prisma/schema.prisma` | Update Transaction, Asset, SnapshotAsset, PortfolioSnapshot models |
| `backend/prisma/migrations/[timestamp]_decimal_precision/migration.sql` | Created by Prisma with custom edits |

### Testing Approach

1. **Before Migration:**
   - Export current database state for verification
   - Note existing transaction values for comparison

2. **After Migration:**
   - Verify `price = priceCents / 100` for all transactions
   - Verify `total = totalCents / 100` for all transactions
   - Verify `commission = commissionCents / 100` for all transactions
   - Verify decimalPlaces is correctly set based on category
   - Run `npx prisma generate` and verify no TypeScript errors

### Previous Story Learnings

From Story 8-4 (BTC Decimal Precision):
- The `quantity` field already uses `Decimal(18, 8)` and is correct
- The problem is isolated to `*Cents` fields that assume 2 decimal places
- Pattern: Schema changes require coordinated updates across backend and frontend

### Git Commit Patterns (Recent)

Recent commits follow conventional commit format:
- `feat(shared):` for new shared functionality
- `fix(types):` for type-related fixes
- `fix(transactions):` for transaction-related fixes

**Recommended commit message:**
```
feat(prisma): migrate *Cents fields to Decimal for high-precision support

- Add decimalPlaces field to Asset model
- Convert Transaction fields: priceCents -> price, totalCents -> total
- Convert Asset.currentPriceCents -> currentPrice
- Set decimalPlaces defaults based on asset category
- Preserves existing data by dividing cents values by 100
```

### Dependencies

This story is a **blocker** for:
- Story 9-2: Data Migration & Cleanup (requires new schema)
- Story 9-3: Backend API & Types Update (requires new field names)
- Story 9-4: Frontend Types & API Update (requires backend changes)

### References

- [Source: sprint-change-proposal-2026-01-13.md] - Epic 9 requirements and rationale
- [Source: backend/prisma/schema.prisma] - Current schema with *Cents fields
- [Source: shared/schemas/transaction.ts] - Shared Zod schemas already using `price`, `commission`, `total`
- [Source: project-context.md#Database (Prisma)] - Prisma naming conventions
- [Source: architecture.md#Data Architecture] - Prisma v7+, Decimal usage patterns
- [Source: 8-4-fix-btc-decimal-precision.md] - Previous story showing quantity already correct

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - No debugging issues encountered

### Completion Notes List

- Updated Prisma schema with all Decimal fields using `@db.Decimal(18, 8)` precision
- Created migration `20260113000000_decimal_precision` with:
  - Addition of `decimalPlaces` column to Asset
  - Conversion of all `*Cents` BigInt fields to Decimal (dividing by 100)
  - Category-based defaults: CRYPTO=8, FCI=6, ETF/CASH=2
- Migration applied successfully to development database
- Prisma client regenerated with new types (v7.2.0)
- **Note:** Backend/frontend TypeScript errors are expected and will be resolved in Stories 9-3 and 9-4

### File List

- `backend/prisma/schema.prisma` - Updated models: Asset, Transaction, PortfolioSnapshot, SnapshotAsset
- `backend/prisma/migrations/20260113000000_decimal_precision/migration.sql` - New migration file

## Change Log

- 2026-01-13: Schema migration completed - all *Cents fields converted to Decimal with data preservation

