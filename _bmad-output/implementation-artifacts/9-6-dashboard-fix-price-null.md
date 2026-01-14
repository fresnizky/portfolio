# Story 9.6: Dashboard Fix - Handle Price Null

Status: done

## Story

As a **user viewing the dashboard**,
I want **assets without configured prices to be clearly indicated instead of showing misleading $0.00 values and incorrect deviations**,
so that **I can distinguish between "no price set" and "actual zero value", and not receive false rebalancing alerts**.

## Problem Description

Cuando un asset no tiene `currentPrice` configurado (null), el dashboard muestra datos engañosos:

1. **Valor $0.00**: Assets con holdings reales aparecen con valor $0.00
2. **Desviación incorrecta**: Si el target es 10%, muestra -10% deviation (100% underweight)
3. **Alertas falsas**: Se generan alertas de "rebalance_needed" para assets sin precio
4. **UX confusa**: Usuario no puede distinguir entre "sin precio" y "valor real cero"

**Ejemplo del problema actual:**
- Asset BTC tiene 0.001 BTC de holding pero `currentPrice: null`
- Dashboard muestra: Value: $0.00, Actual: 0%, Target: 10%, Dev: -10%
- Se genera alerta "BTC is 10% underweight"
- Usuario piensa que su BTC vale $0 cuando en realidad falta configurar el precio

## Acceptance Criteria

1. **Given** an asset with `currentPrice: null`
   **When** I view the dashboard positions list
   **Then** I see "Set price" indicator instead of $0.00 value
   **And** I see "—" instead of actual percentage
   **And** I see "—" instead of deviation percentage
   **And** the position has a visual indicator (badge/color) showing "No price"

2. **Given** an asset with `currentPrice: null`
   **When** the dashboard calculates alerts
   **Then** NO rebalance_needed alert is generated for this asset
   **And** a new alert type "missing_price" is generated with message "Set price for {ticker}"

3. **Given** an asset with `currentPrice: 0` (explicitly set to zero, not null)
   **When** I view the dashboard
   **Then** it shows $0.00 value as normal (this is intentional)
   **And** deviation calculations work normally

4. **Given** multiple assets where some have prices and some don't
   **When** I view the dashboard total value
   **Then** the total only includes assets WITH prices
   **And** an info message shows "X assets without price excluded from total"

5. **Given** the backend API response
   **When** I GET `/api/dashboard`
   **Then** each position includes `priceStatus: 'set' | 'missing'`
   **And** positions with `priceStatus: 'missing'` have `value: null` instead of "0.00"

6. **Given** the allocation chart
   **When** some assets have no price
   **Then** they are excluded from the pie chart
   **And** a legend note indicates "X assets without price not shown"

## Tasks / Subtasks

- [x] Task 1: Update backend portfolioService (AC: #3, #4, #5)
  - [x] 1.1 Add `priceStatus: 'set' | 'missing'` to position response
  - [x] 1.2 Return `value: null` instead of "0.00" when `currentPrice` is null
  - [x] 1.3 Update `totalValue` calculation to exclude positions with null price
  - [x] 1.4 Add `excludedCount` to response when assets without price exist
  - [x] 1.5 Update unit tests

- [x] Task 2: Update backend dashboardService (AC: #2)
  - [x] 2.1 Skip rebalance alert generation for positions with `priceStatus: 'missing'`
  - [x] 2.2 Add new alert type `missing_price` for assets without currentPrice
  - [x] 2.3 Set `actualPercentage: null` and `deviation: null` for missing price positions
  - [x] 2.4 Update unit tests

- [x] Task 3: Update TypeScript types (AC: #5)
  - [x] 3.1 Update `DashboardPosition` type with `priceStatus` and nullable fields
  - [x] 3.2 Update frontend `api.ts` types to match
  - [x] 3.3 Update Zod validation schemas (using TypeScript interfaces)

- [x] Task 4: Update PositionsList component (AC: #1)
  - [x] 4.1 Handle `value: null` - show "Set price" with link to prices page
  - [x] 4.2 Handle `actualPercentage: null` - show "—"
  - [x] 4.3 Handle `deviation: null` - show "—"
  - [x] 4.4 Add visual badge "No price" with amber/yellow styling
  - [x] 4.5 Update `getDeviationStyle` to handle null deviation

- [x] Task 5: Update AllocationChart component (AC: #6)
  - [x] 5.1 Filter out positions with `priceStatus: 'missing'` from chart data
  - [x] 5.2 Add legend note when assets are excluded
  - [x] 5.3 Handle edge case: all assets have no price (show empty state)

- [x] Task 6: Update AlertsPanel component (AC: #2)
  - [x] 6.1 Add UI handling for new `missing_price` alert type
  - [x] 6.2 Link to prices page with asset pre-selected
  - [x] 6.3 Use info/blue styling instead of warning/orange

- [x] Task 7: Update Dashboard summary display (AC: #4)
  - [x] 7.1 Show info message when assets excluded from total
  - [x] 7.2 Display "Total (X assets)" when some excluded

- [x] Task 8: Testing (AC: all)
  - [x] 8.1 Run backend tests (569 passed)
  - [x] 8.2 Run frontend typecheck + tests (478 passed)
  - [ ] 8.3 Manual testing with mixed price/no-price assets

## Dev Notes

### Current Code Analysis

**portfolioService.ts (líneas 67-70)** - El problema raíz:
```typescript
// ACTUAL - Problematico
const originalValue =
  currentPrice !== null
    ? Math.round(quantity * currentPrice * 100) / 100
    : 0  // ❌ Esto causa el problema - devuelve 0 en vez de null
```

**dashboardService.ts (líneas 89-104)** - Genera alertas incorrectas:
```typescript
// ACTUAL - Genera alertas para assets sin precio
if (pos.targetPercentage !== null && Math.abs(deviation) > effectiveThresholds.deviationPct) {
  // ❌ No verifica si el precio es null antes de calcular deviation
  alerts.push({ type: 'rebalance_needed', ... })
}
```

**PositionsList.tsx** - No distingue entre sin precio y valor cero:
```typescript
// ACTUAL - Muestra $0.00 para ambos casos
<p className="font-medium text-gray-900">
  {formatCurrency(position.value, position.displayCurrency)}  // ❌ Siempre muestra valor
</p>
```

### Implementation Pattern

**Backend - portfolioService.ts:**
```typescript
// SOLUCIÓN
return {
  assetId: holding.asset.id,
  // ... otros campos
  currentPrice: currentPrice !== null ? currentPrice.toFixed(2) : null,
  value: currentPrice !== null ? displayValue.toFixed(2) : null,  // ✅ null, no "0.00"
  priceStatus: currentPrice !== null ? 'set' : 'missing',  // ✅ Nuevo campo
  // ...
}

// Calcular total solo con assets que tienen precio
const positionsWithPrice = positions.filter(p => p.priceStatus === 'set')
const totalValue = positionsWithPrice.reduce((sum, pos) => sum + parseFloat(pos.value!), 0)
const excludedCount = positions.length - positionsWithPrice.length
```

**Backend - dashboardService.ts:**
```typescript
// SOLUCIÓN - No generar alertas de rebalanceo para assets sin precio
positions.map(pos => {
  const hasPriceSet = pos.priceStatus === 'set'

  // Calcular porcentajes solo si tiene precio
  const actualPercentage = hasPriceSet && totalValue > 0
    ? (parseFloat(pos.value!) / totalValue) * 100
    : null
  const deviation = hasPriceSet && pos.targetPercentage !== null
    ? actualPercentage! - parseFloat(pos.targetPercentage)
    : null

  // Alerta de rebalanceo SOLO si tiene precio
  if (hasPriceSet && deviation !== null && Math.abs(deviation) > threshold) {
    alerts.push({ type: 'rebalance_needed', ... })
  }

  // Nueva alerta para precio faltante
  if (!hasPriceSet) {
    alerts.push({
      type: 'missing_price',
      assetId: pos.assetId,
      ticker: pos.ticker,
      message: `Set price for ${pos.ticker}`,
      severity: 'info',  // info, no warning
    })
  }

  return {
    ...pos,
    actualPercentage: actualPercentage?.toFixed(2) ?? null,
    deviation: deviation?.toFixed(2) ?? null,
  }
})
```

**Frontend - PositionsList.tsx:**
```typescript
// SOLUCIÓN
function PositionItem({ position }: { position: DashboardPosition }) {
  const hasPriceSet = position.priceStatus === 'set'

  return (
    <div className="py-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-gray-900">{position.ticker}</p>
          <p className="text-sm text-gray-500">{position.name}</p>
        </div>
        <div className="text-right">
          {hasPriceSet ? (
            <p className="font-medium text-gray-900">
              {formatCurrency(position.value!, position.displayCurrency)}
            </p>
          ) : (
            <Link to="/prices" className="text-amber-600 hover:text-amber-700 font-medium">
              Set price →
            </Link>
          )}
          {hasPriceSet ? (
            <DeviationBadge deviation={position.deviation!} />
          ) : (
            <span className="inline-block rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700">
              No price
            </span>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-4 text-sm">
        <div>
          <span className="text-gray-500">Actual:</span>
          <span className="font-medium">
            {position.actualPercentage ? formatPercentage(position.actualPercentage) : '—'}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Target:</span>
          <span className="font-medium">
            {position.targetPercentage ? formatPercentage(position.targetPercentage) : '—'}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Dev:</span>
          <span className={hasPriceSet ? getDeviationColor(position.deviation) : 'text-gray-400'}>
            {position.deviation ? (
              `${parseFloat(position.deviation) > 0 ? '+' : ''}${formatPercentage(position.deviation)}`
            ) : '—'}
          </span>
        </div>
      </div>
    </div>
  )
}
```

### Type Updates

**Backend - validations/dashboard.ts:**
```typescript
// Agregar priceStatus al schema
export const dashboardPositionSchema = z.object({
  // ... campos existentes
  value: z.string().nullable(),  // ✅ Ahora nullable
  priceStatus: z.enum(['set', 'missing']),  // ✅ Nuevo campo
  actualPercentage: z.string().nullable(),  // ✅ Ahora nullable
  deviation: z.string().nullable(),  // ✅ Ahora nullable
})

// Nueva alerta type
export const dashboardAlertSchema = z.object({
  type: z.enum(['stale_price', 'rebalance_needed', 'missing_price']),  // ✅ Agregar missing_price
  // ...
})
```

**Frontend - types/api.ts:**
```typescript
export interface DashboardPosition {
  // ... campos existentes
  value: string | null  // ✅ Ahora nullable
  priceStatus: 'set' | 'missing'  // ✅ Nuevo campo
  actualPercentage: string | null  // ✅ Ahora nullable
  deviation: string | null  // ✅ Ahora nullable
}

export type DashboardAlertType = 'stale_price' | 'rebalance_needed' | 'missing_price'
```

### Visual Design

| Estado | Value | Actual% | Deviation | Badge | Color |
|--------|-------|---------|-----------|-------|-------|
| Price set | $1,234.56 | 25.5% | +5.5% | Overweight | orange |
| Price set, balanced | $500.00 | 10.0% | +0.2% | Balanced | green |
| **No price** | "Set price →" | — | — | No price | amber |
| Price = 0 | $0.00 | 0% | -10% | Underweight | blue |

### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| All assets have no price | Show "Set prices to see portfolio value" in total area |
| Mix of with/without price | Show total with "(X assets excluded)" note |
| Asset with price = 0.00 | Treat as valid price, show normal calculations |
| Asset with price = null AND quantity = 0 | Still show "No price" (price is the issue, not quantity) |

### Files to Modify

| File | Changes |
|------|---------|
| `backend/src/services/portfolioService.ts` | Return `value: null`, add `priceStatus` |
| `backend/src/services/dashboardService.ts` | Skip rebalance alerts, add missing_price alerts |
| `backend/src/validations/dashboard.ts` | Update schemas for nullable fields |
| `backend/src/services/portfolioService.test.ts` | Update tests for new behavior |
| `backend/src/services/dashboardService.test.ts` | Update tests for new alert logic |
| `frontend/src/types/api.ts` | Update `DashboardPosition` interface |
| `frontend/src/features/dashboard/components/PositionsList.tsx` | Handle null values, add "No price" UI |
| `frontend/src/features/dashboard/components/AllocationChart.tsx` | Filter out missing price positions |
| `frontend/src/features/dashboard/components/AlertsPanel.tsx` | Handle `missing_price` alert type |
| `frontend/src/features/dashboard/index.tsx` | Show excluded count info |

### Architecture Compliance

- **Error Handling:** Use existing error patterns, no new error types needed
- **Response Format:** Extend existing format with new fields (backward compatible addition)
- **Naming:** `priceStatus` follows camelCase convention
- **Types:** All new fields use proper TypeScript types with null unions
- **Tests:** Co-located next to source files

### Testing Approach

```typescript
// backend/src/services/portfolioService.test.ts
describe('portfolioService.getSummary', () => {
  it('returns value: null and priceStatus: missing when currentPrice is null', async () => {
    // Setup: Create holding with asset where currentPrice = null
    // Assert: position.value === null, position.priceStatus === 'missing'
  })

  it('excludes positions without price from totalValue', async () => {
    // Setup: 2 assets - one with price ($100), one without
    // Assert: totalValue === "100.00" (not includes null price asset)
  })
})

// backend/src/services/dashboardService.test.ts
describe('dashboardService.getDashboard', () => {
  it('does not generate rebalance alert for position without price', async () => {
    // Setup: Asset with target=10%, currentPrice=null
    // Assert: No rebalance_needed alert
  })

  it('generates missing_price alert for position without price', async () => {
    // Setup: Asset with currentPrice=null
    // Assert: Alert with type='missing_price', severity='info'
  })

  it('returns actualPercentage: null and deviation: null when price missing', async () => {
    // Setup: Position without price
    // Assert: actualPercentage === null, deviation === null
  })
})
```

### Previous Story Learnings

From Story 9-3/9-4 (API Updates):
- Los campos ahora usan `price`, `commission`, `total` (no `*Cents`)
- El servicio de dashboard ya tiene lógica de alertas que necesita extensión
- Los types de frontend ya manejan algunos campos nullables

From Story 9-5 (Transaction Precision):
- El patrón de validación en services está establecido
- Los tests co-located funcionan bien

### Git Commit Pattern

```
fix(dashboard): handle null prices correctly in portfolio display

- Return value: null instead of "0.00" for assets without price
- Add priceStatus field to distinguish set vs missing prices
- Skip rebalance alerts for assets without price
- Add missing_price alert type
- Update UI to show "Set price" instead of $0.00
- Exclude missing-price assets from allocation chart
```

### Dependencies

**Requires (already done):**
- Story 9-1: Schema Migration (DONE) - `currentPrice` field is Decimal?
- Story 9-3/9-4: API Types Update (DONE) - using new field names

**Note:** This story addresses the UX issue described in sprint-change-proposal-2026-01-13.md section 4.7

### References

- [Source: sprint-change-proposal-2026-01-13.md#4.7] - Dashboard Fix requirements
- [Source: backend/src/services/portfolioService.ts:67-70] - Current value calculation
- [Source: backend/src/services/dashboardService.ts:89-104] - Alert generation logic
- [Source: frontend/src/features/dashboard/components/PositionsList.tsx] - Current UI
- [Source: project-context.md#API Patterns] - Response format standards
- [Source: architecture.md#Implementation Patterns] - Naming and structure rules

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

- Implemented `priceStatus: 'set' | 'missing'` field in portfolioService to distinguish assets with prices from those without
- Updated portfolioService to return `value: null` and `originalValue: null` instead of "0.00" when `currentPrice` is null
- Modified totalValue calculation to only include positions with `priceStatus === 'set'`
- Added `excludedCount` to response when assets without price exist
- Updated dashboardService to:
  - Skip rebalance alerts for positions without price
  - Generate new `missing_price` alert type with severity 'info'
  - Return `actualPercentage: null` and `deviation: null` for missing price positions
- Updated TypeScript types in both backend (`validations/dashboard.ts`) and frontend (`types/api.ts`)
- Updated PositionsList component to show "Set price →" link and "No price" badge for positions without price
- Updated AllocationChart to filter out positions without price and show note when assets are excluded
- Updated AlertItem to handle new `missing_price` alert type with navigation to /prices
- Updated PortfolioSummaryCard to show info message when assets are excluded from total
- Added comprehensive unit tests for new behavior in portfolioService.test.ts and dashboardService.test.ts

### File List

**Backend:**
- backend/src/services/portfolioService.ts (modified)
- backend/src/services/portfolioService.test.ts (modified)
- backend/src/services/dashboardService.ts (modified)
- backend/src/services/dashboardService.test.ts (modified)
- backend/src/validations/dashboard.ts (modified)

**Frontend:**
- frontend/src/types/api.ts (modified)
- frontend/src/features/dashboard/components/PositionsList.tsx (modified)
- frontend/src/features/dashboard/components/PositionsList.test.tsx (modified)
- frontend/src/features/dashboard/components/AllocationChart.tsx (modified)
- frontend/src/features/dashboard/components/AllocationChart.test.tsx (modified)
- frontend/src/features/dashboard/components/AlertItem.tsx (modified)
- frontend/src/features/dashboard/components/PortfolioSummaryCard.tsx (modified)
- frontend/src/features/dashboard/hooks/useDashboard.test.tsx (modified)
- frontend/src/features/dashboard/index.tsx (modified)
- frontend/src/features/dashboard/index.test.tsx (modified)
