# Story 3.3: Holdings & Prices UI with Staleness Indicator

Status: ready-for-dev

## Story

As a **user**,
I want **a visual interface to update holdings and prices with indicators of data freshness**,
so that **I can quickly update my portfolio each week**.

## Acceptance Criteria

1. **Given** I am on the holdings/prices page, **When** the page loads, **Then** I see all assets with their quantities, current prices, and calculated values

2. **Given** an asset has priceUpdatedAt older than 7 days, **When** I view the asset, **Then** I see a yellow warning indicator showing "Price outdated: X days old"

3. **Given** an asset has priceUpdatedAt within 7 days, **When** I view the asset, **Then** I see a green checkmark or no warning

4. **Given** I click on a price field, **When** I enter a new value and save, **Then** the price is updated and the value recalculates immediately

5. **Given** I am viewing my portfolio, **When** prices are updated, **Then** the total portfolio value updates in real-time

6. **Given** any price is older than 7 days, **When** I view the page header, **Then** I see an alert banner: "Some prices need updating"

## Tasks / Subtasks

- [x] Task 1: Extend API Types & Client (AC: #1, #4, #5)
  - [x] Add `PortfolioSummary`, `Position`, `UpdatePriceInput`, `BatchUpdatePricesInput` types to `frontend/src/types/api.ts`
  - [x] Add `prices` and `portfolio` namespaces to `frontend/src/lib/api.ts`
  - [x] Add `portfolio` and `prices` query keys to `frontend/src/lib/queryKeys.ts`

- [ ] Task 2: Create Portfolio Hooks (AC: #1, #4, #5)
  - [ ] Create `frontend/src/features/holdings/hooks/usePortfolio.ts`
  - [ ] Implement `usePortfolioSummary()` hook with TanStack Query
  - [ ] Implement `useUpdatePrice()` mutation hook
  - [ ] Implement `useBatchUpdatePrices()` mutation hook
  - [ ] Add unit tests in `frontend/src/features/holdings/hooks/usePortfolio.test.ts`

- [ ] Task 3: Create Staleness Helper Utilities (AC: #2, #3, #6)
  - [ ] Create `frontend/src/features/holdings/utils/staleness.ts`
  - [ ] Implement `isPriceStale(priceUpdatedAt: string | null, thresholdDays?: number): boolean`
  - [ ] Implement `getDaysSinceUpdate(priceUpdatedAt: string | null): number | null`
  - [ ] Implement `hasAnyStalePrice(positions: Position[]): boolean`
  - [ ] Add unit tests in `frontend/src/features/holdings/utils/staleness.test.ts`

- [ ] Task 4: Create UI Components (AC: #1, #2, #3, #4, #5, #6)
  - [ ] Create `StalenessIndicator.tsx` - shows green checkmark or yellow warning
  - [ ] Create `StaleAlertBanner.tsx` - page-level alert when any price is stale
  - [ ] Create `PositionCard.tsx` - displays single position with value and staleness
  - [ ] Create `PositionList.tsx` - grid of all positions
  - [ ] Create `PriceUpdateModal.tsx` - form to update single price
  - [ ] Create `BatchPriceUpdateModal.tsx` - form to update multiple prices
  - [ ] Create `PortfolioSummaryCard.tsx` - shows total portfolio value
  - [ ] Add tests for each component

- [ ] Task 5: Create Holdings Page (AC: #1, #2, #3, #4, #5, #6)
  - [ ] Create `frontend/src/features/holdings/index.tsx` - main holdings page
  - [ ] Integrate all components
  - [ ] Add route to `frontend/src/router.tsx`
  - [ ] Add navigation link in Layout
  - [ ] Add page-level tests

- [ ] Task 6: Integration Testing
  - [ ] Verify API integration with mock server
  - [ ] Test staleness indicator with various dates
  - [ ] Test price update flow end-to-end
  - [ ] Test batch price update
  - [ ] Test total value recalculation

## Dev Notes

### API Endpoints (Already Implemented in Backend)

**GET /api/portfolio/summary** - Returns portfolio valuation:
```typescript
interface PortfolioSummary {
  totalValue: string  // Decimal as string (e.g., "10350.50")
  positions: Position[]
}

interface Position {
  assetId: string
  ticker: string
  name: string
  category: AssetCategory
  quantity: string      // Decimal as string
  currentPrice: string | null  // null if never set
  value: string         // Decimal as string (quantity × price)
  targetPercentage: string | null
  priceUpdatedAt: string | null  // ISO 8601 timestamp or null
}
```

**PUT /api/prices/:assetId** - Update single price:
```typescript
// Request
{ price: number }  // e.g., 450.75

// Response
{ data: Asset, message: "Price updated" }
```

**PUT /api/prices/batch** - Batch update prices:
```typescript
// Request
{ prices: Array<{ assetId: string, price: number }> }

// Response
{ data: { updated: number, assets: Asset[] }, message: "X prices updated" }
```

### Staleness Logic (CRITICAL)

```typescript
const STALE_THRESHOLD_DAYS = 7

function isPriceStale(priceUpdatedAt: string | null): boolean {
  if (!priceUpdatedAt) return true  // Never updated = stale

  const updated = new Date(priceUpdatedAt)
  const now = new Date()
  const diffMs = now.getTime() - updated.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  return diffDays > STALE_THRESHOLD_DAYS
}

function getDaysSinceUpdate(priceUpdatedAt: string | null): number | null {
  if (!priceUpdatedAt) return null

  const updated = new Date(priceUpdatedAt)
  const now = new Date()
  const diffMs = now.getTime() - updated.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}
```

### Component Patterns

**StalenessIndicator.tsx:**
```typescript
interface StalenessIndicatorProps {
  priceUpdatedAt: string | null
  showDays?: boolean  // Show "X days old" text
}

// Visual states:
// - null priceUpdatedAt → Yellow warning "No price set"
// - > 7 days → Yellow warning "X days old"
// - ≤ 7 days → Green checkmark (or nothing if minimal UI)
```

**StaleAlertBanner.tsx:**
```typescript
interface StaleAlertBannerProps {
  positions: Position[]
  onUpdatePrices?: () => void  // Optional CTA button
}

// Render:
// - Yellow banner with warning icon
// - "Some prices need updating" text
// - Optional "Update Now" button
```

**PositionCard.tsx:**
```typescript
interface PositionCardProps {
  position: Position
  onUpdatePrice: (position: Position) => void
}

// Layout:
// - Category badge (ETF/FCI/CRYPTO/CASH) - reuse styles from AssetCard
// - Ticker and name
// - Quantity and current price
// - Calculated value (prominent)
// - Staleness indicator
// - Edit price button
```

### Price Formatting

```typescript
// Currency formatting - use for values and prices
const formatCurrency = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

// Quantity formatting - handle crypto decimals
const formatQuantity = (quantity: string): string => {
  const num = parseFloat(quantity)
  // If whole number, show no decimals
  // If has decimals, show up to 8 for crypto
  if (Number.isInteger(num)) return num.toString()
  return num.toFixed(Math.min(8, (quantity.split('.')[1] || '').length))
}
```

### Project Structure (Files to Create)

```
frontend/src/features/holdings/
├── index.tsx                          # Holdings page (main)
├── index.test.tsx
├── components/
│   ├── StalenessIndicator.tsx
│   ├── StalenessIndicator.test.tsx
│   ├── StaleAlertBanner.tsx
│   ├── StaleAlertBanner.test.tsx
│   ├── PositionCard.tsx
│   ├── PositionCard.test.tsx
│   ├── PositionList.tsx
│   ├── PositionList.test.tsx
│   ├── PriceUpdateModal.tsx
│   ├── PriceUpdateModal.test.tsx
│   ├── BatchPriceUpdateModal.tsx
│   ├── BatchPriceUpdateModal.test.tsx
│   ├── PortfolioSummaryCard.tsx
│   └── PortfolioSummaryCard.test.tsx
├── hooks/
│   ├── usePortfolio.ts
│   └── usePortfolio.test.ts
└── utils/
    ├── staleness.ts
    ├── staleness.test.ts
    ├── formatters.ts                   # Optional: currency/quantity formatters
    └── formatters.test.ts
```

### Files to Modify

```
frontend/src/
├── types/api.ts           # Add PortfolioSummary, Position types
├── lib/api.ts             # Add prices, portfolio API methods
├── lib/queryKeys.ts       # Add portfolio, prices keys
├── router.tsx             # Add /holdings route
└── components/layout/Layout.tsx  # Add Holdings nav link
```

### Tailwind Styles (Reuse from Portfolio)

```typescript
// Category badge styles (from AssetCard.tsx)
const categoryStyles: Record<AssetCategory, string> = {
  ETF: 'bg-blue-100 text-blue-800',
  FCI: 'bg-green-100 text-green-800',
  CRYPTO: 'bg-orange-100 text-orange-800',
  CASH: 'bg-gray-100 text-gray-800',
}

// Staleness indicator styles
const stalenessStyles = {
  fresh: 'text-green-600',      // Green checkmark
  stale: 'text-yellow-600',     // Yellow warning
  banner: 'bg-yellow-50 border-yellow-200 text-yellow-800',
}

// Card styles (consistent with AssetCard)
const cardStyles = 'rounded-lg border border-gray-200 bg-white p-4 shadow-sm'
```

### API Types to Add (frontend/src/types/api.ts)

```typescript
// Portfolio Types
export interface Position {
  assetId: string
  ticker: string
  name: string
  category: AssetCategory
  quantity: string
  currentPrice: string | null
  value: string
  targetPercentage: string | null
  priceUpdatedAt: string | null
}

export interface PortfolioSummary {
  totalValue: string
  positions: Position[]
}

// Price Update Types
export interface UpdatePriceInput {
  price: number
}

export interface BatchUpdatePricesInput {
  prices: Array<{
    assetId: string
    price: number
  }>
}

export interface BatchUpdatePricesResponse {
  updated: number
  assets: Array<{
    id: string
    ticker: string
    currentPrice: string
    priceUpdatedAt: string
  }>
}
```

### Query Keys Pattern (frontend/src/lib/queryKeys.ts)

```typescript
export const queryKeys = {
  // ... existing keys
  portfolio: {
    all: ['portfolio'] as const,
    summary: () => [...queryKeys.portfolio.all, 'summary'] as const,
  },
  prices: {
    all: ['prices'] as const,
  },
}
```

### Hook Patterns (from useAssets.ts)

```typescript
// frontend/src/features/holdings/hooks/usePortfolio.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'

export function usePortfolioSummary() {
  return useQuery({
    queryKey: queryKeys.portfolio.summary(),
    queryFn: () => api.portfolio.summary(),
  })
}

export function useUpdatePrice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ assetId, price }: { assetId: string; price: number }) =>
      api.prices.update(assetId, { price }),
    onSuccess: () => {
      // Invalidate portfolio summary to get recalculated values
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.all })
    },
  })
}

export function useBatchUpdatePrices() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: BatchUpdatePricesInput) =>
      api.prices.batchUpdate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.all })
    },
  })
}
```

### Testing Patterns

```typescript
// Mock setup for tests
vi.mock('@/lib/api', () => ({
  api: {
    portfolio: {
      summary: vi.fn(),
    },
    prices: {
      update: vi.fn(),
      batchUpdate: vi.fn(),
    },
  },
}))

// Test dates helper
const createTestDate = (daysAgo: number): string => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString()
}

// Sample test position
const mockPosition: Position = {
  assetId: 'clx1...',
  ticker: 'VOO',
  name: 'Vanguard S&P 500 ETF',
  category: 'ETF',
  quantity: '10.5',
  currentPrice: '450.75',
  value: '4732.88',
  targetPercentage: '60.00',
  priceUpdatedAt: createTestDate(3),  // 3 days ago = fresh
}
```

### Previous Story Learnings (3.2)

1. **BigInt for prices**: Backend stores `currentPriceCents` as BigInt, API converts to/from decimal
2. **Price rounding**: All prices rounded to 2 decimals in API
3. **Null handling**: Positions with null `currentPrice` have `value: "0"`
4. **Timestamp precision**: `priceUpdatedAt` is ISO 8601 string from backend
5. **Batch atomicity**: Batch price updates are atomic (all succeed or all fail)
6. **User isolation**: All price updates verified against `userId` from JWT

### Critical Implementation Rules

1. **NEVER calculate values in frontend** - Use `value` field from API response
2. **ALWAYS parse decimal strings with parseFloat()** - Prisma returns Decimals as strings
3. **REUSE category styles from AssetCard** - Don't duplicate color mapping
4. **Invalidate portfolio.all on price updates** - Ensures value recalculation
5. **Handle null priceUpdatedAt** - Treat as stale (show warning)
6. **Use existing Modal component** - `@/components/common/Modal`
7. **Follow existing form patterns** - See `AssetForm.tsx` for validation pattern

### Anti-Patterns to Avoid

```typescript
// ❌ WRONG - Don't calculate value in frontend
const value = parseFloat(quantity) * parseFloat(currentPrice)

// ✅ CORRECT - Use value from API
const value = position.value

// ❌ WRONG - Don't use Date.now() for comparison
if (Date.now() - new Date(priceUpdatedAt) > 7 * 24 * 60 * 60 * 1000)

// ✅ CORRECT - Clear day-based comparison
const diffDays = Math.floor((Date.now() - new Date(priceUpdatedAt).getTime()) / (1000 * 60 * 60 * 24))
if (diffDays > 7)

// ❌ WRONG - Don't create new components for existing patterns
<CategoryBadge category={position.category} />  // Don't create new

// ✅ CORRECT - Reuse inline styles from AssetCard
<span className={`${categoryStyles[position.category]}`}>{position.category}</span>

// ❌ WRONG - Don't forget to handle null prices
{position.currentPrice && formatCurrency(position.currentPrice)}

// ✅ CORRECT - Handle null explicitly
{position.currentPrice ? formatCurrency(position.currentPrice) : 'No price set'}
```

### Router Integration

```typescript
// frontend/src/router.tsx - Add route
import { HoldingsPage } from '@/features/holdings'

// In routes array:
{
  path: '/holdings',
  element: <ProtectedRoute><HoldingsPage /></ProtectedRoute>,
}
```

### Layout Navigation

```typescript
// frontend/src/components/layout/Layout.tsx - Add nav link
const navLinks = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/portfolio', label: 'Portfolio' },
  { path: '/holdings', label: 'Holdings & Prices' },  // NEW
]
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.3]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend-Architecture]
- [Source: _bmad-output/planning-artifacts/prd.md#FR7-FR11-FR20-FR21]
- [Source: _bmad-output/implementation-artifacts/3-2-price-update-portfolio-valuation.md]
- [Source: _bmad-output/project-context.md]
- [Source: frontend/src/features/portfolio/components/AssetCard.tsx]
- [Source: frontend/src/features/portfolio/hooks/useAssets.ts]
- [Source: frontend/src/lib/api.ts]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

- Task 1: Added Portfolio and Price types to frontend. Extended API client with portfolio.summary(), prices.update(), and prices.batchUpdate() methods. Added query keys for cache invalidation.

### File List

- frontend/src/types/api.ts (modified)
- frontend/src/lib/api.ts (modified)
- frontend/src/lib/queryKeys.ts (modified)
