# Story 7.3: Dashboard Multi-Currency Display

Status: ready-for-dev

## Story

As a **user**,
I want **to see my portfolio values displayed in my preferred currency with exchange rate info**,
So that **I can understand my total portfolio value in a single currency regardless of asset currencies**.

## Acceptance Criteria

1. **Given** I have assets in both USD and ARS, **When** I view the dashboard, **Then** I see total portfolio value converted to my display currency (USD by default)

2. **Given** I view the dashboard, **When** exchange rate data is available, **Then** I see a small indicator showing "USD/ARS: $X.XX" and when it was last updated

3. **Given** I view the positions list, **When** an asset has a different currency than display currency, **Then** I see both the original value (in asset's currency) and converted value (in display currency)

4. **Given** the exchange rate is stale (>1 hour), **When** I view the dashboard, **Then** I see a warning badge indicating rates may be outdated

5. **Given** I click on the exchange rate indicator, **When** the modal opens, **Then** I can manually refresh the exchange rate

## Tasks / Subtasks

- [x] Task 1: Frontend - Update DashboardResponse types for exchange rate (AC: #1, #2)
  - [x] Add `exchangeRate` and `displayCurrency` to `DashboardResponse` in `frontend/src/types/api.ts`
  - [x] Add `ExchangeRateInfo` interface
  - [x] Update `DashboardPosition` to include `originalValue`, `originalCurrency`, `displayValue`

- [x] Task 2: Frontend - Create ExchangeRateIndicator component (AC: #2, #4, #5)
  - [x] Create `frontend/src/features/dashboard/components/ExchangeRateIndicator.tsx`
  - [x] Display current USD/ARS rate
  - [x] Display last updated time (relative format: "2 min ago")
  - [x] Show warning badge when `isStale` is true
  - [x] Add refresh button that calls exchange rate endpoint
  - [x] Write tests

- [ ] Task 3: Frontend - Update PortfolioSummaryCard for multi-currency (AC: #1)
  - [ ] Modify `PortfolioSummaryCard.tsx` to accept `displayCurrency` prop
  - [ ] Format currency with correct symbol based on `displayCurrency`
  - [ ] Update tests

- [ ] Task 4: Frontend - Update PositionsList for dual-value display (AC: #3)
  - [ ] Modify `PositionsList.tsx` to show original and converted values
  - [ ] Only show converted value if `originalCurrency !== displayCurrency`
  - [ ] Display format: "$1,500.00 USD (ARS 1,650,000.00)"
  - [ ] Update tests

- [ ] Task 5: Frontend - Update DashboardPage to include ExchangeRateIndicator (AC: #2, #4)
  - [ ] Import and add `ExchangeRateIndicator` component
  - [ ] Pass exchange rate info from dashboard data
  - [ ] Position indicator near total value
  - [ ] Handle null exchange rate (all assets in same currency)

- [ ] Task 6: Frontend - Update useDashboard hook (AC: #1)
  - [ ] Ensure hook passes `displayCurrency` query param if needed
  - [ ] Handle new response fields (`exchangeRate`, `displayCurrency`)

- [ ] Task 7: Frontend - Update formatCurrency for ARS support (AC: #3)
  - [ ] Modify `formatCurrency()` to handle ARS currency properly
  - [ ] ARS format: "ARS 1,500.00" or "$1,500.00 ARS"
  - [ ] Write tests

- [ ] Task 8: Run all frontend tests
  - [ ] Run `pnpm test` in frontend
  - [ ] Fix any failing tests

## Dev Notes

### Updated Types (api.ts)

```typescript
// frontend/src/types/api.ts - Add/Modify

export interface ExchangeRateInfo {
  usdToArs: number
  fetchedAt: string
  isStale: boolean
}

// Update DashboardPosition
export interface DashboardPosition {
  assetId: string
  ticker: string
  name: string
  category: AssetCategory
  currency: Currency  // ADD - asset's native currency
  quantity: string
  currentPrice: string | null
  value: string       // Original value in asset's currency
  originalCurrency: Currency  // ADD
  displayValue: string        // ADD - value in display currency
  displayCurrency: Currency   // ADD
  targetPercentage: string | null
  actualPercentage: string
  deviation: string
  priceUpdatedAt: string | null
}

// Update DashboardResponse
export interface DashboardResponse {
  totalValue: string
  displayCurrency: Currency      // ADD
  exchangeRate: ExchangeRateInfo | null  // ADD - null if no conversion needed
  positions: DashboardPosition[]
  alerts: DashboardAlert[]
}
```

### ExchangeRateIndicator Component

```typescript
// frontend/src/features/dashboard/components/ExchangeRateIndicator.tsx

import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/lib/api'
import type { ExchangeRateInfo } from '@/types/api'

interface ExchangeRateIndicatorProps {
  exchangeRate: ExchangeRateInfo | null
  onRefresh?: () => void
}

export function ExchangeRateIndicator({
  exchangeRate,
  onRefresh
}: ExchangeRateIndicatorProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  if (!exchangeRate) {
    return null  // No conversion needed, hide indicator
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await api.exchangeRates.getCurrent()
      onRefresh?.()
    } finally {
      setIsRefreshing(false)
    }
  }

  const lastUpdated = formatDistanceToNow(new Date(exchangeRate.fetchedAt), {
    addSuffix: true,
    locale: es
  })

  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      {exchangeRate.isStale && (
        <span
          className="flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700"
          title="Exchange rate may be outdated"
        >
          <AlertTriangle className="h-3 w-3" />
          Stale
        </span>
      )}

      <span>
        USD/ARS: ${exchangeRate.usdToArs.toFixed(2)}
      </span>

      <span className="text-gray-400">
        ({lastUpdated})
      </span>

      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="rounded p-1 hover:bg-gray-100 disabled:opacity-50"
        title="Refresh exchange rate"
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      </button>
    </div>
  )
}
```

### Updated PortfolioSummaryCard

```typescript
// frontend/src/features/dashboard/components/PortfolioSummaryCard.tsx

import { formatCurrency } from '@/lib/formatters'
import type { Currency, ExchangeRateInfo } from '@/types/api'
import { ExchangeRateIndicator } from './ExchangeRateIndicator'

interface PortfolioSummaryCardProps {
  totalValue: string
  displayCurrency: Currency
  exchangeRate: ExchangeRateInfo | null
  isLoading?: boolean
  onExchangeRateRefresh?: () => void
}

export function PortfolioSummaryCard({
  totalValue,
  displayCurrency,
  exchangeRate,
  isLoading = false,
  onExchangeRateRefresh,
}: PortfolioSummaryCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">Total Portfolio Value</p>
        <ExchangeRateIndicator
          exchangeRate={exchangeRate}
          onRefresh={onExchangeRateRefresh}
        />
      </div>

      {isLoading ? (
        <div data-testid="summary-skeleton" className="mt-2 animate-pulse">
          <div className="h-9 w-40 rounded bg-gray-200" />
        </div>
      ) : (
        <p className="mt-2 text-3xl font-bold text-gray-900">
          {formatCurrency(totalValue, displayCurrency)}
        </p>
      )}
    </div>
  )
}
```

### Updated PositionsList

```typescript
// frontend/src/features/dashboard/components/PositionsList.tsx - Update value display

// In the position row, update the value display:
<div className="text-right">
  <p className="font-medium text-gray-900">
    {formatCurrency(position.displayValue, position.displayCurrency)}
  </p>
  {position.originalCurrency !== position.displayCurrency && (
    <p className="text-xs text-gray-500">
      ({formatCurrency(position.value, position.originalCurrency)})
    </p>
  )}
  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${bg} ${text}`}>
    {label}
  </span>
</div>
```

### Updated Dashboard Page

```typescript
// frontend/src/features/dashboard/index.tsx - Key changes

export function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useDashboard()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <PortfolioSummaryCard
        totalValue={data?.totalValue ?? '0'}
        displayCurrency={data?.displayCurrency ?? 'USD'}
        exchangeRate={data?.exchangeRate ?? null}
        isLoading={isLoading}
        onExchangeRateRefresh={() => refetch()}
      />

      {/* ... rest unchanged ... */}
    </div>
  )
}
```

### Updated formatCurrency

```typescript
// frontend/src/lib/formatters.ts

export function formatCurrency(
  value: string | number,
  currency: 'USD' | 'ARS' = 'USD'
): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value

  // Use locale based on currency
  const locale = currency === 'ARS' ? 'es-AR' : 'en-US'

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue)
}
```

### File Structure

```
frontend/src/
├── features/dashboard/
│   ├── components/
│   │   ├── ExchangeRateIndicator.tsx       (CREATE)
│   │   ├── ExchangeRateIndicator.test.tsx  (CREATE)
│   │   ├── PortfolioSummaryCard.tsx        (MODIFY - add currency props)
│   │   ├── PortfolioSummaryCard.test.tsx   (MODIFY)
│   │   ├── PositionsList.tsx               (MODIFY - dual value display)
│   │   └── PositionsList.test.tsx          (MODIFY)
│   ├── hooks/
│   │   └── useDashboard.ts                 (MODIFY - handle new fields)
│   └── index.tsx                           (MODIFY - pass new props)
├── lib/
│   ├── formatters.ts                       (MODIFY - ARS support)
│   └── formatters.test.ts                  (MODIFY)
└── types/
    └── api.ts                              (MODIFY - add exchange rate types)
```

### Testing Strategy

```typescript
// ExchangeRateIndicator.test.tsx
describe('ExchangeRateIndicator', () => {
  it('should render nothing when exchangeRate is null')
  it('should display current rate')
  it('should display last updated time in relative format')
  it('should show warning badge when isStale is true')
  it('should call onRefresh when refresh button clicked')
  it('should show loading spinner while refreshing')
})

// PortfolioSummaryCard.test.tsx - Add
describe('PortfolioSummaryCard with multi-currency', () => {
  it('should format value in USD by default')
  it('should format value in ARS when displayCurrency is ARS')
  it('should display exchange rate indicator when exchangeRate is provided')
  it('should hide exchange rate indicator when exchangeRate is null')
})

// PositionsList.test.tsx - Add
describe('PositionsList with multi-currency', () => {
  it('should show only display value when currencies match')
  it('should show both values when currencies differ')
  it('should format original value in original currency')
  it('should format display value in display currency')
})

// formatters.test.ts - Add
describe('formatCurrency', () => {
  it('should format USD correctly: $1,234.56')
  it('should format ARS correctly: $ 1.234,56')
  it('should default to USD')
  it('should handle string input')
  it('should handle number input')
})
```

### Dependencies

**Story 7-2 must be completed first** - this story depends on:
- `ExchangeRateInfo` type from backend response
- `exchangeRate` field in `DashboardResponse`
- `displayValue` and `displayCurrency` in positions

### Icons

This story uses Lucide React icons. Already installed in the project:
- `RefreshCw` - refresh icon
- `AlertTriangle` - warning icon for stale rates

### UI Patterns to Follow

From existing dashboard components:
- Use Tailwind classes for styling
- Use `text-gray-500` for secondary text
- Use `rounded-lg border border-gray-200 bg-white` for cards
- Use `text-sm` for indicators/metadata
- Follow existing loading skeleton patterns

### API Client Update

If not already added in 7-2:
```typescript
// frontend/src/lib/api.ts

exchangeRates: {
  getCurrent: async (): Promise<ExchangeRate> => {
    const response = await fetch(`${API_URL}/exchange-rates/current`, {
      headers: getAuthHeaders(),
    })
    return handleResponse<ExchangeRate>(response)
  },
},
```

### Anti-Patterns to Avoid

```typescript
// NEVER hardcode currency symbols
const formatted = `$${value}` // WRONG

// NEVER assume all values are in USD
const total = positions.reduce((sum, p) => sum + p.value) // WRONG - currencies may differ

// ALWAYS use formatCurrency with explicit currency
formatCurrency(position.displayValue, position.displayCurrency) // CORRECT

// ALWAYS check if conversion is needed
if (position.originalCurrency !== position.displayCurrency) {
  // Show both values
}
```

### Previous Story Intelligence

**Story 7-2 provides:**
- `ExchangeRateInfo` interface
- Backend endpoint `GET /api/exchange-rates/current`
- `exchangeRate` in dashboard response
- `displayValue` and `displayCurrency` in positions

**Patterns from existing dashboard:**
- Component structure in `features/dashboard/components/`
- Hook pattern in `features/dashboard/hooks/`
- Test co-location pattern

### Project Context Reference

See `_bmad-output/project-context.md` for:
- Component naming: PascalCase.tsx
- Test files: co-located `*.test.tsx`
- Date formatting: use `date-fns` with `es` locale
- TanStack Query patterns

### References

- [Source: _bmad-output/implementation-artifacts/7-2-exchange-rate-api-integration.md - Backend changes]
- [Source: frontend/src/features/dashboard/index.tsx - Dashboard structure]
- [Source: frontend/src/features/dashboard/components/PortfolioSummaryCard.tsx - Card pattern]
- [Source: frontend/src/features/dashboard/components/PositionsList.tsx - List pattern]
- [Source: frontend/src/lib/formatters.ts - Formatter pattern]
- [Source: frontend/src/types/api.ts - Type definitions]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

- Task 1: Added `fetchedAt` to `ExchangeRateInfo` interface in both backend and frontend. Backend was missing this field which is required for ExchangeRateIndicator to show relative time ("2 min ago"). Types from story 7-2 already included `displayCurrency`, `exchangeRate`, `originalValue`, `originalCurrency` in dashboard response.
- Task 2: Created ExchangeRateIndicator component with inline SVG icons (RefreshIcon, AlertTriangleIcon), relative time display using date-fns with Spanish locale, stale warning badge, and refresh button with loading state. 8 tests written covering all scenarios.

### File List

- `backend/src/services/portfolioService.ts` (MODIFIED)
- `backend/src/services/portfolioService.test.ts` (MODIFIED)
- `frontend/src/types/api.ts` (MODIFIED)
- `frontend/src/features/dashboard/components/ExchangeRateIndicator.tsx` (CREATE)
- `frontend/src/features/dashboard/components/ExchangeRateIndicator.test.tsx` (CREATE)
