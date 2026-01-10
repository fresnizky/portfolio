# Story 5.3: Alerts Panel & Attention Required View

Status: done

## Story

As a **user**,
I want **to see all alerts and assets requiring attention in one place**,
So that **I know exactly what actions I need to take**.

## Acceptance Criteria

1. **Given** I am on the dashboard, **When** there are active alerts, **Then** I see an alerts panel prominently displayed

2. **Given** an asset needs rebalancing (deviation > threshold), **When** I view the alerts panel, **Then** I see "VOO is 7% overweight - consider rebalancing" with the specific deviation

3. **Given** prices are stale (>7 days old), **When** I view the alerts panel, **Then** I see "Update prices - last updated X days ago"

4. **Given** I click on an alert, **When** the alert is actionable, **Then** I am navigated to the relevant page (prices page for stale prices, portfolio for rebalance)

5. **Given** no alerts are active, **When** I view the dashboard, **Then** I see a positive message "Portfolio is on track!" or similar

6. **Given** I want a quick overview, **When** I view the "Attention Required" section, **Then** I see a consolidated list of all assets that need action with the reason

## Tasks / Subtasks

- [x] Task 1: Create AlertsPanel component (AC: #1, #2, #3, #4)
  - [x] Create `frontend/src/features/dashboard/components/AlertsPanel.tsx`
  - [x] Display list of alerts from `DashboardResponse.alerts`
  - [x] Render different alert types (stale_price, rebalance_needed) with appropriate icons
  - [x] Apply color coding based on severity (warning = yellow/orange)
  - [x] Make alerts clickable with navigation to relevant page
  - [x] Create `frontend/src/features/dashboard/components/AlertsPanel.test.tsx`

- [x] Task 2: Create AlertItem component (AC: #2, #3, #4)
  - [x] Create `frontend/src/features/dashboard/components/AlertItem.tsx`
  - [x] Display alert message with icon based on type
  - [x] Show specific deviation for rebalance alerts
  - [x] Show days old for stale price alerts
  - [x] Implement click handler with navigation
  - [x] Create `frontend/src/features/dashboard/components/AlertItem.test.tsx`

- [x] Task 3: Create EmptyAlertsState component (AC: #5)
  - [x] Create `frontend/src/features/dashboard/components/EmptyAlertsState.tsx`
  - [x] Display positive message "Portfolio is on track!" with checkmark icon
  - [x] Use green color scheme for positive feedback
  - [x] Create `frontend/src/features/dashboard/components/EmptyAlertsState.test.tsx`

- [x] Task 4: Create AttentionRequiredSection component (AC: #6)
  - [x] Create `frontend/src/features/dashboard/components/AttentionRequiredSection.tsx`
  - [x] Consolidate all alerts grouped by asset
  - [x] Show summary count of total alerts
  - [x] Display each asset that needs action with all its reasons
  - [x] Create `frontend/src/features/dashboard/components/AttentionRequiredSection.test.tsx`

- [x] Task 5: Update DashboardPage to include alerts (AC: #1-6)
  - [x] Modify `frontend/src/features/dashboard/index.tsx`
  - [x] Add AlertsPanel above or alongside existing components
  - [x] Add AttentionRequiredSection
  - [x] Show EmptyAlertsState when no alerts exist
  - [x] Ensure prominent placement for alerts panel
  - [x] Update `frontend/src/features/dashboard/index.test.tsx`

- [x] Task 6: Ensure all tests pass
  - [x] Run `pnpm test` to verify all tests pass
  - [x] Fix any failing tests

## Dev Notes

### API Already Implemented (Story 5-1)

The Dashboard API already returns all alerts data needed for this UI:

```typescript
// GET /api/dashboard returns:
interface DashboardResponse {
  totalValue: string
  positions: DashboardPosition[]
  alerts: DashboardAlert[]  // THIS IS WHAT WE USE
}

// Alert types already defined in frontend/src/types/api.ts
export type AlertType = 'stale_price' | 'rebalance_needed'
export type AlertSeverity = 'warning' | 'info'

export interface DashboardAlert {
  type: AlertType
  assetId: string
  ticker: string
  message: string
  severity: AlertSeverity
  data?: {
    daysOld?: number        // For stale_price alerts
    deviation?: string      // For rebalance_needed alerts
    direction?: 'overweight' | 'underweight'  // For rebalance_needed alerts
  }
}
```

### Frontend Integration Points (All Already Exist)

**Custom Hook (already exists):**
```typescript
// frontend/src/features/dashboard/hooks/useDashboard.ts
const { data, isLoading, isError } = useDashboard()
// data.alerts contains the alerts array
```

**Types (already exist in frontend/src/types/api.ts):**
```typescript
DashboardAlert, AlertType, AlertSeverity, DashboardResponse
```

### Navigation Patterns

**Use React Router's useNavigate:**
```typescript
import { useNavigate } from 'react-router-dom'

const navigate = useNavigate()

// For stale price alerts - navigate to prices/portfolio page
const handleStalePriceClick = () => {
  navigate('/portfolio')  // Or specific prices page if exists
}

// For rebalance alerts - navigate to portfolio page
const handleRebalanceClick = () => {
  navigate('/portfolio')
}
```

### Component Implementation Patterns

**AlertsPanel Component:**
```typescript
// frontend/src/features/dashboard/components/AlertsPanel.tsx
import { AlertItem } from './AlertItem'
import { EmptyAlertsState } from './EmptyAlertsState'
import type { DashboardAlert } from '@/types/api'

interface AlertsPanelProps {
  alerts: DashboardAlert[]
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  if (alerts.length === 0) {
    return <EmptyAlertsState />
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Alerts</h2>
      <div className="space-y-3">
        {alerts.map((alert, index) => (
          <AlertItem key={`${alert.type}-${alert.assetId}-${index}`} alert={alert} />
        ))}
      </div>
    </div>
  )
}
```

**AlertItem Component:**
```typescript
// frontend/src/features/dashboard/components/AlertItem.tsx
import { useNavigate } from 'react-router-dom'
import type { DashboardAlert } from '@/types/api'

interface AlertItemProps {
  alert: DashboardAlert
}

export function AlertItem({ alert }: AlertItemProps) {
  const navigate = useNavigate()

  // Determine navigation based on alert type
  const handleClick = () => {
    switch (alert.type) {
      case 'stale_price':
        navigate('/portfolio')
        break
      case 'rebalance_needed':
        navigate('/portfolio')
        break
    }
  }

  // Icon based on alert type
  const getIcon = () => {
    switch (alert.type) {
      case 'stale_price':
        return '⏰' // Or use Lucide icons: Clock
      case 'rebalance_needed':
        return '⚖️' // Or use Lucide icons: Scale
      default:
        return '⚠️'
    }
  }

  // Background color based on severity
  const getBgColor = () => {
    switch (alert.severity) {
      case 'warning':
        return 'bg-amber-50 border-amber-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-opacity-80 ${getBgColor()}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg">{getIcon()}</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{alert.ticker}</p>
          <p className="text-sm text-gray-600">{alert.message}</p>
          {alert.type === 'stale_price' && alert.data?.daysOld && (
            <p className="mt-1 text-xs text-amber-700">
              Last updated {alert.data.daysOld} days ago
            </p>
          )}
          {alert.type === 'rebalance_needed' && alert.data?.deviation && (
            <p className="mt-1 text-xs text-amber-700">
              {alert.data.direction === 'overweight' ? '+' : ''}{alert.data.deviation}% deviation
            </p>
          )}
        </div>
        <span className="text-gray-400">→</span>
      </div>
    </button>
  )
}
```

**EmptyAlertsState Component:**
```typescript
// frontend/src/features/dashboard/components/EmptyAlertsState.tsx
export function EmptyAlertsState() {
  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
      <div className="mb-2 text-3xl">✓</div>
      <h3 className="text-lg font-semibold text-green-800">Portfolio is on track!</h3>
      <p className="mt-1 text-sm text-green-600">
        No alerts or actions needed at this time.
      </p>
    </div>
  )
}
```

**AttentionRequiredSection Component (Consolidated View):**
```typescript
// frontend/src/features/dashboard/components/AttentionRequiredSection.tsx
import type { DashboardAlert } from '@/types/api'
import { AlertItem } from './AlertItem'

interface AttentionRequiredSectionProps {
  alerts: DashboardAlert[]
}

export function AttentionRequiredSection({ alerts }: AttentionRequiredSectionProps) {
  if (alerts.length === 0) return null

  // Group alerts by assetId
  const groupedAlerts = alerts.reduce((acc, alert) => {
    if (!acc[alert.assetId]) {
      acc[alert.assetId] = { ticker: alert.ticker, alerts: [] }
    }
    acc[alert.assetId].alerts.push(alert)
    return acc
  }, {} as Record<string, { ticker: string; alerts: DashboardAlert[] }>)

  const assetCount = Object.keys(groupedAlerts).length

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Attention Required</h2>
        <span className="rounded-full bg-amber-200 px-3 py-1 text-sm font-medium text-amber-800">
          {alerts.length} alert{alerts.length !== 1 ? 's' : ''} for {assetCount} asset{assetCount !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="space-y-4">
        {Object.entries(groupedAlerts).map(([assetId, { ticker, alerts }]) => (
          <div key={assetId} className="rounded-lg bg-white p-4">
            <h3 className="mb-2 font-medium text-gray-900">{ticker}</h3>
            <ul className="space-y-2">
              {alerts.map((alert, index) => (
                <li key={index} className="text-sm text-gray-600">
                  • {alert.message}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Updated DashboardPage Layout

```tsx
// frontend/src/features/dashboard/index.tsx
import { useDashboard } from './hooks/useDashboard'
import { PortfolioSummaryCard } from './components/PortfolioSummaryCard'
import { AllocationChart } from './components/AllocationChart'
import { PositionsList } from './components/PositionsList'
import { AlertsPanel } from './components/AlertsPanel'
import { AttentionRequiredSection } from './components/AttentionRequiredSection'

export function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useDashboard()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <PortfolioSummaryCard
        totalValue={data?.totalValue ?? '0'}
        isLoading={isLoading}
      />

      {/* Alerts Panel - Prominent placement */}
      {!isLoading && !isError && (
        <AlertsPanel alerts={data?.alerts ?? []} />
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">
            Error loading dashboard: {error?.message ?? 'Unknown error'}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-2 text-sm font-medium text-red-700 underline hover:text-red-800"
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Asset Allocation
              </h2>
              <AllocationChart positions={data?.positions ?? []} />
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Portfolio Positions
              </h2>
              <PositionsList positions={data?.positions ?? []} />
            </div>
          </div>

          {/* Attention Required Section - Consolidated view */}
          <AttentionRequiredSection alerts={data?.alerts ?? []} />
        </>
      )}
    </div>
  )
}
```

### File Structure

```
frontend/src/features/dashboard/
├── index.tsx                                    (MODIFY)
├── index.test.tsx                               (MODIFY)
├── hooks/
│   ├── useDashboard.ts                          (EXISTS)
│   └── useDashboard.test.tsx                    (EXISTS)
└── components/
    ├── PortfolioSummaryCard.tsx                 (EXISTS)
    ├── PortfolioSummaryCard.test.tsx            (EXISTS)
    ├── AllocationChart.tsx                      (EXISTS)
    ├── AllocationChart.test.tsx                 (EXISTS)
    ├── PositionsList.tsx                        (EXISTS)
    ├── PositionsList.test.tsx                   (EXISTS)
    ├── AlertsPanel.tsx                          (NEW)
    ├── AlertsPanel.test.tsx                     (NEW)
    ├── AlertItem.tsx                            (NEW)
    ├── AlertItem.test.tsx                       (NEW)
    ├── EmptyAlertsState.tsx                     (NEW)
    ├── EmptyAlertsState.test.tsx                (NEW)
    ├── AttentionRequiredSection.tsx             (NEW)
    └── AttentionRequiredSection.test.tsx        (NEW)
```

### Styling Patterns (Follow Existing from Story 5-2)

**Card Container:**
```tsx
<div className="rounded-lg border border-gray-200 bg-white p-6">
```

**Warning Alert Container:**
```tsx
<div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
```

**Success/Positive Container:**
```tsx
<div className="rounded-lg border border-green-200 bg-green-50 p-6">
```

**Badge/Pill:**
```tsx
<span className="rounded-full bg-amber-200 px-3 py-1 text-sm font-medium text-amber-800">
```

### Anti-Patterns to Avoid

```typescript
// NEVER fetch alerts separately - they come with dashboard data
const { data: alerts } = useQuery(['alerts'], fetchAlerts)  // WRONG
const { data } = useDashboard()  // CORRECT - alerts are in data.alerts

// NEVER hardcode navigation paths
onClick={() => window.location.href = '/portfolio'}  // WRONG
onClick={() => navigate('/portfolio')}  // CORRECT

// NEVER skip empty state
if (!alerts.length) return null  // WRONG - should show positive message
if (!alerts.length) return <EmptyAlertsState />  // CORRECT

// NEVER recalculate alert data - use what API provides
const daysOld = calculateDays(alert.priceUpdatedAt)  // WRONG
alert.data?.daysOld  // CORRECT - API already calculates
```

### Testing Requirements

```typescript
// frontend/src/features/dashboard/components/AlertsPanel.test.tsx
describe('AlertsPanel', () => {
  it('should display list of alerts when alerts exist')
  it('should show EmptyAlertsState when no alerts')
  it('should render correct number of AlertItems')
})

// frontend/src/features/dashboard/components/AlertItem.test.tsx
describe('AlertItem', () => {
  it('should display alert message and ticker')
  it('should show clock icon for stale_price alerts')
  it('should show scale icon for rebalance_needed alerts')
  it('should navigate to /portfolio on click')
  it('should display days old for stale price alerts')
  it('should display deviation for rebalance alerts')
})

// frontend/src/features/dashboard/components/EmptyAlertsState.test.tsx
describe('EmptyAlertsState', () => {
  it('should display positive message')
  it('should show checkmark icon')
  it('should have green color scheme')
})

// frontend/src/features/dashboard/components/AttentionRequiredSection.test.tsx
describe('AttentionRequiredSection', () => {
  it('should return null when no alerts')
  it('should group alerts by asset')
  it('should display alert count summary')
  it('should show all alerts for each asset')
})
```

### Previous Story Context (5-2)

**Learnings from Story 5-2:**
- API response uses strings for all decimal/numeric values (Prisma Decimal serialization)
- `alerts` array is pre-populated by backend with all necessary data
- Use existing card styling patterns (rounded-lg border bg-white p-6)
- Follow test patterns: describe block with it() for each behavior
- Recharts already installed, no new dependencies needed for this story

**Files Created in 5-2 (Reference for patterns):**
- `frontend/src/features/dashboard/hooks/useDashboard.ts` - Query hook pattern
- `frontend/src/features/dashboard/components/PortfolioSummaryCard.tsx` - Card component pattern
- `frontend/src/features/dashboard/components/PositionsList.tsx` - List component pattern
- `frontend/src/features/dashboard/index.tsx` - Page layout pattern
- `frontend/src/lib/formatters.ts` - formatCurrency utility

### Git Intelligence from Story 5-2

Recent commits show these patterns:
- Commit messages follow: `feat(story-key): description`
- Tests created alongside components
- Sprint status updated after story completion
- All new files use TypeScript with proper type imports

### Dependencies

- **No new dependencies required** - all needed packages already installed
- Uses React Router (already in project) for navigation
- Uses existing types from `@/types/api`

### Project Context Reference

See `_bmad-output/project-context.md` for:
- TypeScript strict mode rules (no `any`)
- Path aliases (`@/components`, `@/lib`, `@/types`)
- Naming conventions (PascalCase for components, camelCase for functions)
- API response format (`{ data: T }`)
- Tailwind CSS styling patterns

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-5.3]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend-Architecture]
- [Source: _bmad-output/implementation-artifacts/5-2-dashboard-ui-distribution-visualization.md]
- [Source: frontend/src/features/dashboard/index.tsx - Current dashboard layout]
- [Source: frontend/src/types/api.ts - DashboardAlert types]
- [Source: backend/src/services/dashboardService.ts - Alert generation logic]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

- Task 1: Created AlertsPanel component with tests. Uses AlertItem and EmptyAlertsState (stubs created, full implementation in Task 2 and 3). AlertsPanel displays list of alerts or empty state when no alerts. 4 tests passing.
- Task 2: Implemented full AlertItem component with SVG icons (Clock for stale_price, Scale for rebalance_needed), color coding by severity, clickable navigation to /portfolio, and additional info display (days old, deviation). 9 tests passing.
- Task 3: Implemented EmptyAlertsState component with checkmark SVG icon, green color scheme, positive message and encouraging subtext. 4 tests passing.
- Task 4: Implemented AttentionRequiredSection component that groups alerts by asset, shows alert count summary badge, and displays all alerts per asset. 6 tests passing.
- Task 5: Updated DashboardPage to include AlertsPanel (prominent placement after summary) and AttentionRequiredSection (consolidated view at bottom). Added 3 new tests for alerts display. 8 tests passing for DashboardPage.
- Task 6: Verified all 337 tests pass across 42 test files. No failures.

### File List

- frontend/src/features/dashboard/components/AlertsPanel.tsx (NEW)
- frontend/src/features/dashboard/components/AlertsPanel.test.tsx (NEW)
- frontend/src/features/dashboard/components/AlertItem.tsx (NEW)
- frontend/src/features/dashboard/components/AlertItem.test.tsx (NEW)
- frontend/src/features/dashboard/components/EmptyAlertsState.tsx (NEW)
- frontend/src/features/dashboard/components/EmptyAlertsState.test.tsx (NEW)
- frontend/src/features/dashboard/components/AttentionRequiredSection.tsx (NEW)
- frontend/src/features/dashboard/components/AttentionRequiredSection.test.tsx (NEW)
- frontend/src/features/dashboard/index.tsx (MODIFIED)
- frontend/src/features/dashboard/index.test.tsx (MODIFIED)

