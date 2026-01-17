# Story 10.2: Contribution Suggestion UI

Status: done

## Story

As a **user making monthly contributions**,
I want **a visual interface to enter my contribution amount and see the suggested distribution**,
so that **I can quickly understand how to allocate my monthly investment**.

## Problem Description

El usuario ya tiene un endpoint backend (Story 10.1) que calcula la distribución sugerida de un aporte. Ahora necesita una interfaz visual para:

1. **Ingresar el monto del aporte**: Campo numérico para especificar cuánto quiere invertir
2. **Ver la distribución sugerida**: Tabla/lista mostrando cuánto invertir en cada activo
3. **Entender los ajustes**: Indicadores visuales que expliquen por qué se sugiere más/menos para cada activo
4. **Accionar la sugerencia**: Botón para usar la sugerencia y crear transacciones (preparación para Story 10.3)
5. **Ajustar manualmente**: Capacidad de modificar los montos antes de proceder

## Acceptance Criteria

1. **Given** I am on the contributions page
   **When** I enter a contribution amount
   **Then** I see a breakdown showing suggested amount per asset

2. **Given** a suggestion is displayed
   **When** an asset has a rebalancing adjustment
   **Then** I see an indicator showing the adjustment reason (e.g., "+$50 to correct underweight")

3. **Given** I view the suggestion
   **When** I want to proceed
   **Then** I can click "Use Suggestion" to pre-fill transaction forms

4. **Given** I view the suggestion
   **When** I disagree with the distribution
   **Then** I can manually adjust amounts before proceeding

5. **Given** I am on mobile
   **When** I view the contributions page
   **Then** the interface is usable and readable

6. **Given** I have no assets configured
   **When** I navigate to the contributions page
   **Then** I see a message to configure assets first with a link to portfolio page

7. **Given** I have assets but targets don't sum to 100%
   **When** I try to get a suggestion
   **Then** I see an error message indicating targets must sum to 100%

8. **Given** the frontend builds
   **When** I run `pnpm run build` in frontend
   **Then** there are no TypeScript errors

9. **Given** the frontend tests
   **When** I run `pnpm test` in frontend
   **Then** all tests pass including new contribution component tests

## Tasks / Subtasks

- [x] Task 1: Add API client and types for contributions (AC: #1, #6, #7)
  - [x] 1.1 Add `ContributionSuggestion` and `ContributionAllocation` types to `frontend/src/types/api.ts`
  - [x] 1.2 Add `contributions.suggest(amount)` method to `frontend/src/lib/api.ts`
  - [x] 1.3 Add `contributions` query keys to `frontend/src/lib/queryKeys.ts`

- [x] Task 2: Create contributions feature structure (AC: #1)
  - [x] 2.1 Create `frontend/src/features/contributions/` directory
  - [x] 2.2 Create `frontend/src/features/contributions/index.tsx` (ContributionsPage)
  - [x] 2.3 Create `frontend/src/features/contributions/hooks/useContributionSuggestion.ts`
  - [x] 2.4 Add tests for hook `useContributionSuggestion.test.tsx`

- [x] Task 3: Create contribution input component (AC: #1, #5)
  - [x] 3.1 Create `frontend/src/features/contributions/components/ContributionAmountInput.tsx`
  - [x] 3.2 Implement numeric input with currency formatting
  - [x] 3.3 Add "Calculate" button to trigger suggestion
  - [x] 3.4 Add tests `ContributionAmountInput.test.tsx`

- [x] Task 4: Create allocation display component (AC: #1, #2, #5)
  - [x] 4.1 Create `frontend/src/features/contributions/components/AllocationTable.tsx`
  - [x] 4.2 Display: ticker, name, target%, actual%, deviation, base amount, adjusted amount
  - [x] 4.3 Add visual indicators for underweight (blue) / overweight (orange) / balanced (green)
  - [x] 4.4 Add adjustment reason tooltips/badges
  - [x] 4.5 Add summary row with totals
  - [x] 4.6 Add tests `AllocationTable.test.tsx`

- [x] Task 5: Create adjustment indicator component (AC: #2)
  - [x] 5.1 Create `frontend/src/features/contributions/components/AdjustmentBadge.tsx`
  - [x] 5.2 Show "+$X to correct underweight" or "-$X overweight" with icons
  - [x] 5.3 Add tests `AdjustmentBadge.test.tsx`

- [x] Task 6: Implement manual adjustment capability (AC: #4)
  - [x] 6.1 Add editable input fields for adjusted amounts in AllocationTable
  - [x] 6.2 Recalculate totals when user modifies amounts
  - [x] 6.3 Show warning if total doesn't match original contribution amount
  - [x] 6.4 Add "Reset to Suggested" button

- [x] Task 7: Create action buttons component (AC: #3)
  - [x] 7.1 Create `frontend/src/features/contributions/components/SuggestionActions.tsx`
  - [x] 7.2 Add "Use Suggestion" button (disabled until Story 10.3)
  - [x] 7.3 Add "Record Transactions" button linking to transactions page with prefilled data
  - [x] 7.4 Store suggestion in session/local state for transaction prefill
  - [x] 7.5 Add tests `SuggestionActions.test.tsx`

- [x] Task 8: Handle edge cases and errors (AC: #6, #7)
  - [x] 8.1 Create `frontend/src/features/contributions/components/EmptyState.tsx`
  - [x] 8.2 Show "Configure assets first" message with link when no assets
  - [x] 8.3 Show error state when API returns validation errors
  - [x] 8.4 Add loading state during API call
  - [x] 8.5 Add tests for error states (EmptyState.test.tsx)

- [x] Task 9: Add routing and navigation (AC: #1, #5)
  - [x] 9.1 Add route `/contributions` to `frontend/src/router.tsx`
  - [x] 9.2 Add "Aportes" link to `frontend/src/components/layout/Layout.tsx` navLinks
  - [x] 9.3 Position after "Transactions" in navigation order

- [x] Task 10: Build and test (AC: #8, #9)
  - [x] 10.1 Run `pnpm run build` and verify no TypeScript errors
  - [x] 10.2 Run `pnpm test` and verify all tests pass (561 tests passing)
  - [x] 10.3 Add integration tests for ContributionsPage (index.test.tsx)

## Dev Notes

### API Types

**Location:** `frontend/src/types/api.ts`

```typescript
// Add to existing types file

export interface ContributionAllocation {
  assetId: string
  ticker: string
  name: string
  targetPercentage: string
  actualPercentage: string | null
  deviation: string | null
  baseAllocation: string
  adjustedAllocation: string
  adjustmentReason: 'underweight' | 'overweight' | null
}

export interface ContributionSuggestion {
  amount: string
  displayCurrency: string
  allocations: ContributionAllocation[]
  summary: {
    totalAdjusted: string
    underweightCount: number
    overweightCount: number
    balancedCount: number
  }
}

export interface ContributionSuggestInput {
  amount: number
}
```

### API Client Extension

**Location:** `frontend/src/lib/api.ts`

```typescript
// Add to api object

contributions: {
  suggest: async (amount: number): Promise<ContributionSuggestion> => {
    const res = await fetch(`${API_URL}/contributions/suggest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      credentials: 'include',
      body: JSON.stringify({ amount }),
    })
    return handleResponse<ContributionSuggestion>(res)
  },
},
```

### Query Keys

**Location:** `frontend/src/lib/queryKeys.ts`

```typescript
// Add to queryKeys object

contributions: {
  all: ['contributions'] as const,
  suggestion: (amount: number) =>
    [...queryKeys.contributions.all, 'suggestion', amount] as const,
},
```

### Hook Implementation

**Location:** `frontend/src/features/contributions/hooks/useContributionSuggestion.ts`

```typescript
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ContributionSuggestion } from '@/types/api'

export function useContributionSuggestion() {
  return useMutation({
    mutationFn: (amount: number) => api.contributions.suggest(amount),
  })
}
```

### Page Structure

**Location:** `frontend/src/features/contributions/index.tsx`

```typescript
import { useState } from 'react'
import { useContributionSuggestion } from './hooks/useContributionSuggestion'
import { ContributionAmountInput } from './components/ContributionAmountInput'
import { AllocationTable } from './components/AllocationTable'
import { SuggestionActions } from './components/SuggestionActions'
import { EmptyState } from './components/EmptyState'
import type { ContributionSuggestion, ContributionAllocation } from '@/types/api'

export function ContributionsPage() {
  const [amount, setAmount] = useState<number | null>(null)
  const [suggestion, setSuggestion] = useState<ContributionSuggestion | null>(null)
  const [adjustedAllocations, setAdjustedAllocations] = useState<ContributionAllocation[] | null>(null)

  const { mutate, isPending, isError, error } = useContributionSuggestion()

  const handleCalculate = (inputAmount: number) => {
    setAmount(inputAmount)
    mutate(inputAmount, {
      onSuccess: (data) => {
        setSuggestion(data)
        setAdjustedAllocations(data.allocations)
      },
    })
  }

  const handleAllocationChange = (assetId: string, newAmount: string) => {
    if (!adjustedAllocations) return
    setAdjustedAllocations(prev =>
      prev!.map(a => a.assetId === assetId
        ? { ...a, adjustedAllocation: newAmount }
        : a
      )
    )
  }

  const handleReset = () => {
    if (suggestion) {
      setAdjustedAllocations(suggestion.allocations)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Contribution Allocation</h1>

      <ContributionAmountInput
        onCalculate={handleCalculate}
        isLoading={isPending}
      />

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">
            {error?.message ?? 'Error calculating suggestion'}
          </p>
        </div>
      )}

      {suggestion && adjustedAllocations && (
        <>
          <AllocationTable
            allocations={adjustedAllocations}
            originalAllocations={suggestion.allocations}
            summary={suggestion.summary}
            displayCurrency={suggestion.displayCurrency}
            onAllocationChange={handleAllocationChange}
            onReset={handleReset}
          />

          <SuggestionActions
            allocations={adjustedAllocations}
            amount={amount!}
            displayCurrency={suggestion.displayCurrency}
          />
        </>
      )}
    </div>
  )
}
```

### Component Design

**ContributionAmountInput:**
- Input field con type="number" y formateo de moneda
- Placeholder: "Enter contribution amount"
- Botón "Calculate" alineado a la derecha
- Validación: monto positivo requerido

**AllocationTable:**
| Ticker | Name | Target | Actual | Deviation | Base | Adjusted | Action |
|--------|------|--------|--------|-----------|------|----------|--------|
| VOO | Vanguard S&P 500 | 60% | 55% | -5% | $600 | $650 | [Edit] |
| GLD | SPDR Gold | 20% | 20% | 0% | $200 | $200 | [Edit] |
| BTC | Bitcoin | 20% | 25% | +5% | $200 | $150 | [Edit] |
| **Total** | | | | | **$1000** | **$1000** | |

**AdjustmentBadge:**
- Underweight: Badge azul con icono ↑ y texto "+$50 underweight"
- Overweight: Badge naranja con icono ↓ y texto "-$50 overweight"
- Balanced: No badge, o badge verde con checkmark

### Visual Indicators (Tailwind Classes)

```typescript
const deviationColors = {
  underweight: 'text-blue-600 bg-blue-50',
  overweight: 'text-orange-600 bg-orange-50',
  balanced: 'text-green-600 bg-green-50',
}

const getDeviationStatus = (deviation: string | null): keyof typeof deviationColors => {
  if (!deviation) return 'balanced'
  const value = parseFloat(deviation)
  if (value < -1) return 'underweight'
  if (value > 1) return 'overweight'
  return 'balanced'
}
```

### Router Update

**Location:** `frontend/src/router.tsx`

```typescript
// Add import
import { ContributionsPage } from '@/features/contributions'

// Add route after /transactions
{
  path: '/contributions',
  element: <ContributionsPage />,
},
```

### Navigation Update

**Location:** `frontend/src/components/layout/Layout.tsx`

```typescript
const navLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/holdings', label: 'Holdings & Prices' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/contributions', label: 'Aportes' },  // NEW
  { to: '/evolution', label: 'Evolucion' },
  { to: '/settings', label: 'Configuracion' },
]
```

### Mobile Responsiveness

- Input y botón en stack vertical en mobile (< sm)
- Tabla responsiva con scroll horizontal o cards en mobile
- Botones de acción full-width en mobile
- Font sizes apropiados para touch targets

```typescript
// Mobile-friendly table alternative
{isMobile ? (
  <div className="space-y-4">
    {allocations.map(alloc => (
      <AllocationCard key={alloc.assetId} allocation={alloc} />
    ))}
  </div>
) : (
  <AllocationTable allocations={allocations} />
)}
```

### State Management for Transaction Prefill

Para Story 10.3, necesitamos guardar la sugerencia para prefill de transacciones:

```typescript
// Option 1: URL state
const searchParams = new URLSearchParams({
  prefill: JSON.stringify(adjustedAllocations),
})
navigate(`/transactions?${searchParams}`)

// Option 2: Session storage (preferred for large data)
sessionStorage.setItem('contribution-prefill', JSON.stringify({
  amount,
  allocations: adjustedAllocations,
  timestamp: Date.now(),
}))
navigate('/transactions')
```

### Test Cases

**Hook Tests (`useContributionSuggestion.test.ts`):**
```typescript
describe('useContributionSuggestion', () => {
  it('calls API with correct amount', async () => {
    // Setup mock
    const result = renderHook(() => useContributionSuggestion())
    await act(() => result.current.mutate(1000))
    expect(mockApi.contributions.suggest).toHaveBeenCalledWith(1000)
  })

  it('returns suggestion data on success', async () => {
    // Assert suggestion structure
  })

  it('handles API errors', async () => {
    // Assert error state
  })
})
```

**Component Tests:**
```typescript
describe('ContributionAmountInput', () => {
  it('renders input and calculate button', () => {})
  it('calls onCalculate with entered amount', () => {})
  it('disables button when loading', () => {})
  it('validates positive number input', () => {})
})

describe('AllocationTable', () => {
  it('renders all allocations', () => {})
  it('shows adjustment badges for deviations', () => {})
  it('allows editing adjusted amounts', () => {})
  it('calculates correct totals', () => {})
  it('shows warning when total differs from input', () => {})
})

describe('ContributionsPage', () => {
  it('shows empty state when no assets', () => {})
  it('displays suggestion after calculation', () => {})
  it('handles API errors gracefully', () => {})
})
```

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/types/api.ts` | MODIFY | Add contribution types |
| `frontend/src/lib/api.ts` | MODIFY | Add contributions.suggest method |
| `frontend/src/lib/queryKeys.ts` | MODIFY | Add contributions keys |
| `frontend/src/features/contributions/index.tsx` | CREATE | Main page component |
| `frontend/src/features/contributions/hooks/useContributionSuggestion.ts` | CREATE | API hook |
| `frontend/src/features/contributions/hooks/useContributionSuggestion.test.ts` | CREATE | Hook tests |
| `frontend/src/features/contributions/components/ContributionAmountInput.tsx` | CREATE | Input component |
| `frontend/src/features/contributions/components/ContributionAmountInput.test.tsx` | CREATE | Input tests |
| `frontend/src/features/contributions/components/AllocationTable.tsx` | CREATE | Table component |
| `frontend/src/features/contributions/components/AllocationTable.test.tsx` | CREATE | Table tests |
| `frontend/src/features/contributions/components/AdjustmentBadge.tsx` | CREATE | Badge component |
| `frontend/src/features/contributions/components/AdjustmentBadge.test.tsx` | CREATE | Badge tests |
| `frontend/src/features/contributions/components/SuggestionActions.tsx` | CREATE | Actions component |
| `frontend/src/features/contributions/components/SuggestionActions.test.tsx` | CREATE | Actions tests |
| `frontend/src/features/contributions/components/EmptyState.tsx` | CREATE | Empty state |
| `frontend/src/router.tsx` | MODIFY | Add /contributions route |
| `frontend/src/components/layout/Layout.tsx` | MODIFY | Add nav link |

### Architecture Compliance

- **Feature location:** `frontend/src/features/contributions/`
- **Components:** Feature-specific in `components/`
- **Hooks:** Custom hooks in `hooks/`
- **Tests:** Co-located `*.test.tsx`
- **Types:** Centralized in `frontend/src/types/api.ts`
- **API calls:** Through `lib/api.ts`, never direct fetch
- **Query keys:** Using `lib/queryKeys.ts` pattern
- **Styling:** Tailwind CSS with existing color patterns

### Previous Story Learnings

From Story 10.1 (Contribution API):
- Response uses string types for decimal values (`"600.00"`)
- `adjustmentReason` is `'underweight' | 'overweight' | null`
- Summary includes counts for each category
- Error responses follow standard `{ error, message, details }` format

From Story 9.7 (Transactions UI Table):
- Table patterns con responsive design
- Column alignment y formatting patterns
- Mobile scroll horizontal para tablas

From Dashboard patterns:
- Use `useDashboard` pattern para loading/error states
- Card-based layout con bordes grises
- Consistent spacing con `space-y-6`

### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| No assets | Show EmptyState with link to /portfolio |
| Targets != 100% | Show error from API with current sum |
| Amount = 0 | Validation error in input |
| Very large amount | Handle with proper formatting |
| API timeout | Show error state with retry option |
| Session storage full | Fallback to URL params for prefill |
| Mobile viewport | Stack layout, touch-friendly inputs |

### Dependencies

**Requires (already done):**
- Story 10.1: Contribution Suggestion API (DONE)
- Epic 2: Portfolio Configuration (DONE) - Assets with targets
- Epic 3: Holdings (DONE) - Current values for deviation calc

**Prepares for:**
- Story 10.3: Transaction integration - Will use prefill mechanism

### References

- [Source: epics.md#Story 10.2] - Story requirements
- [Source: 10-1-contribution-suggestion-api.md] - API response format
- [Source: architecture.md#Frontend Stack] - React patterns
- [Source: project-context.md#Frontend Patterns] - Component organization
- [Source: router.tsx] - Routing configuration
- [Source: Layout.tsx:5-12] - Navigation links array
- [Source: dashboard/index.tsx] - Page structure pattern
- [Source: transactions/components/CreateTransactionModal.tsx] - Form pattern

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

- All 10 tasks completed successfully
- 561 tests passing (65 test files)
- Build completes without TypeScript errors
- Feature includes:
  - API client integration with contributions.suggest endpoint
  - Contribution amount input with validation
  - AllocationTable with desktop and mobile responsive views
  - Visual indicators for underweight/overweight/balanced assets
  - Manual adjustment capability with edit-in-place
  - Action buttons with session storage for transaction prefill
  - Empty state handling for no-assets and invalid-targets scenarios
  - Route /contributions added with "Aportes" nav link

### File List

**Modified Files:**
- `frontend/src/types/api.ts` - Added ContributionSuggestion and ContributionAllocation types
- `frontend/src/lib/api.ts` - Added contributions.suggest method
- `frontend/src/lib/queryKeys.ts` - Added contributions query keys
- `frontend/src/router.tsx` - Added /contributions route
- `frontend/src/components/layout/Layout.tsx` - Added "Aportes" nav link

**Created Files:**
- `frontend/src/features/contributions/index.tsx` - ContributionsPage
- `frontend/src/features/contributions/index.test.tsx` - Integration tests
- `frontend/src/features/contributions/hooks/useContributionSuggestion.ts` - API hook
- `frontend/src/features/contributions/hooks/useContributionSuggestion.test.tsx` - Hook tests
- `frontend/src/features/contributions/components/ContributionAmountInput.tsx` - Input component
- `frontend/src/features/contributions/components/ContributionAmountInput.test.tsx` - Input tests
- `frontend/src/features/contributions/components/AllocationTable.tsx` - Table component
- `frontend/src/features/contributions/components/AllocationTable.test.tsx` - Table tests
- `frontend/src/features/contributions/components/AdjustmentBadge.tsx` - Badge component
- `frontend/src/features/contributions/components/AdjustmentBadge.test.tsx` - Badge tests
- `frontend/src/features/contributions/components/SuggestionActions.tsx` - Actions component
- `frontend/src/features/contributions/components/SuggestionActions.test.tsx` - Actions tests
- `frontend/src/features/contributions/components/EmptyState.tsx` - Empty state component
- `frontend/src/features/contributions/components/EmptyState.test.tsx` - Empty state tests

## Change Log

- 2026-01-16: Story 10.2 created - Contribution Suggestion UI ready for development
- 2026-01-17: Story 10.2 COMPLETED - All tasks implemented and tests passing
