# Story 7.5: Exchange Rate Settings & Preferences

Status: ready-for-dev

## Story

As a **user**,
I want **to view exchange rate information and force a manual refresh from the Settings page**,
So that **I can see when the rate was last updated and refresh it if I suspect it's outdated**.

## Acceptance Criteria

1. **Given** I am on the Settings page, **When** the page loads, **Then** I see a new "Tipo de Cambio" section displaying the current USD/ARS exchange rate

2. **Given** I view the exchange rate section, **When** the exchange rate has been fetched successfully, **Then** I see:
   - Current rate (e.g., "1 USD = 1.105,50 ARS")
   - Fetch date/time (e.g., "Actualizado: 12 ene 2026, 14:30")
   - Data source (e.g., "Fuente: Bluelytics")

3. **Given** I view the exchange rate section, **When** the rate is stale (>1 hour old based on isStale flag), **Then** I see a warning indicator: "Tipo de cambio desactualizado"

4. **Given** I am on the Settings page, **When** I click the "Actualizar ahora" button, **Then** the system fetches a fresh rate from the API and updates the display

5. **Given** I click the refresh button, **When** the API call is in progress, **Then** I see a loading spinner on the button and the button is disabled

6. **Given** the rate refresh fails (API unavailable), **When** I see the result, **Then** I see an error toast: "No se pudo actualizar el tipo de cambio"

## Tasks / Subtasks

- [x] Task 1: Add refresh endpoint to backend exchange rates API (AC: #4)
  - [x] Add `POST /api/exchange-rates/refresh` endpoint to `backend/src/routes/exchangeRates.ts`
  - [x] Call `exchangeRateService.fetchFromApi()` and save result
  - [x] Return refreshed rate or error
  - [x] Write tests

- [x] Task 2: Add refresh function to frontend API client (AC: #4)
  - [x] Add `api.exchangeRates.refresh()` method to `frontend/src/lib/api.ts`
  - [x] Reuse existing `ExchangeRateResponse` type (same response format)

- [x] Task 3: Create useExchangeRateRefresh mutation hook (AC: #4, #5)
  - [x] Create `frontend/src/features/exchange-rates/hooks/useExchangeRateRefresh.ts`
  - [x] Use TanStack Query useMutation
  - [x] Invalidate `queryKeys.exchangeRates.current()` on success
  - [x] Write tests

- [ ] Task 4: Create ExchangeRateSection component (AC: #1, #2, #3)
  - [ ] Create `frontend/src/features/settings/components/ExchangeRateSection.tsx`
  - [ ] Display current rate, fetchedAt, source
  - [ ] Show stale warning when `isStale` is true
  - [ ] Style to match existing Settings sections
  - [ ] Write tests

- [ ] Task 5: Add refresh button with loading state (AC: #4, #5, #6)
  - [ ] Add "Actualizar ahora" button to ExchangeRateSection
  - [ ] Show loading spinner during mutation
  - [ ] Disable button during loading
  - [ ] Show toast on success/error
  - [ ] Write tests

- [ ] Task 6: Integrate ExchangeRateSection into Settings page (AC: #1)
  - [ ] Import ExchangeRateSection in `frontend/src/features/settings/index.tsx`
  - [ ] Add as a new section between Alert Settings and Export sections
  - [ ] Write integration test

- [ ] Task 7: Run all tests and ensure passing
  - [ ] Run `pnpm test` in backend
  - [ ] Run `pnpm test` in frontend
  - [ ] Fix any failing tests

## Dev Notes

### Backend: Refresh Endpoint

```typescript
// backend/src/routes/exchangeRates.ts - ADD new endpoint

/**
 * POST /api/exchange-rates/refresh
 * Force refresh the exchange rate from external API
 */
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const freshRate = await exchangeRateService.fetchFromApi()
    await exchangeRateService.saveRate('USD', 'ARS', freshRate)

    res.json({
      data: {
        baseCurrency: 'USD',
        quoteCurrency: 'ARS',
        rate: freshRate,
        fetchedAt: new Date().toISOString(),
        isStale: false,
        source: 'bluelytics',
      },
    })
  } catch (error) {
    next(error)
  }
})
```

### Frontend API Client

```typescript
// frontend/src/lib/api.ts - ADD to exchangeRates object

exchangeRates: {
  getCurrent: async (): Promise<ExchangeRateResponse> => {
    // existing code...
  },

  refresh: async (): Promise<ExchangeRateResponse> => {
    const res = await fetch(`${API_URL}/exchange-rates/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return handleResponse<ExchangeRateResponse>(res)
  },
},
```

### useExchangeRateRefresh Hook

```typescript
// frontend/src/features/exchange-rates/hooks/useExchangeRateRefresh.ts

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import type { ExchangeRateResponse } from '@/types/api'

export function useExchangeRateRefresh() {
  const queryClient = useQueryClient()

  return useMutation<ExchangeRateResponse>({
    mutationFn: () => api.exchangeRates.refresh(),
    onSuccess: (data) => {
      // Update the cached exchange rate immediately
      queryClient.setQueryData(queryKeys.exchangeRates.current(), data)
    },
  })
}
```

### ExchangeRateSection Component

```typescript
// frontend/src/features/settings/components/ExchangeRateSection.tsx

import { useExchangeRate } from '@/features/exchange-rates/hooks/useExchangeRate'
import { useExchangeRateRefresh } from '@/features/exchange-rates/hooks/useExchangeRateRefresh'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner' // or your toast library

export function ExchangeRateSection() {
  const { data: exchangeRate, isLoading, error } = useExchangeRate()
  const refreshMutation = useExchangeRateRefresh()

  const handleRefresh = async () => {
    try {
      await refreshMutation.mutateAsync()
      toast.success('Tipo de cambio actualizado')
    } catch {
      toast.error('No se pudo actualizar el tipo de cambio')
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-16 bg-gray-200 rounded" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-600">
        Error al cargar tipo de cambio
      </div>
    )
  }

  if (!exchangeRate) {
    return null
  }

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Tipo de Cambio</h2>

      <div className="space-y-4">
        {/* Current Rate */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Cotizacion USD/ARS</p>
            <p className="text-xl font-semibold">
              1 USD = {formatCurrency(exchangeRate.rate, 'ARS')}
            </p>
          </div>

          {exchangeRate.isStale && (
            <div className="flex items-center gap-1 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">Desactualizado</span>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="text-sm text-gray-500 space-y-1">
          <p>
            Actualizado: {formatDate(exchangeRate.fetchedAt, 'full')}
          </p>
          <p>
            Fuente: {exchangeRate.source === 'bluelytics' ? 'Bluelytics' : exchangeRate.source}
          </p>
        </div>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={refreshMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
          {refreshMutation.isPending ? 'Actualizando...' : 'Actualizar ahora'}
        </button>
      </div>
    </section>
  )
}
```

### Updated Settings Page

```typescript
// frontend/src/features/settings/index.tsx

import { SettingsForm } from './components/SettingsForm'
import { ExchangeRateSection } from './components/ExchangeRateSection'
import { ExportSection } from './components/ExportSection'
import { AccountSection } from './components/AccountSection'

export function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-8">Configuracion</h1>

      <div className="space-y-8">
        {/* Alert Settings Section */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Preferencias de alertas</h2>
          <SettingsForm />
        </section>

        {/* Exchange Rate Section - NEW */}
        <ExchangeRateSection />

        {/* Data Export Section */}
        <section className="bg-white rounded-lg shadow p-6">
          <ExportSection />
        </section>

        {/* Account Section */}
        <section className="bg-white rounded-lg shadow p-6">
          <AccountSection />
        </section>
      </div>
    </div>
  )
}
```

### formatDate Enhancement

If `formatDate` doesn't support 'full' format yet, add it:

```typescript
// frontend/src/lib/formatters.ts

type DateFormat = 'short' | 'medium' | 'full'

export function formatDate(dateString: string, format: DateFormat = 'medium'): string {
  const date = new Date(dateString)

  const options: Intl.DateTimeFormatOptions = {
    short: { day: '2-digit', month: '2-digit', year: 'numeric' },
    medium: { day: 'numeric', month: 'short', year: 'numeric' },
    full: {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    },
  }[format]

  return new Intl.DateTimeFormat('es-AR', options).format(date)
}
```

**Expected outputs:**
- short: `12/01/2026`
- medium: `12 ene 2026`
- full: `12 ene 2026, 14:30`

### File Structure

```
backend/src/routes/
└── exchangeRates.ts                (MODIFY - add POST /refresh)
└── exchangeRates.test.ts           (MODIFY - add refresh tests)

frontend/src/lib/
├── api.ts                          (MODIFY - add refresh method)
└── formatters.ts                   (MODIFY - add 'full' format if needed)

frontend/src/features/exchange-rates/hooks/
├── useExchangeRate.ts              (no changes)
└── useExchangeRateRefresh.ts       (CREATE)

frontend/src/features/settings/
├── index.tsx                       (MODIFY - add ExchangeRateSection)
└── components/
    ├── SettingsForm.tsx            (no changes)
    ├── ExportSection.tsx           (no changes)
    ├── AccountSection.tsx          (no changes)
    ├── ExchangeRateSection.tsx     (CREATE)
    └── ExchangeRateSection.test.tsx (CREATE)
```

### Testing Strategy

```typescript
// Backend tests - exchangeRates.test.ts
describe('POST /api/exchange-rates/refresh', () => {
  it('should refresh exchange rate from API')
  it('should return fresh rate data')
  it('should handle API failure gracefully')
  it('should require authentication')
})

// Frontend tests - ExchangeRateSection.test.tsx
describe('ExchangeRateSection', () => {
  it('should render current exchange rate')
  it('should display fetch date and source')
  it('should show stale warning when rate is stale')
  it('should show loading state during refresh')
  it('should disable button during refresh')
  it('should call refresh mutation on button click')
  it('should show success toast on successful refresh')
  it('should show error toast on failed refresh')
})

// Frontend tests - useExchangeRateRefresh.test.ts
describe('useExchangeRateRefresh', () => {
  it('should call api.exchangeRates.refresh')
  it('should invalidate exchange rate query on success')
  it('should handle errors')
})
```

### Dependencies

**Backend:**
- No new dependencies - uses existing exchangeRateService

**Frontend:**
- `lucide-react` - for RefreshCw and AlertTriangle icons (already installed)
- Toast library - check which one is being used (sonner, react-hot-toast, or custom)

### Verify Toast Library

Check which toast library is used in the project:

```bash
# In frontend directory
grep -r "toast" src/ --include="*.tsx" | head -5
```

If using a custom toast or different library, adjust the imports and API accordingly.

### UI/UX Patterns to Follow

From existing Settings page:
- Section container: `bg-white rounded-lg shadow p-6`
- Section title: `text-lg font-semibold mb-4`
- Description text: `text-sm text-gray-500`
- Primary values: `text-xl font-semibold`
- Warning indicator: `text-amber-600` with icon

### Exchange Rate Data Structure

From existing `useExchangeRate` response:
```typescript
{
  baseCurrency: 'USD',
  quoteCurrency: 'ARS',
  rate: 1105.5,           // number
  fetchedAt: '2026-01-12T14:30:00.000Z',  // ISO string
  isStale: false,         // boolean
  source: 'bluelytics',   // string
}
```

### Anti-Patterns to Avoid

```typescript
// NEVER fetch directly from component
const response = await fetch('/api/exchange-rates/refresh') // WRONG

// ALWAYS use API client and hooks
const refreshMutation = useExchangeRateRefresh() // CORRECT

// NEVER show raw source string to user
<p>Source: {exchangeRate.source}</p> // Shows "bluelytics"

// ALWAYS use friendly source names
<p>Fuente: {exchangeRate.source === 'bluelytics' ? 'Bluelytics' : exchangeRate.source}</p>

// NEVER forget to handle loading and error states
return <div>{exchangeRate.rate}</div> // WRONG - no loading/error handling

// ALWAYS handle all states
if (isLoading) return <LoadingState />
if (error) return <ErrorState />
return <Content /> // CORRECT
```

### Previous Story Intelligence

**From Story 7-2 (Exchange Rate API Integration):**
- `exchangeRateService` already handles fetching from Bluelytics API
- `fetchFromApi()` method returns the rate (number)
- `saveRate()` method persists to database
- Backend already has robust error handling with fallback to cached rate
- `CACHE_TTL_MS = 60 * 60 * 1000` (1 hour)

**From Story 7-4 (Evolution Chart Currency Toggle):**
- `useExchangeRate` hook already fetches current rate
- `ExchangeRateResponse` type already defined
- `queryKeys.exchangeRates.current()` already defined

### Project Context Reference

See `_bmad-output/project-context.md` for:
- Component naming: PascalCase.tsx
- Test files: co-located `*.test.tsx`
- State management: TanStack Query for server state
- API patterns: Use `api.` client, never raw fetch
- Tailwind patterns: match existing Settings page styles
- Error handling: Use toast for user feedback

### References

- [Source: backend/src/services/exchangeRateService.ts - Exchange rate service with fetch and cache]
- [Source: backend/src/routes/exchangeRates.ts - Current exchange rate endpoint]
- [Source: frontend/src/features/exchange-rates/hooks/useExchangeRate.ts - Exchange rate hook]
- [Source: frontend/src/features/settings/index.tsx - Settings page structure]
- [Source: frontend/src/features/settings/components/SettingsForm.tsx - Settings form patterns]
- [Source: frontend/src/lib/api.ts - API client structure]
- [Source: frontend/src/types/api.ts - ExchangeRateResponse type]
- [Source: _bmad-output/implementation-artifacts/7-4-evolution-chart-currency-toggle.md - Previous story patterns]
- [Source: _bmad-output/planning-artifacts/sprint-change-proposal-2026-01-11.md - FR36 requirement]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

- Task 1: Added POST /api/exchange-rates/refresh endpoint. Calls fetchFromApi() and saveRate(), returns fresh rate data. Added 3 unit tests.
- Task 2: Added api.exchangeRates.refresh() method. Reuses existing ExchangeRateResponse type.
- Task 3: Created useExchangeRateRefresh hook with useMutation. Updates cache on success. Added 4 unit tests.

### File List

- backend/src/routes/exchangeRates.ts (modified)
- backend/src/routes/exchangeRates.test.ts (modified)
- frontend/src/lib/api.ts (modified)
- frontend/src/features/exchange-rates/hooks/useExchangeRateRefresh.ts (created)
- frontend/src/features/exchange-rates/hooks/useExchangeRateRefresh.test.tsx (created)
