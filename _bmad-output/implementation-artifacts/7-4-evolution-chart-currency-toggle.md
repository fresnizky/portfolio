# Story 7.4: Evolution Chart Currency Toggle

Status: ready-for-dev

## Story

As a **user**,
I want **to view my portfolio evolution chart in USD or ARS via a toggle**,
So that **I can analyze my portfolio growth in my preferred currency**.

## Acceptance Criteria

1. **Given** I am on the evolution page, **When** the page loads, **Then** I see a currency toggle (USD/ARS) near the date range selector

2. **Given** I have the chart showing in USD (default), **When** I click the ARS toggle, **Then** the chart redraws with all values converted to ARS using the current exchange rate

3. **Given** I toggle to ARS, **When** I view the chart tooltip, **Then** I see values formatted in ARS (e.g., "ARS 1.500.000,00")

4. **Given** I toggle to ARS, **When** I view the EvolutionSummary cards, **Then** all values (initial, current, change) are displayed in ARS

5. **Given** I switch between USD and ARS, **When** I change the date range filter, **Then** the selected currency persists (doesn't reset to default)

6. **Given** I select ARS currency, **When** I return to the evolution page later in the same session, **Then** my currency preference is remembered (session state)

## Tasks / Subtasks

- [x] Task 1: Create CurrencyToggle component (AC: #1)
  - [x] Create `frontend/src/features/evolution/components/CurrencyToggle.tsx`
  - [x] Two-button toggle: USD (default) | ARS
  - [x] Style to match DateRangeSelector (inline-flex, rounded-lg, border)
  - [x] Selected state: `bg-blue-500 text-white`
  - [x] Write tests

- [x] Task 2: Add displayCurrency state to EvolutionPage (AC: #5, #6)
  - [x] Add `displayCurrency` state with useState, default 'USD'
  - [x] Pass `displayCurrency` to EvolutionChart
  - [x] Pass `displayCurrency` to EvolutionSummary
  - [x] Pass `displayCurrency` and `onCurrencyChange` to CurrencyToggle

- [x] Task 3: Update useSnapshots hook to fetch exchange rate (AC: #2)
  - [x] Modify hook to also fetch current exchange rate via useExchangeRate
  - [x] Return `exchangeRate` alongside `snapshots` data
  - [x] Handle loading state for both queries
  - Note: Implemented via useExchangeRate directly in EvolutionPage (cleaner approach per Dev Notes)

- [x] Task 4: Update EvolutionChart for multi-currency (AC: #2, #3)
  - [x] Add `displayCurrency` and `exchangeRate` props
  - [x] Convert snapshot values when displayCurrency is ARS
  - [x] Update CustomTooltip to format with correct currency
  - [x] Update YAxis tickFormatter for correct currency
  - [x] Write tests

- [x] Task 5: Update EvolutionSummary for multi-currency (AC: #4)
  - [x] Add `displayCurrency` and `exchangeRate` props
  - [x] Convert all values (start, end, absoluteChange) to display currency
  - [x] Use formatCurrency with displayCurrency parameter
  - [x] Write tests

- [ ] Task 6: Update formatCurrency for proper ARS formatting (AC: #3, #4)
  - [ ] Ensure ARS uses 'es-AR' locale for proper formatting ($ 1.500.000,00)
  - [ ] Add tests for ARS formatting

- [ ] Task 7: Run all tests and ensure passing
  - [ ] Run `pnpm test` in frontend
  - [ ] Fix any failing tests

## Dev Notes

### CurrencyToggle Component

```typescript
// frontend/src/features/evolution/components/CurrencyToggle.tsx

import type { Currency } from '@/types/api'

interface CurrencyToggleProps {
  value: Currency
  onChange: (currency: Currency) => void
}

const currencies: { value: Currency; label: string }[] = [
  { value: 'USD', label: 'USD' },
  { value: 'ARS', label: 'ARS' },
]

export function CurrencyToggle({ value, onChange }: CurrencyToggleProps) {
  return (
    <div className="inline-flex rounded-lg border p-1 gap-1">
      {currencies.map((currency) => (
        <button
          key={currency.value}
          onClick={() => onChange(currency.value)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            value === currency.value
              ? 'bg-blue-500 text-white'
              : 'hover:bg-gray-100'
          }`}
        >
          {currency.label}
        </button>
      ))}
    </div>
  )
}
```

### Updated EvolutionPage

```typescript
// frontend/src/features/evolution/index.tsx

import { useState } from 'react'
import { useSnapshots } from './hooks/useSnapshots'
import { useExchangeRate } from '@/features/exchange-rates/hooks/useExchangeRate'
import { EvolutionChart } from './components/EvolutionChart'
import { DateRangeSelector } from './components/DateRangeSelector'
import { CurrencyToggle } from './components/CurrencyToggle'
import { EvolutionSummary } from './components/EvolutionSummary'
import { getDateRange, type DateRangePeriod } from './utils'
import type { Currency } from '@/types/api'

export default function EvolutionPage() {
  const [period, setPeriod] = useState<DateRangePeriod>('ALL')
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('USD')
  const filters = getDateRange(period)

  const { data, isLoading, error } = useSnapshots(
    filters.from || filters.to ? filters : undefined
  )
  const { data: exchangeRateData } = useExchangeRate()

  // Only need rate if displaying in ARS
  const exchangeRate = displayCurrency === 'ARS' ? exchangeRateData?.rate : null

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 rounded-lg p-4">
          Error al cargar datos: {error.message}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Evolución del Portfolio</h1>
        <div className="flex items-center gap-4">
          <CurrencyToggle value={displayCurrency} onChange={setDisplayCurrency} />
          <DateRangeSelector value={period} onChange={setPeriod} />
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <EvolutionChart
          snapshots={data?.snapshots ?? []}
          isLoading={isLoading}
          displayCurrency={displayCurrency}
          exchangeRate={exchangeRate}
        />
      </div>

      <EvolutionSummary
        snapshots={data?.snapshots ?? []}
        displayCurrency={displayCurrency}
        exchangeRate={exchangeRate}
      />
    </div>
  )
}
```

### Updated EvolutionChart

```typescript
// frontend/src/features/evolution/components/EvolutionChart.tsx

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { Snapshot, Currency } from '@/types/api'
import { formatCurrency, formatDate } from '@/lib/formatters'

interface ChartDataPoint {
  date: string
  value: number
  formattedDate: string
  formattedValue: string
}

interface EvolutionChartProps {
  snapshots: Snapshot[]
  isLoading?: boolean
  displayCurrency: Currency
  exchangeRate: number | null  // USD to ARS rate
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: ChartDataPoint }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.[0]) return null

  const { formattedDate, formattedValue } = payload[0].payload
  return (
    <div className="bg-white border rounded-lg p-3 shadow-lg">
      <p className="text-sm text-gray-500">{formattedDate}</p>
      <p className="text-lg font-semibold">{formattedValue}</p>
    </div>
  )
}

export function EvolutionChart({
  snapshots,
  isLoading,
  displayCurrency,
  exchangeRate,
}: EvolutionChartProps) {
  // Convert value based on currency
  const convertValue = (usdValue: number): number => {
    if (displayCurrency === 'ARS' && exchangeRate) {
      return usdValue * exchangeRate
    }
    return usdValue
  }

  // Transform snapshots to chart data (sorted by date asc for chart)
  const data: ChartDataPoint[] = [...snapshots]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((s) => {
      const usdValue = parseFloat(s.totalValue)
      const displayValue = convertValue(usdValue)
      return {
        date: s.date,
        value: displayValue,
        formattedDate: formatDate(s.date, 'medium'),
        formattedValue: formatCurrency(displayValue, displayCurrency),
      }
    })

  if (isLoading) {
    return <div className="h-80 animate-pulse bg-gray-200 rounded" />
  }

  if (data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        No hay datos de evolución aún. Los snapshots se crean cuando actualizas precios.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="formattedDate"
          tick={{ fontSize: 12 }}
          stroke="#6b7280"
        />
        <YAxis
          tickFormatter={(value) => {
            const formatted = formatCurrency(value, displayCurrency)
            // Remove currency symbol for cleaner axis
            return displayCurrency === 'USD'
              ? formatted.replace('$', '')
              : formatted.replace(/^[^\d]+/, '')
          }}
          tick={{ fontSize: 12 }}
          stroke="#6b7280"
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

### Updated EvolutionSummary

```typescript
// frontend/src/features/evolution/components/EvolutionSummary.tsx

import { formatCurrency, formatPercentage, formatDate } from '@/lib/formatters'
import type { Snapshot, Currency } from '@/types/api'

interface EvolutionSummaryProps {
  snapshots: Snapshot[]
  displayCurrency: Currency
  exchangeRate: number | null
}

export function EvolutionSummary({
  snapshots,
  displayCurrency,
  exchangeRate,
}: EvolutionSummaryProps) {
  if (snapshots.length === 0) {
    return null
  }

  // Convert value based on currency
  const convertValue = (usdValue: number): number => {
    if (displayCurrency === 'ARS' && exchangeRate) {
      return usdValue * exchangeRate
    }
    return usdValue
  }

  // Sort by date ascending to get first and last
  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const firstSnapshot = sorted[0]
  const lastSnapshot = sorted[sorted.length - 1]

  const startValueUSD = parseFloat(firstSnapshot.totalValue)
  const endValueUSD = parseFloat(lastSnapshot.totalValue)

  const startValue = convertValue(startValueUSD)
  const endValue = convertValue(endValueUSD)
  const absoluteChange = endValue - startValue

  // Percentage change is currency-agnostic (same in USD or ARS)
  const percentChange = startValueUSD > 0
    ? ((endValueUSD - startValueUSD) / startValueUSD) * 100
    : 0
  const isPositive = absoluteChange >= 0

  const changeColorClass = isPositive ? 'text-green-600' : 'text-red-600'

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
      <div className="bg-white border rounded-lg p-4">
        <p className="text-sm text-gray-500">Valor inicial</p>
        <p className="text-xl font-semibold">
          {formatCurrency(startValue, displayCurrency)}
        </p>
        <p className="text-xs text-gray-400">
          {formatDate(firstSnapshot.date, 'short')}
        </p>
      </div>

      <div className="bg-white border rounded-lg p-4">
        <p className="text-sm text-gray-500">Valor actual</p>
        <p className="text-xl font-semibold">
          {formatCurrency(endValue, displayCurrency)}
        </p>
        <p className="text-xs text-gray-400">
          {formatDate(lastSnapshot.date, 'short')}
        </p>
      </div>

      <div className="bg-white border rounded-lg p-4">
        <p className="text-sm text-gray-500">Cambio absoluto</p>
        <p className={`text-xl font-semibold ${changeColorClass}`}>
          {isPositive ? '+' : ''}{formatCurrency(absoluteChange, displayCurrency)}
        </p>
      </div>

      <div className="bg-white border rounded-lg p-4">
        <p className="text-sm text-gray-500">Cambio porcentual</p>
        <p className={`text-xl font-semibold ${changeColorClass}`}>
          {isPositive ? '+' : ''}{formatPercentage(percentChange)}
        </p>
      </div>
    </div>
  )
}
```

### Updated formatCurrency (if needed)

The current `formatCurrency` implementation already supports ARS via the `currency` parameter and `Intl.NumberFormat`. Verify it uses proper locale:

```typescript
// frontend/src/lib/formatters.ts

export function formatCurrency(value: string | number, currency: Currency = 'USD'): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value

  // Use appropriate locale for proper formatting
  const locale = currency === 'ARS' ? 'es-AR' : 'en-US'

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue)
}
```

**Expected Output:**
- USD: `$12,345.67`
- ARS: `$ 12.345,67` (Spanish Argentina locale)

### File Structure

```
frontend/src/features/evolution/
├── index.tsx                          (MODIFY - add currency state)
├── components/
│   ├── CurrencyToggle.tsx             (CREATE)
│   ├── CurrencyToggle.test.tsx        (CREATE)
│   ├── DateRangeSelector.tsx          (no changes)
│   ├── EvolutionChart.tsx             (MODIFY - add currency props)
│   ├── EvolutionChart.test.tsx        (MODIFY)
│   ├── EvolutionSummary.tsx           (MODIFY - add currency props)
│   └── EvolutionSummary.test.tsx      (MODIFY)
├── hooks/
│   └── useSnapshots.ts                (no changes - uses existing hook)
└── utils.ts                           (no changes)

frontend/src/lib/
└── formatters.ts                      (VERIFY - may need locale fix)
```

### Testing Strategy

```typescript
// CurrencyToggle.test.tsx
describe('CurrencyToggle', () => {
  it('should render USD and ARS options')
  it('should highlight selected currency')
  it('should call onChange when clicking different currency')
  it('should not call onChange when clicking already selected')
})

// EvolutionChart.test.tsx - Add tests
describe('EvolutionChart with currency toggle', () => {
  it('should display values in USD by default')
  it('should convert and display values in ARS when selected')
  it('should format tooltip correctly for ARS')
  it('should handle null exchangeRate gracefully (show USD)')
})

// EvolutionSummary.test.tsx - Add tests
describe('EvolutionSummary with currency toggle', () => {
  it('should display all values in USD by default')
  it('should convert all values to ARS when selected')
  it('should calculate percentage change correctly regardless of currency')
  it('should handle null exchangeRate (fallback to USD values)')
})

// formatters.test.ts - Add ARS tests
describe('formatCurrency', () => {
  it('should format USD with US locale: $1,234.56')
  it('should format ARS with AR locale: $ 1.234,56')
  it('should handle large ARS amounts correctly')
})
```

### Dependencies

**From Story 7-2 (already implemented):**
- `useExchangeRate` hook - `/frontend/src/features/exchange-rates/hooks/useExchangeRate.ts`
- `ExchangeRateResponse` type in `api.ts`
- Backend exchange rate endpoint already exists

**No new dependencies required.**

### UI/UX Patterns to Follow

From existing components:
- `DateRangeSelector`: Button toggle styling pattern (copy exactly)
- `inline-flex rounded-lg border p-1 gap-1` for container
- `bg-blue-500 text-white` for selected state
- `hover:bg-gray-100` for unselected state
- `px-3 py-1.5 text-sm font-medium rounded-md transition-colors` for buttons

### Exchange Rate Handling

**Current exchange rate behavior from Story 7-2:**
- `useExchangeRate()` returns: `{ rate: number, fetchedAt: string, isStale: boolean }`
- Rate is USD to ARS (e.g., rate=1100 means 1 USD = 1100 ARS)
- To convert USD to ARS: `usdValue * rate`
- To convert ARS to USD: `arsValue / rate` (not needed for this story)

**Edge case handling:**
- If `exchangeRate` is null (API failed), fall back to USD display
- If `displayCurrency` is USD, don't multiply by anything (rate = 1)

### Anti-Patterns to Avoid

```typescript
// NEVER hardcode exchange rates
const arsValue = usdValue * 1100 // WRONG

// ALWAYS use the exchange rate from useExchangeRate
const arsValue = exchangeRate ? usdValue * exchangeRate : usdValue // CORRECT

// NEVER modify snapshot data directly
snapshots[0].totalValue = convertedValue // WRONG

// ALWAYS transform in the render/map phase
const displayValue = convertValue(parseFloat(s.totalValue)) // CORRECT

// NEVER forget to pass displayCurrency to formatCurrency
formatCurrency(value) // WRONG - defaults to USD always
formatCurrency(value, displayCurrency) // CORRECT

// NEVER calculate percentage change in converted currency
const pctChange = (arsEnd - arsStart) / arsStart // WRONG - introduces FX error
const pctChange = (usdEnd - usdStart) / usdStart // CORRECT - currency agnostic
```

### Previous Story Intelligence

**From Story 7-3 (Dashboard Multi-Currency):**
- `ExchangeRateIndicator` component created (not needed here - simpler toggle)
- `formatCurrency` already supports ARS via parameter
- Pattern: convert at display time, not at data level
- Pattern: pass `displayCurrency` as prop through component tree

**Files from 7-3 to reference:**
- `frontend/src/features/dashboard/components/PositionsList.tsx` - dual value display pattern
- `frontend/src/types/api.ts` - `Currency` type, `ExchangeRateInfo` interface

### Project Context Reference

See `_bmad-output/project-context.md` for:
- Component naming: PascalCase.tsx
- Test files: co-located `*.test.tsx`
- State management: useState for local state (no Zustand needed)
- TanStack Query: use existing `useExchangeRate` hook
- Tailwind patterns: match existing component styles

### References

- [Source: frontend/src/features/evolution/index.tsx - Current evolution page]
- [Source: frontend/src/features/evolution/components/EvolutionChart.tsx - Chart implementation]
- [Source: frontend/src/features/evolution/components/EvolutionSummary.tsx - Summary cards]
- [Source: frontend/src/features/evolution/components/DateRangeSelector.tsx - Toggle pattern to copy]
- [Source: frontend/src/features/exchange-rates/hooks/useExchangeRate.ts - Exchange rate hook]
- [Source: frontend/src/lib/formatters.ts - Currency formatting]
- [Source: _bmad-output/implementation-artifacts/7-3-dashboard-multi-currency-display.md - Multi-currency patterns]
- [Source: _bmad-output/planning-artifacts/sprint-change-proposal-2026-01-11.md - FR38 requirement]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

- Task 1: Created CurrencyToggle component with USD/ARS toggle matching DateRangeSelector styling. 5 tests covering render, highlight states, and onChange behavior.
- Task 2: Added displayCurrency state to EvolutionPage, integrated useExchangeRate hook, passed props to child components. 3 new tests for currency persistence.
- Task 3: Exchange rate fetch implemented in Task 2 via useExchangeRate in EvolutionPage (cleaner than modifying useSnapshots).
- Task 4: Updated EvolutionChart with convertValue function, currency-aware data transformation, tooltip and YAxis formatting. 4 new tests.
- Task 5: Updated EvolutionSummary with convertValue, effectiveCurrency for fallback, all values now currency-aware. 4 new tests.

### File List

- frontend/src/features/evolution/components/CurrencyToggle.tsx (created)
- frontend/src/features/evolution/components/CurrencyToggle.test.tsx (created)
- frontend/src/features/evolution/index.tsx (modified)
- frontend/src/features/evolution/index.test.tsx (modified)
- frontend/src/features/evolution/components/EvolutionChart.tsx (modified - multi-currency support)
- frontend/src/features/evolution/components/EvolutionChart.test.tsx (modified - 4 new tests)
- frontend/src/features/evolution/components/EvolutionSummary.tsx (modified - multi-currency support)
- frontend/src/features/evolution/components/EvolutionSummary.test.tsx (modified - 4 new tests)

