# Story 9.7: Transactions UI - Cards to Table

Status: done

## Story

As a **user reviewing transaction history**,
I want **transactions displayed in a table format instead of cards**,
so that **I can quickly scan and compare multiple transactions at once without excessive scrolling**.

## Problem Description

La UI actual de transacciones usa un grid de cards (1-3 columnas dependiendo del viewport) que presenta varios problemas:

1. **Difícil escaneo**: Cada transacción ocupa mucho espacio vertical, requiriendo scroll extenso
2. **Comparación complicada**: Los valores están en posiciones diferentes según la card, dificultando comparar transacciones
3. **Información redundante**: El nombre del asset se repite en cada card cuando el ticker es suficiente
4. **Densidad baja**: Solo se ven 3-6 transacciones a la vez en desktop

**Layout actual (cards):**
```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ BUY  VOO    │ │ SELL BTC    │ │ BUY  ETH    │
│ 10/01/2026  │ │ 08/01/2026  │ │ 05/01/2026  │
│             │ │             │ │             │
│ Vanguard... │ │ Bitcoin     │ │ Ethereum    │
│             │ │             │ │             │
│ Qty: 10     │ │ Qty: 0.5    │ │ Qty: 2      │
│ Price: $450 │ │ Price: $95k │ │ Price: $3k  │
│ Comm: $5    │ │ Comm: $10   │ │ Comm: $8    │
│ ─────────── │ │ ─────────── │ │ ─────────── │
│ Total: $4.5k│ │ Total: $47k │ │ Total: $6k  │
└─────────────┘ └─────────────┘ └─────────────┘
```

**Layout propuesto (tabla):**
```
┌──────────┬──────┬───────┬──────────┬──────────┬───────────┬──────────┐
│ Date     │ Type │ Asset │ Quantity │ Price    │ Commission│ Total    │
├──────────┼──────┼───────┼──────────┼──────────┼───────────┼──────────┤
│ 10/01/26 │ BUY  │ VOO   │ 10       │ $450.00  │ $5.00     │ $4,505   │
│ 08/01/26 │ SELL │ BTC   │ 0.5      │ $95,000  │ $10.00    │ $47,490  │
│ 05/01/26 │ BUY  │ ETH   │ 2        │ $3,000   │ $8.00     │ $6,008   │
│ 03/01/26 │ BUY  │ VOO   │ 5        │ $448.50  │ $5.00     │ $2,247   │
└──────────┴──────┴───────┴──────────┴──────────┴───────────┴──────────┘
```

## Acceptance Criteria

1. **Given** the transactions page
   **When** I view transactions on desktop (>1024px)
   **Then** transactions are displayed in a table with columns: Date, Type, Asset, Quantity, Price, Commission, Total
   **And** the table header is sticky when scrolling

2. **Given** the transactions table
   **When** I view a BUY transaction row
   **Then** Type column shows green "BUY" badge
   **And** Total column header shows "Total"
   **And** Total value shows the cost (quantity × price + commission)

3. **Given** the transactions table
   **When** I view a SELL transaction row
   **Then** Type column shows red "SELL" badge
   **And** Total column header shows "Total"
   **And** Total value shows the proceeds (quantity × price - commission)

4. **Given** the transactions page on mobile (<768px)
   **When** I view transactions
   **Then** the table scrolls horizontally if needed
   **Or** columns are prioritized: Date, Asset, Type, Total (hiding Price, Commission, Quantity in collapsed view)

5. **Given** transactions are loading
   **When** I view the page
   **Then** I see a skeleton table with animated rows

6. **Given** no transactions exist
   **When** I view the page
   **Then** I see an empty state message (existing behavior preserved)

7. **Given** transaction filters are applied
   **When** I view the filtered results in table format
   **Then** the table updates with filtered transactions (no changes to filter logic)

8. **Given** the table is displayed
   **When** I hover over a row
   **Then** the row highlights to indicate interactivity (future: click to expand details)

## Tasks / Subtasks

- [x] Task 1: Create TransactionTable component (AC: #1, #2, #3)
  - [x] 1.1 Create `frontend/src/features/transactions/components/TransactionTable.tsx`
  - [x] 1.2 Implement table structure with semantic HTML (`<table>`, `<thead>`, `<tbody>`)
  - [x] 1.3 Create sticky header with Tailwind `sticky top-0`
  - [x] 1.4 Implement TransactionRow for each transaction
  - [x] 1.5 Apply type-specific styling (BUY=green, SELL=red) to Type column

- [x] Task 2: Implement column formatting (AC: #2, #3)
  - [x] 2.1 Date: Use existing `formatDate()` with short format
  - [x] 2.2 Type: Colored badge (reuse existing styles from TransactionCard)
  - [x] 2.3 Asset: Show ticker only (not full name)
  - [x] 2.4 Quantity: Use `formatQuantity()` from formatters
  - [x] 2.5 Price: Use `formatCurrency()`
  - [x] 2.6 Commission: Use `formatCurrency()`
  - [x] 2.7 Total: Use `formatCurrency()` with `totalCost` or `totalProceeds`

- [x] Task 3: Implement responsive behavior (AC: #4)
  - [x] 3.1 Add horizontal scroll wrapper on mobile
  - [x] 3.2 Set minimum column widths to prevent text wrapping
  - [x] 3.3 Consider hiding Commission column on mobile (optional)

- [x] Task 4: Create table loading skeleton (AC: #5)
  - [x] 4.1 Create `TableSkeleton` component with animated rows
  - [x] 4.2 Match column widths and structure of actual table

- [x] Task 5: Update TransactionList to use table (AC: #1, #6, #7)
  - [x] 5.1 Replace grid wrapper with TransactionTable
  - [x] 5.2 Preserve empty state behavior
  - [x] 5.3 Keep isLoading prop for skeleton display

- [x] Task 6: Add hover state (AC: #8)
  - [x] 6.1 Add `hover:bg-gray-50` or similar to rows
  - [x] 6.2 Ensure proper cursor (default, not pointer for now)

- [x] Task 7: Testing
  - [x] 7.1 Update existing TransactionList tests for table structure
  - [x] 7.2 Run frontend lint and typecheck
  - [x] 7.3 Visual testing on different viewport sizes

## Dev Notes

### Current Implementation

**TransactionList.tsx** (grid wrapper):
```typescript
// ACTUAL - Grid de cards
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {transactions.map((transaction) => (
    <TransactionCard key={transaction.id} transaction={transaction} />
  ))}
</div>
```

**TransactionCard.tsx** (card component):
- Vertical layout with type badge, ticker, date, name, quantity, price, commission, total
- Uses local `formatCurrency()` and `formatDate()` functions
- Type styles: `BUY: 'bg-green-100 text-green-800'`, `SELL: 'bg-red-100 text-red-800'`

### Implementation Pattern

**TransactionTable.tsx:**
```typescript
import type { Transaction, TransactionType } from '@/types/api'
import { formatQuantity } from '@/lib/formatters'

const typeStyles: Record<TransactionType, string> = {
  BUY: 'bg-green-100 text-green-800',
  SELL: 'bg-red-100 text-red-800',
}

function formatCurrency(value: string): string {
  const numValue = Number(value)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue)
}

function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',  // Shorter year for table
  }).format(new Date(isoDate))
}

interface TransactionTableProps {
  transactions: Transaction[]
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="sticky top-0 bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Type
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Asset
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              Quantity
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              Price
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              Comm.
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {transactions.map((tx) => (
            <TransactionRow key={tx.id} transaction={tx} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TransactionRow({ transaction: tx }: { transaction: Transaction }) {
  const total = tx.type === 'BUY' ? tx.totalCost! : tx.totalProceeds!

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
        {formatDate(tx.date)}
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${typeStyles[tx.type]}`}>
          {tx.type}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
        {tx.asset.ticker}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">
        {formatQuantity(tx.quantity)}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">
        {formatCurrency(tx.price)}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-500">
        {formatCurrency(tx.commission)}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-gray-900">
        {formatCurrency(total)}
      </td>
    </tr>
  )
}
```

**Updated TransactionList.tsx:**
```typescript
import type { Transaction } from '@/types/api'
import { TransactionTable } from './TransactionTable'

interface TransactionListProps {
  transactions: Transaction[]
  isLoading?: boolean
}

function TableSkeleton() {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {['Date', 'Type', 'Asset', 'Quantity', 'Price', 'Comm.', 'Total'].map((h) => (
              <th key={h} className="px-4 py-3 text-left">
                <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {[1, 2, 3, 4, 5].map((i) => (
            <tr key={i}>
              {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                <td key={j} className="px-4 py-3">
                  <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function TransactionList({ transactions, isLoading }: TransactionListProps) {
  if (isLoading) {
    return <TableSkeleton />
  }

  if (transactions.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500">No transactions recorded yet</p>
      </div>
    )
  }

  return <TransactionTable transactions={transactions} />
}
```

### Responsive Design Strategy

**Option 1: Horizontal Scroll (Recommended)**
```typescript
// Simple horizontal scroll wrapper
<div className="overflow-x-auto -mx-4 sm:mx-0">
  <div className="inline-block min-w-full align-middle">
    <table className="min-w-full">...</table>
  </div>
</div>
```

**Option 2: Column Hiding on Mobile**
```typescript
// Hide less important columns on mobile
<th className="hidden md:table-cell ...">Commission</th>
<td className="hidden md:table-cell ...">...</td>
```

**Recommended minimum widths:**
| Column | Min Width | Alignment |
|--------|-----------|-----------|
| Date | 80px | left |
| Type | 60px | left |
| Asset | 70px | left |
| Quantity | 90px | right |
| Price | 100px | right |
| Commission | 80px | right |
| Total | 100px | right |

### Visual Design

**Table header:**
- Gray background (`bg-gray-50`)
- Sticky when scrolling (`sticky top-0`)
- Uppercase, small font, gray text

**Table rows:**
- White background
- Hover state: light gray (`hover:bg-gray-50`)
- Divider between rows (`divide-y divide-gray-100`)

**Type badges (reuse from cards):**
- BUY: `bg-green-100 text-green-800`
- SELL: `bg-red-100 text-red-800`

### Files to Modify

| File | Changes |
|------|---------|
| `frontend/src/features/transactions/components/TransactionTable.tsx` | **NEW** - Table component |
| `frontend/src/features/transactions/components/TransactionList.tsx` | Replace grid with table |
| `frontend/src/features/transactions/components/TransactionCard.tsx` | Keep for reference (can delete later) |
| `frontend/src/features/transactions/components/TransactionList.test.tsx` | Update tests for table |
| `frontend/src/features/transactions/components/index.ts` | Export TransactionTable |

### Architecture Compliance

- **Component Organization:** New component in `features/transactions/components/`
- **Naming:** PascalCase for component files
- **Styling:** Tailwind utility classes only
- **Types:** Use existing `Transaction` type from `@/types/api`
- **Tests:** Co-located in same directory

### Testing Approach

```typescript
// TransactionList.test.tsx - Update for table structure
describe('TransactionList', () => {
  it('renders table with correct columns', () => {
    render(<TransactionList transactions={mockTransactions} />)

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText('Date')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
    expect(screen.getByText('Asset')).toBeInTheDocument()
  })

  it('displays transaction data in rows', () => {
    render(<TransactionList transactions={mockTransactions} />)

    expect(screen.getByText('VOO')).toBeInTheDocument()
    expect(screen.getByText('BUY')).toBeInTheDocument()
  })

  it('applies correct styling for BUY transactions', () => {
    render(<TransactionList transactions={[buyTransaction]} />)

    const badge = screen.getByText('BUY')
    expect(badge).toHaveClass('bg-green-100', 'text-green-800')
  })

  it('applies correct styling for SELL transactions', () => {
    render(<TransactionList transactions={[sellTransaction]} />)

    const badge = screen.getByText('SELL')
    expect(badge).toHaveClass('bg-red-100', 'text-red-800')
  })

  it('shows skeleton when loading', () => {
    render(<TransactionList transactions={[]} isLoading />)

    expect(screen.queryByRole('table')).toBeInTheDocument()
    // Check for skeleton animation classes
  })

  it('shows empty state when no transactions', () => {
    render(<TransactionList transactions={[]} />)

    expect(screen.getByText('No transactions recorded yet')).toBeInTheDocument()
  })
})
```

### Previous Story Learnings

From Story 9-6 (Dashboard Fix):
- Component updates siguieron el patrón establecido
- Tests co-located funcionan bien
- Tailwind responsive classes son suficientes para mobile

From Story 4-3 (Transaction History UI - original):
- Cards fueron la opción inicial para simplicidad
- Ahora con más datos, tabla es más apropiada

### Git Commit Pattern

```
feat(transactions): migrate from card grid to table layout

- Create TransactionTable component with semantic HTML
- Replace grid layout with responsive table
- Add sticky header and hover states
- Update loading skeleton for table format
- Preserve empty state and filter integration
```

### Dependencies

**Requires (already done):**
- Story 9-3/9-4: API Types Update (DONE) - `price`, `total`, `commission` fields
- Story 4-3: Transaction History UI (DONE) - base implementation

**Note:** This story only changes the display format, not the data structure or API.

### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Very long ticker (>10 chars) | Truncate with ellipsis or allow wrapping |
| Large quantity (BTC satoshis) | Use `formatQuantity()` which handles 8 decimals |
| Commission = 0 | Show "$0.00" |
| Many transactions (100+) | Consider virtualization in future (not this story) |
| Very narrow viewport (<320px) | Horizontal scroll with pinned first column (optional) |

### References

- [Source: sprint-change-proposal-2026-01-13.md#4.6] - Table UI requirement
- [Source: frontend/src/features/transactions/components/TransactionList.tsx] - Current grid implementation
- [Source: frontend/src/features/transactions/components/TransactionCard.tsx] - Current card component
- [Source: frontend/src/lib/formatters.ts] - Existing formatters
- [Source: project-context.md#Frontend Patterns] - Component organization
- [Source: architecture.md#Frontend Structure] - Feature-based organization

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None

### Completion Notes List

- Created new `TransactionTable.tsx` component with semantic HTML table structure
- Implemented sticky header with `sticky top-0 z-10` for scroll behavior
- Added type-specific badges (BUY=green, SELL=red) reusing existing styles
- Implemented all column formatting: Date (dd/mm/yy), Type (badge), Asset (ticker only), Quantity (formatQuantity), Price/Commission/Total (formatCurrency)
- Added responsive behavior: horizontal scroll wrapper, hidden Price/Commission columns on mobile (`hidden md:table-cell`)
- Created `TableSkeleton` component with animated rows matching table structure
- Updated `TransactionList.tsx` to use TransactionTable instead of grid + TransactionCard
- Preserved empty state and isLoading prop behavior
- Added hover state `hover:bg-gray-50 transition-colors` to table rows
- Updated `TransactionList.test.tsx` for new table structure (11 tests)
- Created comprehensive `TransactionTable.test.tsx` (20 tests covering all ACs)
- Fixed `index.test.tsx` to expect ticker in table instead of full asset name
- All 504 frontend tests pass, typecheck and lint clean

### File List

| File | Action |
|------|--------|
| `frontend/src/features/transactions/components/TransactionTable.tsx` | Created |
| `frontend/src/features/transactions/components/TransactionTable.test.tsx` | Created |
| `frontend/src/features/transactions/components/TransactionList.tsx` | Modified |
| `frontend/src/features/transactions/components/TransactionList.test.tsx` | Modified |
| `frontend/src/features/transactions/index.test.tsx` | Modified |

### Change Log

- 2026-01-14: Implemented table layout replacing card grid (Story 9-7)
