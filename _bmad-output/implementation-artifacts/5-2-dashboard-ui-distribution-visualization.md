# Story 5.2: Dashboard UI with Distribution Visualization

Status: ready-for-dev

## Story

As a **user**,
I want **a visual dashboard showing my portfolio status at a glance**,
So that **I can quickly understand my investment position**.

## Acceptance Criteria

1. **Given** I am on the dashboard, **When** the page loads, **Then** I see the total portfolio value prominently displayed

2. **Given** I have assets with holdings, **When** I view the dashboard, **Then** I see a pie/donut chart showing actual distribution by asset

3. **Given** I have assets with targets, **When** I view the distribution, **Then** I see both actual % and target % for each asset side by side

4. **Given** an asset has positive deviation (overweight), **When** I view that asset, **Then** it's highlighted in one color (e.g., orange)

5. **Given** an asset has negative deviation (underweight), **When** I view that asset, **Then** it's highlighted in another color (e.g., blue)

6. **Given** an asset is within +/-1% of target, **When** I view that asset, **Then** it's shown as balanced (e.g., green)

## Tasks / Subtasks

- [x] Task 1: Create custom hook useDashboard (AC: #1-6)
  - [x] Create `frontend/src/features/dashboard/hooks/useDashboard.ts`
  - [x] Use TanStack Query with `queryKeys.dashboard.summary()`
  - [x] Fetch from `api.dashboard.get()`
  - [x] Return typed `DashboardResponse` data

- [x] Task 2: Create PortfolioSummaryCard component (AC: #1)
  - [x] Create `frontend/src/features/dashboard/components/PortfolioSummaryCard.tsx`
  - [x] Display total portfolio value prominently (large font, formatted currency)
  - [x] Show loading skeleton state
  - [x] Format value with `formatCurrency()` from lib/formatters.ts

- [ ] Task 3: Create AllocationChart component (AC: #2)
  - [ ] Create `frontend/src/features/dashboard/components/AllocationChart.tsx`
  - [ ] Install Recharts: `npm install recharts` (already in architecture)
  - [ ] Implement donut/pie chart using `<PieChart>` and `<Pie>` from Recharts
  - [ ] Show actual distribution by asset with colors per category
  - [ ] Add legend with asset tickers and percentages
  - [ ] Handle empty state (no holdings)

- [ ] Task 4: Create PositionsList component (AC: #3, #4, #5, #6)
  - [ ] Create `frontend/src/features/dashboard/components/PositionsList.tsx`
  - [ ] Display each position with: ticker, name, value, actual%, target%, deviation
  - [ ] Apply deviation color coding:
    - Green: `|deviation| <= 1` (balanced)
    - Orange: `deviation > 1` (overweight)
    - Blue: `deviation < -1` (underweight)
  - [ ] Show side-by-side comparison of actual vs target percentage
  - [ ] Use visual progress bar or dual-bar for comparison

- [ ] Task 5: Update DashboardPage to use new components (AC: #1-6)
  - [ ] Modify `frontend/src/features/dashboard/index.tsx`
  - [ ] Replace placeholder content with real dashboard
  - [ ] Layout: Summary card at top, chart + positions list below
  - [ ] Add loading state
  - [ ] Add error state with retry option
  - [ ] Add empty state for users with no assets

- [ ] Task 6: Add tests (AC: #1-6)
  - [ ] Create `frontend/src/features/dashboard/hooks/useDashboard.test.ts`
  - [ ] Create `frontend/src/features/dashboard/components/PortfolioSummaryCard.test.tsx`
  - [ ] Create `frontend/src/features/dashboard/components/AllocationChart.test.tsx`
  - [ ] Create `frontend/src/features/dashboard/components/PositionsList.test.tsx`

## Dev Notes

### API Already Implemented (Story 5-1)

The Dashboard API is complete and returns all data needed for this UI:

```typescript
// GET /api/dashboard returns:
interface DashboardResponse {
  totalValue: string              // "10000.00"
  positions: DashboardPosition[]
  alerts: DashboardAlert[]        // Used in Story 5-3
}

interface DashboardPosition {
  assetId: string
  ticker: string                  // "VOO"
  name: string                    // "Vanguard S&P 500"
  category: AssetCategory         // "ETF" | "FCI" | "CRYPTO" | "CASH"
  quantity: string                // "10.5"
  currentPrice: string | null     // "450.75"
  value: string                   // "4732.88"
  targetPercentage: string | null // "60.00"
  actualPercentage: string        // "47.33" - ALREADY CALCULATED
  deviation: string               // "-12.67" - ALREADY CALCULATED
  priceUpdatedAt: string | null
}
```

### Frontend Integration Points

**API Client (already exists):**
```typescript
// frontend/src/lib/api.ts - ALREADY IMPLEMENTED
api.dashboard.get(params?: DashboardParams): Promise<DashboardResponse>
```

**Query Keys (already exists):**
```typescript
// frontend/src/lib/queryKeys.ts - ALREADY IMPLEMENTED
queryKeys.dashboard.summary(params?)
```

**Types (already exist):**
```typescript
// frontend/src/types/api.ts - ALREADY IMPLEMENTED
DashboardResponse, DashboardPosition, DashboardAlert, DashboardParams
```

### Component Implementation Patterns

**Custom Hook Pattern (follow existing pattern from useAssets, useTransactions):**

```typescript
// frontend/src/features/dashboard/hooks/useDashboard.ts
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import type { DashboardResponse, DashboardParams } from '@/types/api'

export function useDashboard(params?: DashboardParams) {
  return useQuery<DashboardResponse>({
    queryKey: queryKeys.dashboard.summary(params),
    queryFn: () => api.dashboard.get(params),
  })
}
```

**Recharts PieChart Pattern:**

```typescript
// frontend/src/features/dashboard/components/AllocationChart.tsx
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

// Color scheme by category (consistent with existing app styling)
const CATEGORY_COLORS: Record<AssetCategory, string> = {
  ETF: '#3b82f6',      // blue-500
  FCI: '#8b5cf6',      // violet-500
  CRYPTO: '#f59e0b',   // amber-500
  CASH: '#10b981',     // emerald-500
}

// Transform positions to chart data
const chartData = positions.map(pos => ({
  name: pos.ticker,
  value: parseFloat(pos.actualPercentage),
  category: pos.category,
}))

// Render
<ResponsiveContainer width="100%" height={300}>
  <PieChart>
    <Pie
      data={chartData}
      dataKey="value"
      nameKey="name"
      cx="50%"
      cy="50%"
      innerRadius={60}
      outerRadius={100}
      label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
    >
      {chartData.map((entry, index) => (
        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.category]} />
      ))}
    </Pie>
    <Tooltip />
    <Legend />
  </PieChart>
</ResponsiveContainer>
```

**Deviation Color Logic:**

```typescript
// Helper function for deviation color coding
function getDeviationColor(deviation: string): { bg: string; text: string; label: string } {
  const dev = parseFloat(deviation)

  if (Math.abs(dev) <= 1) {
    return { bg: 'bg-green-100', text: 'text-green-700', label: 'Balanced' }
  }
  if (dev > 1) {
    return { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Overweight' }
  }
  return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Underweight' }
}

// Usage in component
const { bg, text, label } = getDeviationColor(position.deviation)
<span className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
  {parseFloat(position.deviation) > 0 ? '+' : ''}{position.deviation}% ({label})
</span>
```

### Page Layout Structure

```tsx
// frontend/src/features/dashboard/index.tsx
<div className="space-y-6">
  {/* Header */}
  <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

  {/* Total Value Card - Prominent */}
  <PortfolioSummaryCard totalValue={data.totalValue} isLoading={isLoading} />

  {/* Two-column layout for chart and positions */}
  <div className="grid gap-6 lg:grid-cols-2">
    {/* Allocation Chart */}
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Asset Allocation</h2>
      <AllocationChart positions={data.positions} />
    </div>

    {/* Positions List with Deviation */}
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Portfolio Positions</h2>
      <PositionsList positions={data.positions} />
    </div>
  </div>
</div>
```

### Currency Formatting

**Use existing formatter or create if not exists:**

```typescript
// frontend/src/lib/formatters.ts
export function formatCurrency(value: string | number, currency = 'USD'): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue)
}

// Usage: formatCurrency("10000.00") → "$10,000.00"
```

### File Structure

```
frontend/src/features/dashboard/
├── index.tsx                              (MODIFY - replace placeholder)
├── hooks/
│   ├── useDashboard.ts                    (NEW)
│   └── useDashboard.test.ts               (NEW)
└── components/
    ├── PortfolioSummaryCard.tsx           (NEW)
    ├── PortfolioSummaryCard.test.tsx      (NEW)
    ├── AllocationChart.tsx                (NEW)
    ├── AllocationChart.test.tsx           (NEW)
    ├── PositionsList.tsx                  (NEW)
    └── PositionsList.test.tsx             (NEW)
```

### Styling Patterns (Follow Existing)

**Card Container (from PortfolioPage):**
```tsx
<div className="rounded-lg border border-gray-200 bg-white p-6">
```

**Loading Skeleton (from PortfolioPage):**
```tsx
<div className="animate-pulse">
  <div className="h-8 w-32 rounded bg-gray-200" />
</div>
```

**Error State:**
```tsx
<div className="rounded-lg border border-red-200 bg-red-50 p-4">
  <p className="text-sm text-red-700">{error.message}</p>
</div>
```

**Empty State:**
```tsx
<div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
  <p className="text-gray-500">No data available</p>
</div>
```

### Anti-Patterns to Avoid

```typescript
// NEVER fetch directly - use the hook
fetch('/api/dashboard')  // WRONG
const { data } = useDashboard()  // CORRECT

// NEVER recalculate percentages - API provides them
const actual = (value / total) * 100  // WRONG - already in data
position.actualPercentage  // CORRECT - use API response

// NEVER parse deviation twice
parseFloat(parseFloat(deviation).toFixed(2))  // WRONG
parseFloat(deviation)  // CORRECT - comes as string with 2 decimals

// NEVER hardcode colors - use consistent scheme
fill="#ff0000"  // WRONG
fill={CATEGORY_COLORS[category]}  // CORRECT

// NEVER skip loading states
if (!data) return null  // WRONG - bad UX
if (isLoading) return <LoadingSkeleton />  // CORRECT
```

### Testing Requirements

```typescript
// frontend/src/features/dashboard/hooks/useDashboard.test.ts
describe('useDashboard', () => {
  it('should fetch dashboard data')
  it('should return loading state initially')
  it('should handle API errors')
})

// frontend/src/features/dashboard/components/PortfolioSummaryCard.test.tsx
describe('PortfolioSummaryCard', () => {
  it('should display formatted total value')
  it('should show loading skeleton when isLoading=true')
  it('should handle zero value')
})

// frontend/src/features/dashboard/components/AllocationChart.test.tsx
describe('AllocationChart', () => {
  it('should render pie chart with positions')
  it('should apply correct colors by category')
  it('should show empty state for no positions')
})

// frontend/src/features/dashboard/components/PositionsList.test.tsx
describe('PositionsList', () => {
  it('should display all positions')
  it('should show green for balanced positions (deviation <= 1)')
  it('should show orange for overweight positions (deviation > 1)')
  it('should show blue for underweight positions (deviation < -1)')
  it('should show actual and target percentages side by side')
})
```

### Previous Story Context (5-1)

**Learnings from Story 5-1:**
- API response uses strings for all decimal/numeric values (Prisma Decimal serialization)
- `actualPercentage` and `deviation` are pre-calculated by the backend
- Use `parseFloat()` when needing numeric operations
- Query keys already set up in `queryKeys.dashboard`
- API client method already exists as `api.dashboard.get()`

**Files Created in 5-1 (Reference):**
- `backend/src/services/dashboardService.ts` - Dashboard calculations
- `backend/src/routes/dashboard.ts` - GET /api/dashboard endpoint
- `frontend/src/types/api.ts` - Dashboard types
- `frontend/src/lib/api.ts` - api.dashboard.get()
- `frontend/src/lib/queryKeys.ts` - queryKeys.dashboard

### Dependencies

- **Recharts**: Must be installed (`npm install recharts`)
- **Architecture specifies**: Recharts for charts (see architecture.md)
- **Existing types**: Use `DashboardPosition`, `DashboardResponse` from `@/types/api`

### Project Context Reference

See `_bmad-output/project-context.md` for:
- TypeScript strict mode rules
- Path aliases (`@/components`, `@/lib`)
- Naming conventions (PascalCase for components, camelCase for functions)
- API response format (`{ data: T }`)
- Tailwind CSS styling patterns

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-5.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend-Architecture]
- [Source: _bmad-output/implementation-artifacts/5-1-dashboard-summary-api.md]
- [Source: frontend/src/features/portfolio/index.tsx - Layout patterns]
- [Source: frontend/src/features/transactions/index.tsx - Hook/component patterns]
- [Source: frontend/src/lib/api.ts - API client patterns]
- [Source: frontend/src/types/api.ts - Dashboard types]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

- Task 1: Created useDashboard hook with TanStack Query integration. 4 tests passing.
- Task 2: Created PortfolioSummaryCard component with formatCurrency utility. 5 tests passing.

### File List

- frontend/src/features/dashboard/hooks/useDashboard.ts (NEW)
- frontend/src/features/dashboard/hooks/useDashboard.test.tsx (NEW)
- frontend/src/lib/formatters.ts (NEW)
- frontend/src/features/dashboard/components/PortfolioSummaryCard.tsx (NEW)
- frontend/src/features/dashboard/components/PortfolioSummaryCard.test.tsx (NEW)

