# Story 6.2: Evolution Chart & Historical View

Status: done

## Story

As a **user**,
I want **to see a chart of my portfolio's evolution over time**,
So that **I can visualize my progress toward retirement**.

## Acceptance Criteria

1. **Given** I am on the evolution page, **When** the page loads, **Then** I see a line chart showing totalValue over time

2. **Given** I have snapshots from multiple months, **When** I view the chart, **Then** the X-axis shows dates and Y-axis shows portfolio value

3. **Given** I want to analyze a specific period, **When** I select a date range filter (1M, 3M, 6M, 1Y, All), **Then** the chart updates to show only that period

4. **Given** I hover over a point on the chart, **When** I view the tooltip, **Then** I see the date and total value for that snapshot

5. **Given** I have historical data, **When** I view the summary below the chart, **Then** I see: period growth %, absolute gain/loss, and comparison to previous period

## Tasks / Subtasks

- [x] Task 1: Add Snapshot types to frontend (AC: #1, #2, #4)
  - [x] Add `Snapshot` and `SnapshotAsset` types to `frontend/src/types/api.ts`
  - [x] Add `SnapshotListFilters` type for date range filtering
  - [x] Add `SnapshotListResponse` type for API response

- [x] Task 2: Add snapshots API methods (AC: #1, #3)
  - [x] Add `snapshots.list(filters?)` method to `frontend/src/lib/api.ts`
  - [x] Add `snapshots.getById(id)` method for optional future use
  - [x] Create `frontend/src/lib/api.test.ts` snapshot tests

- [x] Task 3: Add snapshot query keys (AC: #1, #3)
  - [x] Add `snapshots` key factory to `frontend/src/lib/queryKeys.ts`
  - [x] Support filtering by date range in keys

- [x] Task 4: Create useSnapshots hook (AC: #1, #3)
  - [x] Create `frontend/src/features/evolution/hooks/useSnapshots.ts`
  - [x] Use TanStack Query with `queryKeys.snapshots.list(filters)`
  - [x] Support date range filtering via hook params
  - [x] Create `frontend/src/features/evolution/hooks/useSnapshots.test.tsx`

- [x] Task 5: Add formatters for evolution data (AC: #4, #5)
  - [x] Add `formatDate(dateString, format)` to `frontend/src/lib/formatters.ts`
  - [x] Add `formatGrowth(startValue, endValue)` for growth % calculation
  - [x] Create tests for new formatters

- [x] Task 6: Create EvolutionChart component (AC: #1, #2, #4)
  - [x] Create `frontend/src/features/evolution/components/EvolutionChart.tsx`
  - [x] Use Recharts LineChart with responsive container
  - [x] X-axis: formatted dates, Y-axis: formatted currency
  - [x] Implement custom tooltip showing date and value
  - [x] Create `frontend/src/features/evolution/components/EvolutionChart.test.tsx`

- [x] Task 7: Create DateRangeSelector component (AC: #3)
  - [x] Create `frontend/src/features/evolution/components/DateRangeSelector.tsx`
  - [x] Button group with options: 1M, 3M, 6M, 1Y, All
  - [x] Active state styling for selected option
  - [x] Emit date range on selection (from/to dates)
  - [x] Create `frontend/src/features/evolution/components/DateRangeSelector.test.tsx`

- [x] Task 8: Create EvolutionSummary component (AC: #5)
  - [x] Create `frontend/src/features/evolution/components/EvolutionSummary.tsx`
  - [x] Display: starting value, ending value, absolute change, percentage change
  - [x] Color-coded positive/negative growth indicators
  - [x] Handle edge cases (no data, single snapshot)
  - [x] Create `frontend/src/features/evolution/components/EvolutionSummary.test.tsx`

- [x] Task 9: Create Evolution page (AC: #1, #2, #3, #4, #5)
  - [x] Create `frontend/src/features/evolution/index.tsx`
  - [x] Compose: DateRangeSelector, EvolutionChart, EvolutionSummary
  - [x] Manage date range state at page level
  - [x] Handle loading and error states
  - [x] Empty state when no snapshots exist
  - [x] Create `frontend/src/features/evolution/index.test.tsx`

- [x] Task 10: Add Evolution route to app (AC: #1)
  - [x] Add `/evolution` route to `frontend/src/router.tsx`
  - [x] Add navigation link to evolution page in Layout

- [x] Task 11: Run all tests and ensure passing
  - [x] Run `pnpm test` to verify all tests pass
  - [x] Fix any failing tests

## Dev Notes

### Snapshot Types (frontend/src/types/api.ts)

```typescript
// Add to frontend/src/types/api.ts

export interface SnapshotAsset {
  assetId: string
  ticker: string
  name: string
  quantity: string
  price: string
  value: string
  percentage: string
}

export interface Snapshot {
  id: string
  date: string // ISO 8601
  totalValue: string
  assets: SnapshotAsset[]
  createdAt: string
}

export interface SnapshotListFilters {
  from?: string // ISO date string
  to?: string   // ISO date string
}

export interface SnapshotListResponse {
  snapshots: Snapshot[]
  total: number
}
```

### API Methods (frontend/src/lib/api.ts)

```typescript
// Add to api object in frontend/src/lib/api.ts

snapshots: {
  list: async (filters?: SnapshotListFilters): Promise<SnapshotListResponse> => {
    const params = new URLSearchParams()
    if (filters?.from) params.append('from', filters.from)
    if (filters?.to) params.append('to', filters.to)

    const queryString = params.toString()
    const url = queryString
      ? `${API_URL}/snapshots?${queryString}`
      : `${API_URL}/snapshots`

    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })

    if (!res.ok) {
      const json = await res.json()
      throw new ApiError(
        json.error || 'UNKNOWN_ERROR',
        json.message || 'An unexpected error occurred',
        json.details
      )
    }

    const json = await res.json()
    return {
      snapshots: json.data,
      total: json.meta?.total ?? json.data.length,
    }
  },

  getById: async (id: string): Promise<Snapshot> => {
    const res = await fetch(`${API_URL}/snapshots/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return handleResponse<Snapshot>(res)
  },
},
```

### Query Keys (frontend/src/lib/queryKeys.ts)

```typescript
// Add to queryKeys object in frontend/src/lib/queryKeys.ts
import type { SnapshotListFilters } from '@/types/api'

snapshots: {
  all: ['snapshots'] as const,
  list: (filters?: SnapshotListFilters) =>
    [...queryKeys.snapshots.all, 'list', filters] as const,
  detail: (id: string) =>
    [...queryKeys.snapshots.all, 'detail', id] as const,
},
```

### useSnapshots Hook Pattern

```typescript
// frontend/src/features/evolution/hooks/useSnapshots.ts
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import type { SnapshotListFilters } from '@/types/api'

export function useSnapshots(filters?: SnapshotListFilters) {
  return useQuery({
    queryKey: queryKeys.snapshots.list(filters),
    queryFn: () => api.snapshots.list(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
```

### Recharts Implementation

**CRITICAL: Use Recharts (already in architecture)**

```typescript
// frontend/src/features/evolution/components/EvolutionChart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { Snapshot } from '@/types/api'
import { formatCurrency } from '@/lib/formatters'

interface EvolutionChartProps {
  snapshots: Snapshot[]
  isLoading?: boolean
}

export function EvolutionChart({ snapshots, isLoading }: EvolutionChartProps) {
  // Transform snapshots to chart data (sorted by date asc for chart)
  const data = [...snapshots]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(s => ({
      date: s.date,
      value: parseFloat(s.totalValue),
      formattedDate: formatDate(s.date, 'short'),
      formattedValue: formatCurrency(s.totalValue),
    }))

  if (isLoading) {
    return <div className="h-80 animate-pulse bg-muted rounded" />
  }

  if (data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-muted-foreground">
        No hay datos de evolución aún. Los snapshots se crean cuando actualizas precios.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="formattedDate"
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <YAxis
          tickFormatter={(value) => formatCurrency(value, 'USD').replace('$', '')}
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="value"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof data[0] }> }) {
  if (!active || !payload?.[0]) return null

  const { formattedDate, formattedValue } = payload[0].payload
  return (
    <div className="bg-popover border rounded-lg p-3 shadow-lg">
      <p className="text-sm text-muted-foreground">{formattedDate}</p>
      <p className="text-lg font-semibold">{formattedValue}</p>
    </div>
  )
}
```

### Date Range Calculation

```typescript
// Helper for DateRangeSelector
export function getDateRange(period: '1M' | '3M' | '6M' | '1Y' | 'ALL'): { from?: string; to?: string } {
  if (period === 'ALL') {
    return {} // No filter
  }

  const now = new Date()
  const to = now.toISOString()

  const monthsMap: Record<string, number> = {
    '1M': 1,
    '3M': 3,
    '6M': 6,
    '1Y': 12,
  }

  const from = new Date(now)
  from.setMonth(from.getMonth() - monthsMap[period])

  return {
    from: from.toISOString(),
    to,
  }
}
```

### DateRangeSelector Component

```typescript
// frontend/src/features/evolution/components/DateRangeSelector.tsx
import { useState } from 'react'

type DateRangePeriod = '1M' | '3M' | '6M' | '1Y' | 'ALL'

interface DateRangeSelectorProps {
  value: DateRangePeriod
  onChange: (period: DateRangePeriod) => void
}

const periods: { value: DateRangePeriod; label: string }[] = [
  { value: '1M', label: '1M' },
  { value: '3M', label: '3M' },
  { value: '6M', label: '6M' },
  { value: '1Y', label: '1Y' },
  { value: 'ALL', label: 'Todo' },
]

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  return (
    <div className="inline-flex rounded-lg border p-1 gap-1">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
            value === period.value
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted'
          )}
        >
          {period.label}
        </button>
      ))}
    </div>
  )
}
```

### EvolutionSummary Component

```typescript
// frontend/src/features/evolution/components/EvolutionSummary.tsx
import { formatCurrency, formatPercentage } from '@/lib/formatters'
import type { Snapshot } from '@/types/api'

interface EvolutionSummaryProps {
  snapshots: Snapshot[]
}

export function EvolutionSummary({ snapshots }: EvolutionSummaryProps) {
  if (snapshots.length === 0) {
    return null
  }

  // Sort by date ascending to get first and last
  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const firstSnapshot = sorted[0]
  const lastSnapshot = sorted[sorted.length - 1]

  const startValue = parseFloat(firstSnapshot.totalValue)
  const endValue = parseFloat(lastSnapshot.totalValue)
  const absoluteChange = endValue - startValue
  const percentChange = startValue > 0 ? ((endValue - startValue) / startValue) * 100 : 0
  const isPositive = absoluteChange >= 0

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
      <div className="bg-card border rounded-lg p-4">
        <p className="text-sm text-muted-foreground">Valor inicial</p>
        <p className="text-xl font-semibold">{formatCurrency(startValue)}</p>
        <p className="text-xs text-muted-foreground">
          {formatDate(firstSnapshot.date, 'short')}
        </p>
      </div>

      <div className="bg-card border rounded-lg p-4">
        <p className="text-sm text-muted-foreground">Valor actual</p>
        <p className="text-xl font-semibold">{formatCurrency(endValue)}</p>
        <p className="text-xs text-muted-foreground">
          {formatDate(lastSnapshot.date, 'short')}
        </p>
      </div>

      <div className="bg-card border rounded-lg p-4">
        <p className="text-sm text-muted-foreground">Cambio absoluto</p>
        <p className={cn(
          'text-xl font-semibold',
          isPositive ? 'text-green-600' : 'text-red-600'
        )}>
          {isPositive ? '+' : ''}{formatCurrency(absoluteChange)}
        </p>
      </div>

      <div className="bg-card border rounded-lg p-4">
        <p className="text-sm text-muted-foreground">Cambio porcentual</p>
        <p className={cn(
          'text-xl font-semibold',
          isPositive ? 'text-green-600' : 'text-red-600'
        )}>
          {isPositive ? '+' : ''}{formatPercentage(percentChange)}
        </p>
      </div>
    </div>
  )
}
```

### Evolution Page

```typescript
// frontend/src/features/evolution/index.tsx
import { useState } from 'react'
import { useSnapshots } from './hooks/useSnapshots'
import { EvolutionChart } from './components/EvolutionChart'
import { DateRangeSelector } from './components/DateRangeSelector'
import { EvolutionSummary } from './components/EvolutionSummary'
import { getDateRange } from './utils'

type DateRangePeriod = '1M' | '3M' | '6M' | '1Y' | 'ALL'

export default function EvolutionPage() {
  const [period, setPeriod] = useState<DateRangePeriod>('ALL')
  const filters = getDateRange(period)

  const { data, isLoading, error } = useSnapshots(filters)

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 text-destructive rounded-lg p-4">
          Error al cargar datos: {error.message}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Evolución del Portfolio</h1>
        <DateRangeSelector value={period} onChange={setPeriod} />
      </div>

      <div className="bg-card border rounded-lg p-6">
        <EvolutionChart
          snapshots={data?.snapshots ?? []}
          isLoading={isLoading}
        />
      </div>

      <EvolutionSummary snapshots={data?.snapshots ?? []} />
    </div>
  )
}
```

### Route Configuration

```typescript
// Add to frontend/src/App.tsx routes
import EvolutionPage from '@/features/evolution'

// In routes array:
{ path: '/evolution', element: <EvolutionPage /> }
```

### Formatters Addition

```typescript
// Add to frontend/src/lib/formatters.ts
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export function formatDate(
  dateString: string,
  style: 'short' | 'medium' | 'long' = 'medium'
): string {
  const date = new Date(dateString)

  const formats: Record<string, string> = {
    short: 'dd/MM',
    medium: 'dd MMM yyyy',
    long: 'dd MMMM yyyy',
  }

  return format(date, formats[style], { locale: es })
}

export function formatGrowth(startValue: number, endValue: number): {
  absolute: number
  percentage: number
  isPositive: boolean
} {
  const absolute = endValue - startValue
  const percentage = startValue > 0 ? ((endValue - startValue) / startValue) * 100 : 0

  return {
    absolute,
    percentage,
    isPositive: absolute >= 0,
  }
}
```

### File Structure

```
frontend/src/
├── lib/
│   ├── api.ts                          (MODIFY - add snapshots methods)
│   ├── queryKeys.ts                    (MODIFY - add snapshots keys)
│   └── formatters.ts                   (MODIFY - add formatDate, formatGrowth)
├── types/
│   └── api.ts                          (MODIFY - add Snapshot types)
└── features/
    └── evolution/                       (NEW FOLDER)
        ├── index.tsx                   (NEW - Evolution page)
        ├── index.test.tsx              (NEW)
        ├── utils.ts                    (NEW - getDateRange helper)
        ├── hooks/
        │   ├── useSnapshots.ts         (NEW)
        │   └── useSnapshots.test.tsx   (NEW)
        └── components/
            ├── EvolutionChart.tsx      (NEW)
            ├── EvolutionChart.test.tsx (NEW)
            ├── DateRangeSelector.tsx   (NEW)
            ├── DateRangeSelector.test.tsx (NEW)
            ├── EvolutionSummary.tsx    (NEW)
            └── EvolutionSummary.test.tsx (NEW)
```

### Dependencies to Install

```bash
# Already in architecture, verify installed:
pnpm list recharts date-fns

# If not installed:
cd frontend && pnpm add recharts date-fns
```

### Testing Requirements

```typescript
// frontend/src/features/evolution/components/EvolutionChart.test.tsx
describe('EvolutionChart', () => {
  it('should render loading state')
  it('should render empty state when no snapshots')
  it('should render chart with data points')
  it('should sort snapshots by date ascending')
  it('should format values correctly in tooltip')
})

// frontend/src/features/evolution/components/DateRangeSelector.test.tsx
describe('DateRangeSelector', () => {
  it('should render all period options')
  it('should highlight active period')
  it('should call onChange with selected period')
})

// frontend/src/features/evolution/components/EvolutionSummary.test.tsx
describe('EvolutionSummary', () => {
  it('should return null when no snapshots')
  it('should calculate and display start and end values')
  it('should show positive change in green')
  it('should show negative change in red')
  it('should format currency and percentage correctly')
})

// frontend/src/features/evolution/index.test.tsx
describe('EvolutionPage', () => {
  it('should render page title')
  it('should render date range selector')
  it('should fetch snapshots on mount')
  it('should refetch when period changes')
  it('should show error state on API failure')
  it('should show loading state while fetching')
})

// frontend/src/features/evolution/hooks/useSnapshots.test.tsx
describe('useSnapshots', () => {
  it('should fetch snapshots without filters')
  it('should pass date filters to API')
  it('should return loading state initially')
  it('should return data on success')
})
```

### Anti-Patterns to Avoid

```typescript
// NEVER use fetch directly
fetch('/api/snapshots') // WRONG
api.snapshots.list() // CORRECT

// NEVER skip type safety
const data: any = ... // WRONG
const data: Snapshot[] = ... // CORRECT

// NEVER mutate chart data in place
snapshots.sort(...) // WRONG - mutates original array
[...snapshots].sort(...) // CORRECT - creates new array

// NEVER use inline styles for colors
style={{ color: 'green' }} // WRONG
className="text-green-600" // CORRECT

// NEVER skip loading/error states
if (!data) return null // WRONG
if (isLoading) return <Loading /> // CORRECT
if (error) return <Error /> // CORRECT

// NEVER hardcode date formats
new Date().toLocaleDateString() // Inconsistent
format(date, 'dd/MM/yyyy', { locale: es }) // CORRECT
```

### Recharts Styling with Tailwind

**IMPORTANT**: Recharts uses inline styles by default. Use className for Tailwind CSS variables:

```typescript
// Use CSS variables for theme compatibility
<Line stroke="hsl(var(--primary))" /> // Works with theme
<CartesianGrid className="stroke-muted" /> // Tailwind class

// For tooltip styling, use Tailwind classes on wrapper div
<div className="bg-popover border rounded-lg p-3 shadow-lg">
```

### API Response Format Reference

Backend returns:
```json
GET /api/snapshots
{
  "data": [
    {
      "id": "clxyz123...",
      "date": "2026-01-10T00:00:00.000Z",
      "totalValue": "125000.00",
      "assets": [...],
      "createdAt": "2026-01-10T15:30:00.000Z"
    }
  ],
  "meta": { "total": 12 }
}
```

### Previous Story Intelligence (6-1-portfolio-snapshots-api)

**Key Patterns from Backend Implementation:**
- Snapshots stored with `totalValueCents` as BigInt, returned as string `totalValue`
- Date stored as Date type at midnight UTC
- One snapshot per day (unique constraint on userId+date)
- Assets breakdown included in response with all monetary values as strings
- `fromCents()` utility used for BigInt to string conversion

**Files Created in Previous Story:**
- `backend/src/services/snapshotService.ts` - snapshot CRUD logic
- `backend/src/routes/snapshots.ts` - API endpoints
- `backend/prisma/schema.prisma` - PortfolioSnapshot and SnapshotAsset models

### Key Technical Constraints

- **Recharts**: Use for all charting (already in architecture)
- **date-fns**: Use for date formatting with Spanish locale
- **TanStack Query**: Use for data fetching with caching
- **Responsive**: Chart must work on mobile (ResponsiveContainer)
- **Accessibility**: Chart tooltips must be keyboard accessible
- **Theme**: Colors must use CSS variables for dark mode compatibility

### Project Context Reference

See `_bmad-output/project-context.md` for:
- TypeScript strict mode rules (no `any`)
- Path aliases (`@/features`, `@/lib`, `@/types`)
- Naming conventions (camelCase for files, PascalCase for components)
- API client usage pattern (always through `lib/api.ts`)
- TanStack Query patterns with query keys factory

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-6.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend-Architecture]
- [Source: backend/src/services/snapshotService.ts - API response format]
- [Source: frontend/src/lib/api.ts - API client pattern]
- [Source: frontend/src/lib/queryKeys.ts - Query key factory pattern]
- [Source: frontend/src/features/dashboard - Component structure pattern]
- [Source: frontend/src/lib/formatters.ts - Formatting utilities]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

- Implemented complete Evolution feature for portfolio historical tracking
- Added Snapshot types (Snapshot, SnapshotAsset, SnapshotListFilters, SnapshotListResponse) to frontend types
- Added snapshots API methods (list with date filtering, getById) to api.ts
- Added snapshots query keys factory supporting date range filtering
- Created useSnapshots hook with TanStack Query integration and 5-minute stale time
- Added formatDate (short/medium/long styles with Spanish locale) and formatGrowth formatters
- Created EvolutionChart component using Recharts LineChart with custom tooltip
- Created DateRangeSelector component with 1M/3M/6M/1Y/All period options
- Created EvolutionSummary component showing start/end values, absolute and percentage change with color-coded indicators
- Created Evolution page composing all components with date range state management
- Added /evolution route and navigation link "Evolución" to Layout
- Installed date-fns dependency for date formatting
- All 380 tests passing (29 new tests added for evolution feature)

### File List

**New Files:**
- frontend/src/features/evolution/index.tsx
- frontend/src/features/evolution/index.test.tsx
- frontend/src/features/evolution/utils.ts
- frontend/src/features/evolution/hooks/useSnapshots.ts
- frontend/src/features/evolution/hooks/useSnapshots.test.tsx
- frontend/src/features/evolution/components/EvolutionChart.tsx
- frontend/src/features/evolution/components/EvolutionChart.test.tsx
- frontend/src/features/evolution/components/DateRangeSelector.tsx
- frontend/src/features/evolution/components/DateRangeSelector.test.tsx
- frontend/src/features/evolution/components/EvolutionSummary.tsx
- frontend/src/features/evolution/components/EvolutionSummary.test.tsx
- frontend/src/lib/formatters.test.ts

**Modified Files:**
- frontend/src/types/api.ts (added Snapshot types)
- frontend/src/lib/api.ts (added snapshots methods)
- frontend/src/lib/queryKeys.ts (added snapshots keys)
- frontend/src/lib/formatters.ts (added formatDate, formatGrowth)
- frontend/src/router.tsx (added /evolution route)
- frontend/src/components/layout/Layout.tsx (added Evolución nav link)
- frontend/package.json (added date-fns dependency)
- _bmad-output/implementation-artifacts/sprint-status.yaml (status update)
