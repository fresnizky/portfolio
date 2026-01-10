# Story 4.3: Transaction History UI

Status: in-progress

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to view my transaction history and record new transactions easily**,
So that **I can track all my investment activity**.

## Acceptance Criteria

1. **Given** I am on the transactions page, **When** the page loads, **Then** I see a list of all transactions sorted by date (newest first)

2. **Given** I view a transaction, **When** I look at the details, **Then** I see: date, type (buy/sell), asset ticker, quantity, price, commission, and total cost/proceeds

3. **Given** I click "Add Transaction", **When** I fill the form with type, asset, date, quantity, price, and commission, **Then** the transaction is recorded and appears in the list **And** my holding for that asset is updated

4. **Given** I have many transactions, **When** I use the filters, **Then** I can filter by asset, type (buy/sell), and date range

5. **Given** I view the transaction list, **When** I look at the summary, **Then** I see total invested (sum of buy costs) and total withdrawn (sum of sell proceeds)

## Tasks / Subtasks

- [x] Task 1: Add Transaction types and API client methods (AC: #1, #2)
  - [x] Add `Transaction` and `TransactionListFilters` types to `frontend/src/types/api.ts`
  - [x] Add `transactions` namespace to `frontend/src/lib/api.ts` with `list()` and `create()` methods
  - [x] Add `transactions` query keys to `frontend/src/lib/queryKeys.ts`
  - [x] Unit test api methods

- [x] Task 2: Create TransactionCard component (AC: #2)
  - [x] Create `frontend/src/features/transactions/components/TransactionCard.tsx`
  - [x] Display: date (formatted), type badge (BUY green/SELL red), ticker, quantity, price, commission
  - [x] Calculate and display totalCost/totalProceeds: `(qty * price) ± commission`
  - [x] Co-locate test file `TransactionCard.test.tsx`

- [ ] Task 3: Create TransactionList component (AC: #1)
  - [ ] Create `frontend/src/features/transactions/components/TransactionList.tsx`
  - [ ] Render list of TransactionCard in grid or table format
  - [ ] Loading skeleton with animate-pulse
  - [ ] Empty state when no transactions

- [ ] Task 4: Create TransactionForm component (AC: #3)
  - [ ] Create `frontend/src/features/transactions/components/TransactionForm.tsx`
  - [ ] React Hook Form + Zod validation schema
  - [ ] Fields: type (select buy/sell), asset (select from user's assets), date (date picker), quantity, price, commission
  - [ ] Create `frontend/src/validations/transaction.ts` (frontend version)
  - [ ] Co-locate test file

- [ ] Task 5: Create CreateTransactionModal component (AC: #3)
  - [ ] Create `frontend/src/features/transactions/components/CreateTransactionModal.tsx`
  - [ ] Wrap TransactionForm in Modal
  - [ ] Use existing Modal pattern from `frontend/src/components/common/Modal.tsx`
  - [ ] On success: close modal, invalidate queries (transactions + portfolio summary)

- [ ] Task 6: Create TransactionFilters component (AC: #4)
  - [ ] Create `frontend/src/features/transactions/components/TransactionFilters.tsx`
  - [ ] Asset select (dropdown with all user assets + "All" option)
  - [ ] Type select (All, Buy, Sell)
  - [ ] Date range inputs (from/to)
  - [ ] Reset filters button
  - [ ] onChange callback to parent

- [ ] Task 7: Create TransactionSummary component (AC: #5)
  - [ ] Create `frontend/src/features/transactions/components/TransactionSummary.tsx`
  - [ ] Display: Total Invested (sum of BUY totalCosts), Total Withdrawn (sum of SELL totalProceeds)
  - [ ] Calculate from transaction list data

- [ ] Task 8: Create useTransactions hook (AC: #1, #3, #4)
  - [ ] Create `frontend/src/features/transactions/hooks/useTransactions.ts`
  - [ ] `useTransactions(filters)` - TanStack Query for list with filter params
  - [ ] `useCreateTransaction()` - useMutation + invalidateQueries
  - [ ] Co-locate test file

- [ ] Task 9: Create TransactionsPage and integrate (AC: #1-5)
  - [ ] Create `frontend/src/features/transactions/index.tsx`
  - [ ] Compose: TransactionFilters + TransactionSummary + TransactionList + "Add Transaction" button + CreateTransactionModal
  - [ ] Manage filter state with useState
  - [ ] Pass filters to useTransactions hook

- [ ] Task 10: Add route and navigation (AC: #1)
  - [ ] Add `/transactions` route to `frontend/src/router.tsx`
  - [ ] Add "Transactions" nav item to `frontend/src/components/layout/Sidebar.tsx` or Header
  - [ ] Verify navigation works from all pages

## Dev Notes

### Critical Implementation Detail

**Esta story es UI-only**: El backend ya está completo (story 4-1 y 4-2). Los endpoints existen:

- `POST /api/transactions` - Crear transacción (ya actualiza holdings automáticamente)
- `GET /api/transactions` - Listar con filtros opcionales
- `GET /api/transactions/:id` - Detalle (no necesario para esta UI)

### API Response Format

El backend ya retorna este formato (ver `backend/src/routes/transactions.ts`):

```typescript
// GET /api/transactions
{
  data: Transaction[],
  meta: { total: number }
}

// POST /api/transactions (body)
{
  type: "buy" | "sell",
  assetId: string,
  date: string, // ISO 8601
  quantity: number,
  price: number,
  commission: number
}
```

### Types to Add

```typescript
// frontend/src/types/api.ts

export type TransactionType = 'BUY' | 'SELL'

export interface Transaction {
  id: string
  type: TransactionType
  date: string // ISO 8601
  quantity: string // Decimal from Prisma as string
  priceCents: string // BigInt as string
  commissionCents: string // BigInt as string
  totalCents: string // BigInt as string
  assetId: string
  userId: string
  createdAt: string
  asset: {
    ticker: string
    name: string
  }
}

export interface TransactionListFilters {
  assetId?: string
  type?: 'buy' | 'sell'
  fromDate?: string
  toDate?: string
}

export interface CreateTransactionInput {
  type: 'buy' | 'sell'
  assetId: string
  date: string
  quantity: number
  price: number
  commission: number
}
```

### API Client Methods

```typescript
// frontend/src/lib/api.ts - agregar:

transactions: {
  list: async (filters?: TransactionListFilters): Promise<{ transactions: Transaction[], total: number }> => {
    const params = new URLSearchParams()
    if (filters?.assetId) params.append('assetId', filters.assetId)
    if (filters?.type) params.append('type', filters.type)
    if (filters?.fromDate) params.append('fromDate', filters.fromDate)
    if (filters?.toDate) params.append('toDate', filters.toDate)

    const url = params.toString()
      ? `${API_URL}/transactions?${params.toString()}`
      : `${API_URL}/transactions`

    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    // Response format: { data: Transaction[], meta: { total: number } }
    const json = await res.json()
    if (!res.ok) throw new ApiError(json.error, json.message, json.details)
    return { transactions: json.data, total: json.meta?.total ?? json.data.length }
  },

  create: async (input: CreateTransactionInput): Promise<Transaction> => {
    const res = await fetch(`${API_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(input),
    })
    return handleResponse<Transaction>(res)
  },
},
```

### Query Keys Pattern

```typescript
// frontend/src/lib/queryKeys.ts - agregar:

transactions: {
  all: ['transactions'] as const,
  list: (filters?: TransactionListFilters) => [...queryKeys.transactions.all, 'list', filters] as const,
},
```

### Frontend Validation Schema

```typescript
// frontend/src/validations/transaction.ts
import { z } from 'zod'

export const createTransactionFormSchema = z.object({
  type: z.enum(['buy', 'sell']),
  assetId: z.string().min(1, 'Asset is required'),
  date: z.string().min(1, 'Date is required'),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  price: z.coerce.number().positive('Price must be greater than 0'),
  commission: z.coerce.number().min(0, 'Commission cannot be negative').default(0),
})

export type CreateTransactionFormData = z.infer<typeof createTransactionFormSchema>
```

### Component Styling Patterns (Seguir Existentes)

**TransactionCard** - similar a PositionCard:
```typescript
// Type badge colors
const typeStyles = {
  BUY: 'bg-green-100 text-green-800',
  SELL: 'bg-red-100 text-red-800',
}

// Card container
<div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
```

**TransactionList** - similar a PositionList:
```typescript
// Grid layout
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {transactions.map(tx => <TransactionCard key={tx.id} transaction={tx} />)}
</div>

// Empty state
<div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
  <p className="text-gray-500">No transactions recorded yet</p>
</div>
```

**TransactionForm** - seguir AssetForm pattern:
```typescript
const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm<CreateTransactionFormData>({
  resolver: zodResolver(createTransactionFormSchema),
  defaultValues: {
    type: 'buy',
    commission: 0,
    date: new Date().toISOString().split('T')[0], // Today's date
  },
})
```

### Money Display Utils

Los valores vienen en CENTS (BigInt string). Necesitas convertir:

```typescript
// Helper para convertir cents a display
function formatFromCents(cents: string): string {
  const value = Number(cents) / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

// En TransactionCard
<span>{formatFromCents(transaction.totalCents)}</span>
```

### Date Display

```typescript
// Formato de fecha para display
function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(isoDate))
}
```

### TransactionFilters Component Pattern

```typescript
interface TransactionFiltersProps {
  assets: Asset[] // Lista de assets del usuario
  filters: TransactionListFilters
  onFiltersChange: (filters: TransactionListFilters) => void
}

export function TransactionFilters({ assets, filters, onFiltersChange }: TransactionFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4 rounded-lg bg-gray-50 p-4">
      {/* Asset select */}
      <select
        value={filters.assetId || ''}
        onChange={(e) => onFiltersChange({ ...filters, assetId: e.target.value || undefined })}
        className="rounded-md border border-gray-300 px-3 py-2"
      >
        <option value="">All Assets</option>
        {assets.map(a => <option key={a.id} value={a.id}>{a.ticker}</option>)}
      </select>

      {/* Type select */}
      <select
        value={filters.type || ''}
        onChange={(e) => onFiltersChange({ ...filters, type: e.target.value as 'buy'|'sell' || undefined })}
        className="rounded-md border border-gray-300 px-3 py-2"
      >
        <option value="">All Types</option>
        <option value="buy">Buy</option>
        <option value="sell">Sell</option>
      </select>

      {/* Date inputs */}
      <input
        type="date"
        value={filters.fromDate?.split('T')[0] || ''}
        onChange={(e) => onFiltersChange({ ...filters, fromDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
        className="rounded-md border border-gray-300 px-3 py-2"
      />
      <input
        type="date"
        value={filters.toDate?.split('T')[0] || ''}
        onChange={(e) => onFiltersChange({ ...filters, toDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
        className="rounded-md border border-gray-300 px-3 py-2"
      />
    </div>
  )
}
```

### TransactionSummary Calculation

```typescript
interface TransactionSummaryProps {
  transactions: Transaction[]
}

export function TransactionSummary({ transactions }: TransactionSummaryProps) {
  const { totalInvested, totalWithdrawn } = useMemo(() => {
    let invested = 0
    let withdrawn = 0

    for (const tx of transactions) {
      const totalCents = Number(tx.totalCents)
      if (tx.type === 'BUY') {
        invested += totalCents
      } else {
        withdrawn += totalCents
      }
    }

    return {
      totalInvested: invested / 100,
      totalWithdrawn: withdrawn / 100,
    }
  }, [transactions])

  return (
    <div className="flex gap-8 rounded-lg bg-white p-4 shadow">
      <div>
        <span className="text-sm text-gray-500">Total Invested</span>
        <p className="text-lg font-semibold text-gray-900">
          {formatCurrency(totalInvested)}
        </p>
      </div>
      <div>
        <span className="text-sm text-gray-500">Total Withdrawn</span>
        <p className="text-lg font-semibold text-gray-900">
          {formatCurrency(totalWithdrawn)}
        </p>
      </div>
    </div>
  )
}
```

### Router Update

```typescript
// frontend/src/router.tsx
import { TransactionsPage } from '@/features/transactions'

// Add to routes array inside ProtectedRoute > Layout children:
{
  path: '/transactions',
  element: <TransactionsPage />,
},
```

### Navigation Update

En `frontend/src/components/layout/Sidebar.tsx` o el Header, agregar link:

```typescript
<NavLink to="/transactions" className={...}>
  Transactions
</NavLink>
```

### Query Invalidation on Create

Cuando se crea una transacción, invalida:
1. `transactions.list` - para mostrar la nueva
2. `portfolio.summary` - porque los holdings cambian automáticamente

```typescript
const createTransaction = useMutation({
  mutationFn: (input: CreateTransactionInput) => api.transactions.create(input),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.all })
  },
})
```

### Asset Selection in Form

El form necesita la lista de assets para el select. Usa `useAssets()` hook existente:

```typescript
// En CreateTransactionModal o TransactionsPage
const { data: assets, isLoading: assetsLoading } = useAssets()

// Pasar a TransactionForm
<TransactionForm
  assets={assets}
  onSubmit={handleSubmit}
  isSubmitting={createMutation.isPending}
/>
```

### File Structure to Create

```
frontend/src/
├── features/
│   └── transactions/
│       ├── components/
│       │   ├── TransactionCard.tsx
│       │   ├── TransactionCard.test.tsx
│       │   ├── TransactionList.tsx
│       │   ├── TransactionForm.tsx
│       │   ├── TransactionForm.test.tsx
│       │   ├── CreateTransactionModal.tsx
│       │   ├── TransactionFilters.tsx
│       │   └── TransactionSummary.tsx
│       ├── hooks/
│       │   ├── useTransactions.ts
│       │   └── useTransactions.test.ts
│       └── index.tsx (TransactionsPage)
├── validations/
│   └── transaction.ts
├── types/
│   └── api.ts (modificar - agregar Transaction types)
├── lib/
│   ├── api.ts (modificar - agregar transactions namespace)
│   └── queryKeys.ts (modificar - agregar transactions keys)
└── router.tsx (modificar - agregar /transactions route)
```

### Anti-Patterns to Avoid

```typescript
// ❌ WRONG - Fetch directo
const response = await fetch('/api/transactions')

// ✅ CORRECT - Usar api client
const { transactions } = await api.transactions.list(filters)

// ❌ WRONG - Invalidar queries incorrectas
queryClient.invalidateQueries({ queryKey: ['transactions'] })

// ✅ CORRECT - Usar queryKeys factory
queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all })

// ❌ WRONG - Mostrar totalCents sin convertir
<span>{transaction.totalCents}</span> // Muestra cents!

// ✅ CORRECT - Convertir a dólares
<span>{formatFromCents(transaction.totalCents)}</span>

// ❌ WRONG - Date sin timezone handling
new Date(transaction.date).toLocaleDateString()

// ✅ CORRECT - Usar Intl.DateTimeFormat para consistencia
formatDate(transaction.date)
```

### Previous Story Learnings (4.1 & 4.2)

1. **BigInt for money**: `priceCents`, `commissionCents`, `totalCents` vienen como strings
2. **Decimal for quantities**: `quantity` también viene como string
3. **Transaction types**: Backend usa UPPERCASE (`BUY`, `SELL`), input usa lowercase (`buy`, `sell`)
4. **Holdings update**: Ya implementado atómicamente - al crear transacción, holding se actualiza automáticamente
5. **Sell validation**: Backend valida que no puedes vender más de lo que tienes
6. **Asset ownership**: Backend valida que el asset pertenece al usuario

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.3]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend-Structure]
- [Source: backend/src/routes/transactions.ts]
- [Source: backend/src/validations/transaction.ts]
- [Source: frontend/src/features/holdings/components/PositionCard.tsx]
- [Source: frontend/src/features/portfolio/components/AssetForm.tsx]
- [Source: frontend/src/types/api.ts]
- [Source: frontend/src/lib/api.ts]
- [Source: frontend/src/lib/queryKeys.ts]
- [Source: frontend/src/router.tsx]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

- **Task 1**: Added Transaction types (Transaction, TransactionType, TransactionListFilters, CreateTransactionInput) to api.ts types. Added transactions namespace with list() and create() methods to api client. Added transactions query keys factory. Added 12 unit tests covering list with/without filters, error handling, and create with BUY/SELL types.
- **Task 2**: Created TransactionCard component displaying type badge (BUY green/SELL red), formatted date, ticker, asset name, quantity, price, commission, and total cost/proceeds. Added 11 unit tests.

### File List

- `frontend/src/types/api.ts` (modified)
- `frontend/src/lib/api.ts` (modified)
- `frontend/src/lib/queryKeys.ts` (modified)
- `frontend/src/lib/api.test.ts` (modified)
- `frontend/src/features/transactions/components/TransactionCard.tsx` (new)
- `frontend/src/features/transactions/components/TransactionCard.test.tsx` (new)

