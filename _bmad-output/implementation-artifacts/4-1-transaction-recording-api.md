# Story 4.1: Transaction Recording API

Status: ready-for-dev

## Story

As a **user**,
I want **to record buy and sell transactions with all details**,
so that **I have a complete history of my investment movements**.

## Acceptance Criteria

1. **Given** I am authenticated, **When** I POST to `/api/transactions` with type "buy", assetId, date, quantity, price, and commission, **Then** a new buy transaction is created and returned

2. **Given** I am authenticated, **When** I POST to `/api/transactions` with type "sell", assetId, date, quantity, price, and commission, **Then** a new sell transaction is created and returned

3. **Given** a transaction is created, **When** I view the transaction details, **Then** I see totalCost calculated as (quantity × price) + commission for buys, **And** totalProceeds calculated as (quantity × price) - commission for sells

4. **Given** I create a transaction with missing required fields, **When** I POST to `/api/transactions`, **Then** I receive a 400 validation error with details of missing fields

5. **Given** I try to sell more than I hold, **When** I POST a sell transaction, **Then** I receive a validation error "Insufficient holdings"

## Tasks / Subtasks

- [x] Task 1: Add Transaction Model to Prisma Schema (AC: #1, #2, #3)
  - [x] Add `TransactionType` enum (BUY, SELL) to `backend/prisma/schema.prisma`
  - [x] Add `Transaction` model with: id, type, assetId, date, quantity, priceCents, commissionCents, totalCents, createdAt, updatedAt
  - [x] Add relation to Asset and User
  - [x] Run `npx prisma migrate dev --name add_transaction_model`
  - [x] Verify generated Prisma types

- [x] Task 2: Create Transaction Validation Schemas (AC: #1, #2, #4)
  - [x] Create `backend/src/validations/transaction.ts`
  - [x] Add `createTransactionSchema` with Zod (type, assetId, date, quantity, price, commission)
  - [x] Add `transactionListQuerySchema` for filtering (optional: assetId, type, fromDate, toDate)
  - [x] Add unit tests for validation schemas

- [x] Task 3: Create Transaction Service (AC: #1, #2, #3, #5)
  - [x] Create `backend/src/services/transactionService.ts`
  - [x] Implement `create(userId, input)` - creates transaction with calculated totalCents
  - [x] Implement `list(userId, filters?)` - lists user's transactions with optional filters
  - [x] Implement `getById(userId, transactionId)` - gets single transaction
  - [x] Add validation: check asset belongs to user
  - [x] Add validation: for SELL, check holding quantity >= transaction quantity
  - [x] Add unit tests in `backend/src/services/transactionService.test.ts`

- [ ] Task 4: Create Transaction Routes (AC: #1, #2, #3, #4, #5)
  - [ ] Create `backend/src/routes/transactions.ts`
  - [ ] Implement `POST /api/transactions` - create transaction
  - [ ] Implement `GET /api/transactions` - list transactions with filters
  - [ ] Implement `GET /api/transactions/:id` - get single transaction
  - [ ] Add routes to `backend/src/routes/index.ts`
  - [ ] Add unit tests in `backend/src/routes/transactions.test.ts`

- [ ] Task 5: Integration Testing (AC: #1, #2, #3, #4, #5)
  - [ ] Create `backend/src/routes/transactions.integration.test.ts`
  - [ ] Test buy transaction creation
  - [ ] Test sell transaction creation
  - [ ] Test sell validation (insufficient holdings)
  - [ ] Test validation errors
  - [ ] Test transaction listing with filters
  - [ ] Verify totalCost/totalProceeds calculations

## Dev Notes

### Database Model (Prisma)

```prisma
enum TransactionType {
  BUY
  SELL
}

model Transaction {
  id              String          @id @default(cuid())
  type            TransactionType
  date            DateTime
  quantity        Decimal         @db.Decimal(18, 8)
  priceCents      BigInt          // Price per unit in cents
  commissionCents BigInt          @default(0)
  totalCents      BigInt          // Calculated: (quantity × priceCents) ± commissionCents
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  // Relations
  userId  String
  user    User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  assetId String
  asset   Asset  @relation(fields: [assetId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([assetId])
  @@index([date])
}
```

**Note:** Also add `transactions Transaction[]` relation to User and Asset models.

### API Endpoints

**POST /api/transactions** - Create transaction
```typescript
// Request
{
  type: "buy" | "sell",
  assetId: string,
  date: string,        // ISO 8601 date string
  quantity: number,    // Decimal (e.g., 10.5)
  price: number,       // Decimal price per unit (e.g., 450.75)
  commission: number   // Decimal commission (e.g., 5.00), defaults to 0
}

// Response (201 Created)
{
  data: {
    id: string,
    type: "BUY" | "SELL",
    assetId: string,
    asset: { ticker: string, name: string },
    date: string,
    quantity: string,      // Decimal as string
    price: string,         // Decimal as string (e.g., "450.75")
    commission: string,    // Decimal as string
    totalCost: string,     // For BUY: (qty × price) + commission
    totalProceeds: string, // For SELL: (qty × price) - commission
    createdAt: string
  },
  message: "Transaction recorded"
}
```

**GET /api/transactions** - List transactions
```typescript
// Query params (all optional)
?assetId=clx123...
&type=buy|sell
&fromDate=2026-01-01
&toDate=2026-12-31

// Response
{
  data: Transaction[],
  meta: { total: number }
}
```

**GET /api/transactions/:id** - Get single transaction
```typescript
// Response
{
  data: Transaction
}

// 404 if not found or not user's transaction
```

### Total Calculation Logic (CRITICAL)

```typescript
// Convert price to cents
const priceCents = BigInt(Math.round(price * 100))
const commissionCents = BigInt(Math.round(commission * 100))
const quantityDecimal = new Decimal(quantity)

// Calculate base amount (quantity × priceCents)
// Note: quantity can have decimals (crypto), so we need Decimal math
const baseAmount = quantityDecimal.mul(priceCents.toString())

// Round to cents
const baseAmountCents = BigInt(baseAmount.round().toString())

// Apply commission based on type
const totalCents = type === 'BUY'
  ? baseAmountCents + commissionCents    // Buy: add commission to cost
  : baseAmountCents - commissionCents    // Sell: subtract commission from proceeds
```

### Sell Validation Logic

```typescript
async function validateSellQuantity(userId: string, assetId: string, quantity: Decimal): Promise<void> {
  // Get current holding for this asset
  const holding = await prisma.holding.findFirst({
    where: { userId, assetId }
  })

  if (!holding) {
    throw Errors.validation('Insufficient holdings', {
      available: '0',
      requested: quantity.toString()
    })
  }

  if (holding.quantity.lessThan(quantity)) {
    throw Errors.validation('Insufficient holdings', {
      available: holding.quantity.toString(),
      requested: quantity.toString()
    })
  }
}
```

### Validation Schema (Zod)

```typescript
// backend/src/validations/transaction.ts
import { z } from 'zod'

export const createTransactionSchema = z.object({
  type: z.enum(['buy', 'sell']),
  assetId: z.string().min(1, 'Asset ID is required'),
  date: z.string().datetime({ message: 'Invalid date format' }),
  quantity: z.number().positive('Quantity must be positive'),
  price: z.number().positive('Price must be positive'),
  commission: z.number().min(0, 'Commission cannot be negative').default(0),
})

export const transactionListQuerySchema = z.object({
  assetId: z.string().optional(),
  type: z.enum(['buy', 'sell']).optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type TransactionListQuery = z.infer<typeof transactionListQuerySchema>
```

### Service Pattern (from priceService.ts)

```typescript
// backend/src/services/transactionService.ts
import { prisma } from '@/config/database'
import { Errors } from '@/lib/errors'
import { Decimal } from '@prisma/client/runtime/library'
import type { CreateTransactionInput, TransactionListQuery } from '@/validations/transaction'

// Convert cents to decimal string for API response
function centsToDecimal(cents: bigint): string {
  const value = Number(cents) / 100
  return value.toFixed(2)
}

// Format transaction for API response
function formatTransaction(tx: TransactionWithAsset) {
  return {
    id: tx.id,
    type: tx.type,
    assetId: tx.assetId,
    asset: {
      ticker: tx.asset.ticker,
      name: tx.asset.name,
    },
    date: tx.date.toISOString(),
    quantity: tx.quantity.toString(),
    price: centsToDecimal(tx.priceCents),
    commission: centsToDecimal(tx.commissionCents),
    totalCost: tx.type === 'BUY' ? centsToDecimal(tx.totalCents) : undefined,
    totalProceeds: tx.type === 'SELL' ? centsToDecimal(tx.totalCents) : undefined,
    createdAt: tx.createdAt.toISOString(),
  }
}

export const transactionService = {
  async create(userId: string, input: CreateTransactionInput) {
    // Verify asset belongs to user
    const asset = await prisma.asset.findFirst({
      where: { id: input.assetId, userId }
    })

    if (!asset) {
      throw Errors.notFound('Asset')
    }

    const quantity = new Decimal(input.quantity)

    // For SELL, validate sufficient holdings
    if (input.type === 'sell') {
      await this.validateSellQuantity(userId, input.assetId, quantity)
    }

    // Calculate amounts in cents
    const priceCents = BigInt(Math.round(input.price * 100))
    const commissionCents = BigInt(Math.round(input.commission * 100))

    // quantity × priceCents (handle decimal quantity)
    const baseAmount = quantity.mul(priceCents.toString())
    const baseAmountCents = BigInt(baseAmount.round().toString())

    // totalCents based on type
    const totalCents = input.type === 'buy'
      ? baseAmountCents + commissionCents
      : baseAmountCents - commissionCents

    const transaction = await prisma.transaction.create({
      data: {
        type: input.type.toUpperCase() as 'BUY' | 'SELL',
        date: new Date(input.date),
        quantity,
        priceCents,
        commissionCents,
        totalCents,
        userId,
        assetId: input.assetId,
      },
      include: {
        asset: { select: { ticker: true, name: true } }
      }
    })

    return formatTransaction(transaction)
  },

  async validateSellQuantity(userId: string, assetId: string, quantity: Decimal) {
    const holding = await prisma.holding.findFirst({
      where: { userId, assetId }
    })

    if (!holding || holding.quantity.lessThan(quantity)) {
      throw Errors.validation('Insufficient holdings', {
        available: holding?.quantity.toString() || '0',
        requested: quantity.toString()
      })
    }
  },

  async list(userId: string, query?: TransactionListQuery) {
    const where: any = { userId }

    if (query?.assetId) where.assetId = query.assetId
    if (query?.type) where.type = query.type.toUpperCase()
    if (query?.fromDate || query?.toDate) {
      where.date = {}
      if (query.fromDate) where.date.gte = new Date(query.fromDate)
      if (query.toDate) where.date.lte = new Date(query.toDate)
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { asset: { select: { ticker: true, name: true } } },
        orderBy: { date: 'desc' },
      }),
      prisma.transaction.count({ where }),
    ])

    return {
      transactions: transactions.map(formatTransaction),
      total,
    }
  },

  async getById(userId: string, transactionId: string) {
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, userId },
      include: { asset: { select: { ticker: true, name: true } } },
    })

    if (!transaction) {
      throw Errors.notFound('Transaction')
    }

    return formatTransaction(transaction)
  },
}
```

### Routes Pattern (from prices.ts)

```typescript
// backend/src/routes/transactions.ts
import { Router } from 'express'
import { transactionService } from '@/services/transactionService'
import { validate } from '@/middleware/validate'
import { createTransactionSchema, transactionListQuerySchema } from '@/validations/transaction'

const router = Router()

// POST /api/transactions - Create transaction
router.post('/', validate(createTransactionSchema), async (req, res) => {
  const transaction = await transactionService.create(req.user!.id, req.body)
  res.status(201).json({ data: transaction, message: 'Transaction recorded' })
})

// GET /api/transactions - List transactions
router.get('/', async (req, res) => {
  const query = transactionListQuerySchema.parse(req.query)
  const { transactions, total } = await transactionService.list(req.user!.id, query)
  res.json({ data: transactions, meta: { total } })
})

// GET /api/transactions/:id - Get single transaction
router.get('/:id', async (req, res) => {
  const transaction = await transactionService.getById(req.user!.id, req.params.id)
  res.json({ data: transaction })
})

export default router
```

### Register Routes (backend/src/routes/index.ts)

```typescript
// Add to imports
import transactionsRouter from './transactions'

// Add to router registration
router.use('/transactions', authMiddleware, transactionsRouter)
```

### Testing Patterns

```typescript
// Sample test data
const mockBuyTransaction = {
  type: 'buy',
  assetId: 'clx123...',
  date: '2026-01-10T10:00:00.000Z',
  quantity: 10,
  price: 450.75,
  commission: 5.00,
}

// Expected totalCost for buy: (10 × 450.75) + 5.00 = 4512.50
const expectedTotalCost = '4512.50'

const mockSellTransaction = {
  type: 'sell',
  assetId: 'clx123...',
  date: '2026-01-10T10:00:00.000Z',
  quantity: 5,
  price: 460.00,
  commission: 5.00,
}

// Expected totalProceeds for sell: (5 × 460.00) - 5.00 = 2295.00
const expectedTotalProceeds = '2295.00'
```

### Project Structure (Files to Create)

```
backend/
├── prisma/
│   └── schema.prisma           # MODIFY: Add Transaction model
│
└── src/
    ├── validations/
    │   ├── transaction.ts      # CREATE: Zod schemas
    │   └── transaction.test.ts # CREATE: Validation tests
    │
    ├── services/
    │   ├── transactionService.ts       # CREATE
    │   └── transactionService.test.ts  # CREATE
    │
    └── routes/
        ├── index.ts                        # MODIFY: Register transactions
        ├── transactions.ts                 # CREATE
        ├── transactions.test.ts            # CREATE
        └── transactions.integration.test.ts # CREATE
```

### Previous Story Learnings (3.2, 3.3)

1. **BigInt for money values**: Store prices and totals in cents as BigInt to avoid floating-point errors
2. **Decimal for quantities**: Use Prisma Decimal with `@db.Decimal(18, 8)` to support crypto fractional units
3. **centsToDecimal helper**: Convert BigInt cents to decimal string for API responses
4. **Asset ownership validation**: Always verify asset belongs to user before operations
5. **Error patterns**: Use `Errors.validation()` with details object for validation errors
6. **Include relations**: Use Prisma `include` to get asset details in single query
7. **ISO 8601 dates**: All dates as ISO strings in API, convert to Date for Prisma

### Critical Implementation Rules

1. **NEVER use floating-point for money** - Always store as cents (BigInt)
2. **ALWAYS validate asset ownership** - Check `userId` matches before any operation
3. **ALWAYS validate sell quantity** - Prevent selling more than holding
4. **Use Decimal for quantity math** - Prisma Decimal handles precision correctly
5. **Follow existing service pattern** - See `priceService.ts` for reference
6. **Include asset in response** - Users need ticker/name for display
7. **Date filtering uses Date objects** - Convert ISO strings to Date for Prisma queries

### Anti-Patterns to Avoid

```typescript
// ❌ WRONG - Don't use float for money
const total = quantity * price + commission

// ✅ CORRECT - Use cents
const priceCents = BigInt(Math.round(price * 100))
const totalCents = baseAmountCents + commissionCents

// ❌ WRONG - Don't skip asset ownership check
const transaction = await prisma.transaction.create({
  data: { ...input, userId }  // Asset might not belong to user!
})

// ✅ CORRECT - Verify asset first
const asset = await prisma.asset.findFirst({ where: { id: input.assetId, userId } })
if (!asset) throw Errors.notFound('Asset')

// ❌ WRONG - Don't allow negative totals
const totalCents = baseAmountCents - commissionCents  // Could be negative!

// ✅ CORRECT - Commission should never exceed proceeds (validate or cap)
// For MVP: commission < (quantity × price) is implicit, but consider validation

// ❌ WRONG - Don't forget to include asset in response
return prisma.transaction.create({ data })

// ✅ CORRECT - Include asset for display
return prisma.transaction.create({
  data,
  include: { asset: { select: { ticker: true, name: true } } }
})
```

### Story 4.2 Preview (NOT in scope - DO NOT implement)

Story 4.2 will add automatic holdings update when transactions are recorded. For now:
- Transaction recording is standalone
- Holdings are NOT automatically updated
- This keeps 4.1 focused on the transaction CRUD

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data-Architecture]
- [Source: _bmad-output/planning-artifacts/prd.md#FR12-FR13-FR33]
- [Source: _bmad-output/project-context.md]
- [Source: backend/src/services/priceService.ts]
- [Source: backend/src/routes/prices.ts]
- [Source: backend/prisma/schema.prisma]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

- Task 1: Added TransactionType enum and Transaction model to Prisma schema. Added relations to User and Asset. Migration 20260110060239_add_transaction_model applied successfully. Prisma client regenerated.
- Task 2: Created transaction validation schemas with Zod. Added createTransactionSchema, transactionListQuerySchema, transactionParamsSchema. 51 unit tests passing.
- Task 3: Created transactionService with create, list, getById, validateSellQuantity. Created shared lib/money.ts utility. Fixed tsconfig.json to exclude test files from build. 24 unit tests passing.

### File List

- backend/prisma/schema.prisma (modified)
- backend/prisma/migrations/20260110060239_add_transaction_model/migration.sql (created)
- backend/src/validations/transaction.ts (created)
- backend/src/validations/transaction.test.ts (created)
- backend/src/lib/money.ts (created)
- backend/src/services/transactionService.ts (created)
- backend/src/services/transactionService.test.ts (created)
- backend/src/services/priceService.ts (modified)
- backend/tsconfig.json (modified)

