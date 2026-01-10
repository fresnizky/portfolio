# Story 5.1: Dashboard Summary API

Status: done

## Story

As a **user**,
I want **an API endpoint that returns all dashboard data in one call**,
So that **the dashboard loads quickly with complete information**.

## Acceptance Criteria

1. **Given** I am authenticated, **When** I GET `/api/dashboard`, **Then** I receive a complete dashboard payload with:
   - `totalValue`: sum of all position values
   - `positions`: array with each asset's ticker, name, quantity, price, value, targetPercentage, actualPercentage, deviation
   - `alerts`: array of active alerts (stale prices, rebalance needed)

2. **Given** I have assets with holdings and prices, **When** I GET `/api/dashboard`, **Then** `actualPercentage` for each asset is calculated as `(assetValue / totalValue) * 100`

3. **Given** I have assets with targets, **When** I GET `/api/dashboard`, **Then** `deviation` for each asset is calculated as `actualPercentage - targetPercentage`

4. **Given** an asset deviates more than the configured threshold (default 5%), **When** I GET `/api/dashboard`, **Then** that asset appears in the alerts array with type `rebalance_needed`

5. **Given** an asset has a price older than 7 days, **When** I GET `/api/dashboard`, **Then** that asset appears in the alerts array with type `stale_price`

## Tasks / Subtasks

- [x] Task 1: Create dashboard types and validation schema (AC: #1)
  - [x] Create `backend/src/validations/dashboard.ts` (minimal - no request body validation needed for GET)
  - [x] Define TypeScript interfaces for DashboardResponse, DashboardPosition, DashboardAlert

- [x] Task 2: Create dashboardService (AC: #1, #2, #3, #4, #5)
  - [x] Create `backend/src/services/dashboardService.ts`
  - [x] Implement `getDashboard(userId: string, thresholds?: { deviationPct: number, staleDays: number })`
  - [x] Fetch holdings via existing portfolioService.getSummary() for base data
  - [x] Calculate actualPercentage: `(positionValue / totalValue) * 100`
  - [x] Calculate deviation: `actualPercentage - targetPercentage`
  - [x] Generate alerts based on thresholds
  - [x] Unit test all calculations

- [x] Task 3: Create dashboard route (AC: #1-5)
  - [x] Create `backend/src/routes/dashboard.ts`
  - [x] `GET /api/dashboard` - returns DashboardResponse
  - [x] Apply authMiddleware
  - [x] Optional query params: `deviationThreshold`, `staleDays` (defaults: 5, 7)

- [x] Task 4: Register route in index.ts (AC: #1)
  - [x] Add `import dashboardRouter from './routes/dashboard'`
  - [x] Add `app.use('/api/dashboard', authMiddleware, dashboardRouter)`

- [x] Task 5: Add frontend types and API client (AC: #1)
  - [x] Add `DashboardResponse`, `DashboardPosition`, `DashboardAlert` types to `frontend/src/types/api.ts`
  - [x] Add `dashboard.get()` method to `frontend/src/lib/api.ts`
  - [x] Add `dashboard` query keys to `frontend/src/lib/queryKeys.ts`

## Dev Notes

### Backend Implementation

#### Dashboard Response Format

```typescript
// backend/src/services/dashboardService.ts

interface DashboardPosition {
  assetId: string
  ticker: string
  name: string
  category: AssetCategory
  quantity: string          // Decimal as string
  currentPrice: string      // From cents to "450.75"
  value: string             // "4507.50"
  targetPercentage: string  // "60.00"
  actualPercentage: string  // "58.32" - CALCULATED: (value / totalValue) * 100
  deviation: string         // "-1.68" - CALCULATED: actualPercentage - targetPercentage
  priceUpdatedAt: Date | null
}

interface DashboardAlert {
  type: 'stale_price' | 'rebalance_needed'
  assetId: string
  ticker: string
  message: string
  severity: 'warning' | 'info'
  data?: {
    daysOld?: number        // For stale_price
    deviation?: string      // For rebalance_needed (e.g., "+7.2" or "-5.5")
    direction?: 'overweight' | 'underweight'  // For rebalance_needed
  }
}

interface DashboardResponse {
  totalValue: string
  positions: DashboardPosition[]
  alerts: DashboardAlert[]
}
```

#### Service Implementation Pattern

**Leverage existing services - DO NOT reinvent:**

```typescript
// backend/src/services/dashboardService.ts
import { portfolioService } from './portfolioService'

export const dashboardService = {
  async getDashboard(
    userId: string,
    thresholds = { deviationPct: 5, staleDays: 7 }
  ): Promise<DashboardResponse> {
    // 1. Get base portfolio data (REUSE existing service!)
    const summary = await portfolioService.getSummary(userId)

    const totalValue = parseFloat(summary.totalValue)
    const alerts: DashboardAlert[] = []
    const now = new Date()

    // 2. Enrich positions with calculations
    const positions: DashboardPosition[] = summary.positions.map(pos => {
      const value = parseFloat(pos.value)
      const target = parseFloat(pos.targetPercentage)

      // Calculate actual percentage
      const actualPercentage = totalValue > 0
        ? (value / totalValue) * 100
        : 0

      // Calculate deviation
      const deviation = actualPercentage - target

      // Check for stale price alert
      if (pos.priceUpdatedAt) {
        const daysSinceUpdate = Math.floor(
          (now.getTime() - new Date(pos.priceUpdatedAt).getTime()) / (1000 * 60 * 60 * 24)
        )
        if (daysSinceUpdate >= thresholds.staleDays) {
          alerts.push({
            type: 'stale_price',
            assetId: pos.assetId,
            ticker: pos.ticker,
            message: `${pos.ticker} price is ${daysSinceUpdate} days old`,
            severity: 'warning',
            data: { daysOld: daysSinceUpdate }
          })
        }
      } else if (parseFloat(pos.currentPrice) > 0) {
        // Price exists but no timestamp - treat as stale
        alerts.push({
          type: 'stale_price',
          assetId: pos.assetId,
          ticker: pos.ticker,
          message: `${pos.ticker} price has no update date`,
          severity: 'warning'
        })
      }

      // Check for rebalance alert
      if (Math.abs(deviation) >= thresholds.deviationPct) {
        const direction = deviation > 0 ? 'overweight' : 'underweight'
        alerts.push({
          type: 'rebalance_needed',
          assetId: pos.assetId,
          ticker: pos.ticker,
          message: `${pos.ticker} is ${Math.abs(deviation).toFixed(1)}% ${direction}`,
          severity: 'warning',
          data: {
            deviation: deviation.toFixed(2),
            direction
          }
        })
      }

      return {
        ...pos,
        actualPercentage: actualPercentage.toFixed(2),
        deviation: deviation.toFixed(2)
      }
    })

    return {
      totalValue: summary.totalValue,
      positions,
      alerts
    }
  }
}
```

#### Route Implementation

```typescript
// backend/src/routes/dashboard.ts
import { Router } from 'express'
import { dashboardService } from '../services/dashboardService'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const userId = req.user!.id

    // Optional query params for custom thresholds
    const deviationPct = req.query.deviationThreshold
      ? parseFloat(req.query.deviationThreshold as string)
      : 5
    const staleDays = req.query.staleDays
      ? parseInt(req.query.staleDays as string)
      : 7

    const dashboard = await dashboardService.getDashboard(userId, {
      deviationPct,
      staleDays
    })

    res.json({ data: dashboard })
  } catch (error) {
    next(error)
  }
})

export default router
```

### Frontend Integration

#### Types to Add

```typescript
// frontend/src/types/api.ts - ADD:

export type AlertType = 'stale_price' | 'rebalance_needed'
export type AlertSeverity = 'warning' | 'info'

export interface DashboardAlert {
  type: AlertType
  assetId: string
  ticker: string
  message: string
  severity: AlertSeverity
  data?: {
    daysOld?: number
    deviation?: string
    direction?: 'overweight' | 'underweight'
  }
}

export interface DashboardPosition {
  assetId: string
  ticker: string
  name: string
  category: AssetCategory
  quantity: string
  currentPrice: string
  value: string
  targetPercentage: string
  actualPercentage: string
  deviation: string
  priceUpdatedAt: string | null
}

export interface DashboardResponse {
  totalValue: string
  positions: DashboardPosition[]
  alerts: DashboardAlert[]
}
```

#### API Client Method

```typescript
// frontend/src/lib/api.ts - ADD to api object:

dashboard: {
  get: async (params?: { deviationThreshold?: number; staleDays?: number }): Promise<DashboardResponse> => {
    const searchParams = new URLSearchParams()
    if (params?.deviationThreshold !== undefined) {
      searchParams.append('deviationThreshold', params.deviationThreshold.toString())
    }
    if (params?.staleDays !== undefined) {
      searchParams.append('staleDays', params.staleDays.toString())
    }

    const queryString = searchParams.toString()
    const url = queryString
      ? `${API_URL}/dashboard?${queryString}`
      : `${API_URL}/dashboard`

    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return handleResponse<DashboardResponse>(res)
  },
},
```

#### Query Keys

```typescript
// frontend/src/lib/queryKeys.ts - ADD:

dashboard: {
  all: ['dashboard'] as const,
  summary: (params?: { deviationThreshold?: number; staleDays?: number }) =>
    [...queryKeys.dashboard.all, 'summary', params] as const,
},
```

### Calculation Examples

**Scenario: Portfolio with 3 assets**

| Asset | Value | Target | Actual% | Deviation |
|-------|-------|--------|---------|-----------|
| VOO | $6,000 | 60% | 60% | 0% |
| GLD | $1,500 | 15% | 15% | 0% |
| BTC | $2,500 | 25% | 25% | 0% |
| **Total** | **$10,000** | 100% | 100% | - |

**Scenario with deviation:**

| Asset | Value | Target | Actual% | Deviation | Alert? |
|-------|-------|--------|---------|-----------|--------|
| VOO | $5,500 | 60% | 55% | -5% | Yes (underweight) |
| GLD | $1,500 | 15% | 15% | 0% | No |
| BTC | $3,000 | 25% | 30% | +5% | Yes (overweight) |
| **Total** | **$10,000** | 100% | 100% | - | - |

### Critical Implementation Details

1. **REUSE portfolioService.getSummary()** - Already calculates positions and total value. Do NOT duplicate database queries.

2. **Percentage calculations**: Use `toFixed(2)` for all percentage strings to maintain consistency.

3. **Deviation sign convention**: Positive = overweight (too much), Negative = underweight (too little).

4. **Alert messages**: Include ticker and specific deviation amount for actionable guidance.

5. **Price staleness**: Check `priceUpdatedAt` against current date. Handle null case (no price ever set).

6. **Default thresholds**: 5% deviation, 7 days stale. Allow override via query params for future settings feature.

### Testing Requirements

```typescript
// backend/src/services/dashboardService.test.ts

describe('dashboardService', () => {
  describe('getDashboard', () => {
    it('should calculate actualPercentage correctly')
    it('should calculate deviation correctly')
    it('should generate stale_price alert when price > 7 days old')
    it('should generate rebalance_needed alert when deviation >= 5%')
    it('should NOT generate alert when deviation < threshold')
    it('should handle empty portfolio (totalValue = 0)')
    it('should handle assets with null prices')
    it('should respect custom thresholds')
  })
})
```

### File Structure

```
backend/src/
├── routes/
│   └── dashboard.ts (NEW)
├── services/
│   ├── dashboardService.ts (NEW)
│   └── portfolioService.ts (REUSE - no changes)
├── index.ts (MODIFY - add route)

frontend/src/
├── types/
│   └── api.ts (MODIFY - add Dashboard types)
├── lib/
│   ├── api.ts (MODIFY - add dashboard namespace)
│   └── queryKeys.ts (MODIFY - add dashboard keys)
```

### Anti-Patterns to Avoid

```typescript
// NEVER duplicate portfolio fetch logic
const holdings = await prisma.holding.findMany(...)  // WRONG
const summary = await portfolioService.getSummary(userId)  // CORRECT

// NEVER hardcode thresholds without defaults
if (deviation > 5) // WRONG - not configurable
if (Math.abs(deviation) >= thresholds.deviationPct) // CORRECT

// NEVER forget to handle edge cases
const actualPct = value / totalValue * 100  // WRONG - division by zero
const actualPct = totalValue > 0 ? (value / totalValue) * 100 : 0  // CORRECT

// NEVER return numbers instead of strings
actualPercentage: actualPercentage  // WRONG - returns number
actualPercentage: actualPercentage.toFixed(2)  // CORRECT - returns string
```

### Previous Story Context (4-3)

- **API client pattern**: Use `handleResponse<T>` for type-safe responses
- **Query keys factory**: Always use `queryKeys.namespace.method()` pattern
- **Type consistency**: All numeric values from API come as strings (Decimal/BigInt)
- **Testing pattern**: Co-located tests with comprehensive coverage

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-5.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#API-Patterns]
- [Source: backend/src/services/portfolioService.ts]
- [Source: backend/src/lib/errors.ts]
- [Source: frontend/src/lib/api.ts]
- [Source: frontend/src/lib/queryKeys.ts]
- [Source: frontend/src/types/api.ts]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None

### Completion Notes List

- Implemented Dashboard Summary API endpoint `GET /api/dashboard`
- Created dashboardService that reuses portfolioService.getSummary() for base data
- Calculates actualPercentage and deviation for each position
- Generates `stale_price` alerts for prices older than configurable threshold (default 7 days)
- Generates `rebalance_needed` alerts for deviations > configurable threshold (default 5%)
- Note: AC#4 says "more than" so implemented with `>` operator (not `>=`)
- Added query params support: `deviationThreshold`, `staleDays`
- Comprehensive test coverage: 16 service tests, 11 route tests, 8 validation tests, 8 frontend API tests
- Frontend types, API client, and query keys added

### File List

**Backend (New files):**
- backend/src/validations/dashboard.ts
- backend/src/validations/dashboard.test.ts
- backend/src/services/dashboardService.ts
- backend/src/services/dashboardService.test.ts
- backend/src/routes/dashboard.ts
- backend/src/routes/dashboard.test.ts

**Backend (Modified):**
- backend/src/index.ts

**Frontend (Modified):**
- frontend/src/types/api.ts
- frontend/src/lib/api.ts
- frontend/src/lib/api.test.ts
- frontend/src/lib/queryKeys.ts
