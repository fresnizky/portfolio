# Story 10.3: Contribution to Transaction Integration

Status: ready-for-dev

## Story

As a **user who has accepted a contribution suggestion**,
I want **to easily convert my contribution suggestion into actual transactions**,
so that **I can record my purchases without re-entering data**.

## Problem Description

En Story 10.2 se implementó la UI de sugerencia de aportes que guarda los datos en sessionStorage cuando el usuario hace click en "Registrar Transacciones". Sin embargo, actualmente:

1. El usuario es redirigido a `/transactions` pero los datos de prefill NO se utilizan
2. El botón "Usar Sugerencia" está deshabilitado (placeholder para esta historia)
3. No hay flujo guiado para crear múltiples transacciones secuencialmente
4. No hay tracking del progreso de transacciones pendientes

Esta historia implementa la integración completa entre la sugerencia de aportes y el registro de transacciones.

## Acceptance Criteria

1. **Given** I have accepted a contribution suggestion
   **When** I click "Record Transactions"
   **Then** I am guided to create buy transactions for each suggested asset

2. **Given** I am recording transactions from a suggestion
   **When** I complete a transaction for one asset
   **Then** the system shows remaining assets to process

3. **Given** I have recorded all transactions from a suggestion
   **When** I finish the flow
   **Then** I see a summary of what was recorded and my updated portfolio state

4. **Given** I started but didn't complete all transactions
   **When** I return to the app later
   **Then** I can resume or discard the pending contribution plan

5. **Given** I click "Use Suggestion" button (currently disabled)
   **When** the flow starts
   **Then** the button triggers the same transaction recording flow

6. **Given** the frontend builds
   **When** I run `pnpm run build` in frontend
   **Then** there are no TypeScript errors

7. **Given** the frontend tests
   **When** I run `pnpm test` in frontend
   **Then** all tests pass including new integration tests

## Tasks / Subtasks

- [ ] Task 1: Create ContributionTransactionFlow component (AC: #1, #2)
  - [ ] 1.1 Create `frontend/src/features/contributions/components/ContributionTransactionFlow.tsx`
  - [ ] 1.2 Display current asset being processed with pre-filled data
  - [ ] 1.3 Show progress indicator (e.g., "Asset 1 of 4")
  - [ ] 1.4 Include "Skip" and "Cancel" buttons
  - [ ] 1.5 Add tests `ContributionTransactionFlow.test.tsx`

- [ ] Task 2: Create pending contribution state management (AC: #4)
  - [ ] 2.1 Create `frontend/src/features/contributions/hooks/usePendingContribution.ts`
  - [ ] 2.2 Read/write from sessionStorage with key 'contribution-prefill'
  - [ ] 2.3 Track which assets have been processed (add `processedAssetIds` to stored data)
  - [ ] 2.4 Add `clearPendingContribution()` function
  - [ ] 2.5 Add tests `usePendingContribution.test.tsx`

- [ ] Task 3: Modify TransactionsPage to detect and use prefill (AC: #1, #4)
  - [ ] 3.1 Add `usePendingContribution` hook to `frontend/src/features/transactions/index.tsx`
  - [ ] 3.2 Show banner when pending contribution exists
  - [ ] 3.3 Add "Resume contribution" and "Discard" buttons to banner
  - [ ] 3.4 Add tests for prefill detection

- [ ] Task 4: Create contribution flow modal/page (AC: #1, #2, #3)
  - [ ] 4.1 Create `frontend/src/features/contributions/components/ContributionFlowModal.tsx`
  - [ ] 4.2 Show list of pending assets to process
  - [ ] 4.3 Embed TransactionForm with pre-filled values for current asset
  - [ ] 4.4 After each successful transaction, mark asset as processed and advance
  - [ ] 4.5 Add tests `ContributionFlowModal.test.tsx`

- [ ] Task 5: Create completion summary component (AC: #3)
  - [ ] 5.1 Create `frontend/src/features/contributions/components/ContributionCompleteSummary.tsx`
  - [ ] 5.2 Show list of recorded transactions with amounts
  - [ ] 5.3 Show total invested and updated portfolio value
  - [ ] 5.4 Add "View Transactions" and "Back to Dashboard" buttons
  - [ ] 5.5 Add tests `ContributionCompleteSummary.test.tsx`

- [ ] Task 6: Enable "Use Suggestion" button (AC: #5)
  - [ ] 6.1 Modify `frontend/src/features/contributions/components/SuggestionActions.tsx`
  - [ ] 6.2 Remove `disabled` attribute from "Usar Sugerencia" button
  - [ ] 6.3 Add onClick handler that opens ContributionFlowModal
  - [ ] 6.4 Update tests for enabled button

- [ ] Task 7: Handle edge cases (AC: #4)
  - [ ] 7.1 Handle expired prefill data (timestamp older than 24 hours)
  - [ ] 7.2 Handle partial completion (some assets already processed)
  - [ ] 7.3 Handle asset deletion between suggestion and transaction
  - [ ] 7.4 Add confirmation dialog before discarding pending contribution

- [ ] Task 8: Build and test (AC: #6, #7)
  - [ ] 8.1 Run `pnpm run build` and verify no TypeScript errors
  - [ ] 8.2 Run `pnpm test` and verify all tests pass
  - [ ] 8.3 Test complete flow manually: suggestion -> transactions -> summary

## Dev Notes

### Session Storage Data Structure

**Current Structure (from Story 10.2):**
```typescript
interface ContributionPrefillData {
  amount: number
  allocations: ContributionAllocation[]
  timestamp: number
}
```

**Enhanced Structure for Story 10.3:**
```typescript
interface ContributionPrefillData {
  amount: number
  allocations: ContributionAllocation[]
  timestamp: number
  processedAssetIds: string[]  // NEW: Track completed transactions
  status: 'pending' | 'in_progress' | 'completed'  // NEW: Flow status
}
```

### Pending Contribution Hook

**Location:** `frontend/src/features/contributions/hooks/usePendingContribution.ts`

```typescript
import { useState, useCallback, useEffect } from 'react'
import type { ContributionAllocation } from '@/types/api'

const STORAGE_KEY = 'contribution-prefill'
const EXPIRY_HOURS = 24

interface PendingContribution {
  amount: number
  allocations: ContributionAllocation[]
  timestamp: number
  processedAssetIds: string[]
  status: 'pending' | 'in_progress' | 'completed'
}

export function usePendingContribution() {
  const [pending, setPending] = useState<PendingContribution | null>(null)

  const loadPending = useCallback(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (!stored) return null

    const data = JSON.parse(stored) as PendingContribution

    // Check expiry
    const hoursSinceCreated = (Date.now() - data.timestamp) / (1000 * 60 * 60)
    if (hoursSinceCreated > EXPIRY_HOURS) {
      sessionStorage.removeItem(STORAGE_KEY)
      return null
    }

    // Migrate old format (no processedAssetIds)
    if (!data.processedAssetIds) {
      data.processedAssetIds = []
      data.status = 'pending'
    }

    return data
  }, [])

  useEffect(() => {
    setPending(loadPending())
  }, [loadPending])

  const markAssetProcessed = useCallback((assetId: string) => {
    setPending(prev => {
      if (!prev) return null
      const updated = {
        ...prev,
        processedAssetIds: [...prev.processedAssetIds, assetId],
        status: 'in_progress' as const,
      }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const complete = useCallback(() => {
    setPending(prev => {
      if (!prev) return null
      const updated = { ...prev, status: 'completed' as const }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const clear = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY)
    setPending(null)
  }, [])

  const remainingAllocations = pending?.allocations.filter(
    a => !pending.processedAssetIds.includes(a.assetId)
  ) ?? []

  return {
    pending,
    remainingAllocations,
    hasPending: !!pending && pending.status !== 'completed',
    isExpired: pending ? (Date.now() - pending.timestamp) / (1000 * 60 * 60) > EXPIRY_HOURS : false,
    markAssetProcessed,
    complete,
    clear,
    refresh: () => setPending(loadPending()),
  }
}
```

### ContributionFlowModal Component

**Location:** `frontend/src/features/contributions/components/ContributionFlowModal.tsx`

```typescript
import { useState } from 'react'
import { Modal } from '@/components/common/Modal'
import { TransactionForm } from '@/features/transactions/components/TransactionForm'
import { ContributionCompleteSummary } from './ContributionCompleteSummary'
import { usePendingContribution } from '../hooks/usePendingContribution'
import { useAssets } from '@/features/portfolio/hooks/useAssets'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import type { CreateTransactionFormData } from '@/validations/transaction'

interface ContributionFlowModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ContributionFlowModal({ isOpen, onClose }: ContributionFlowModalProps) {
  const queryClient = useQueryClient()
  const { data: assetsData } = useAssets()
  const { pending, remainingAllocations, markAssetProcessed, complete, clear } = usePendingContribution()
  const [recordedTransactions, setRecordedTransactions] = useState<string[]>([])

  const currentAllocation = remainingAllocations[0]
  const totalCount = pending?.allocations.length ?? 0
  const processedCount = totalCount - remainingAllocations.length
  const isComplete = remainingAllocations.length === 0 && pending?.status === 'in_progress'

  const createTransaction = useMutation({
    mutationFn: (data: CreateTransactionFormData) => api.transactions.create({
      type: data.type,
      assetId: data.assetId,
      date: data.date,
      quantity: data.quantity,
      price: data.price,
      commission: data.commission,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.all })
    },
  })

  const handleSubmit = async (data: CreateTransactionFormData) => {
    await createTransaction.mutateAsync(data)
    setRecordedTransactions(prev => [...prev, currentAllocation.assetId])
    markAssetProcessed(currentAllocation.assetId)

    if (remainingAllocations.length === 1) {
      complete()
    }
  }

  const handleSkip = () => {
    markAssetProcessed(currentAllocation.assetId)
    if (remainingAllocations.length === 1) {
      complete()
    }
  }

  const handleDiscard = () => {
    clear()
    onClose()
  }

  const handleFinish = () => {
    clear()
    onClose()
  }

  if (!pending) return null

  // Get default values for pre-filling form
  const getDefaultValues = () => {
    if (!currentAllocation) return undefined
    return {
      type: 'buy' as const,
      assetId: currentAllocation.assetId,
      date: new Date().toISOString().split('T')[0],
      quantity: 0, // User needs to calculate based on price
      price: 0,    // User enters current price
      commission: 0,
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleDiscard}
      title={isComplete ? 'Contribution Complete' : `Record Transaction (${processedCount + 1}/${totalCount})`}
      size="lg"
    >
      {isComplete ? (
        <ContributionCompleteSummary
          totalAmount={pending.amount}
          recordedCount={recordedTransactions.length}
          skippedCount={totalCount - recordedTransactions.length}
          onViewTransactions={() => {
            handleFinish()
            // Navigate handled by parent
          }}
          onClose={handleFinish}
        />
      ) : (
        <div className="space-y-4">
          {/* Progress indicator */}
          <div className="rounded-lg bg-blue-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-900">
                  {currentAllocation.ticker} - {currentAllocation.name}
                </p>
                <p className="text-sm text-blue-700">
                  Monto sugerido: ${parseFloat(currentAllocation.adjustedAllocation).toLocaleString()}
                </p>
              </div>
              <span className="text-sm text-blue-600">
                {processedCount + 1} de {totalCount}
              </span>
            </div>
          </div>

          {/* Transaction form with prefilled asset */}
          <TransactionForm
            assets={assetsData ?? []}
            onSubmit={handleSubmit}
            onCancel={handleDiscard}
            isSubmitting={createTransaction.isPending}
            defaultValues={getDefaultValues()}
            lockedAssetId={currentAllocation.assetId}
            suggestedAmount={parseFloat(currentAllocation.adjustedAllocation)}
          />

          {/* Skip button */}
          <div className="flex justify-between border-t pt-4">
            <button
              type="button"
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Omitir este activo
            </button>
            <span className="text-xs text-gray-400">
              Pendientes: {remainingAllocations.length}
            </span>
          </div>
        </div>
      )}
    </Modal>
  )
}
```

### TransactionForm Enhancement

**Location:** `frontend/src/features/transactions/components/TransactionForm.tsx`

Add new props to support contribution flow:
```typescript
interface TransactionFormProps {
  assets: Asset[]
  onSubmit: (data: CreateTransactionFormData) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
  defaultValues?: Partial<CreateTransactionFormData>  // NEW
  lockedAssetId?: string                               // NEW: Disable asset selector
  suggestedAmount?: number                             // NEW: Show hint
}
```

### Transactions Page Banner

**Location:** `frontend/src/features/transactions/index.tsx`

Add after page title:
```typescript
{hasPendingContribution && (
  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-blue-900">
          Tienes un aporte pendiente de registrar
        </p>
        <p className="text-sm text-blue-700">
          {remainingCount} de {totalCount} transacciones pendientes
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleResume}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
        >
          Continuar
        </button>
        <button
          onClick={handleDiscard}
          className="rounded-md border border-blue-200 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100"
        >
          Descartar
        </button>
      </div>
    </div>
  </div>
)}
```

### Enable "Usar Sugerencia" Button

**Location:** `frontend/src/features/contributions/components/SuggestionActions.tsx`

Change from:
```typescript
<button
  type="button"
  disabled
  className="... cursor-not-allowed"
  title="Disponible en próxima versión"
>
  Usar Sugerencia
</button>
```

To:
```typescript
<button
  type="button"
  onClick={onUseSuggestion}
  className="... hover:bg-blue-700"
>
  Usar Sugerencia
</button>
```

Add `onUseSuggestion` prop to SuggestionActions.

### Complete Summary Component

**Location:** `frontend/src/features/contributions/components/ContributionCompleteSummary.tsx`

```typescript
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { formatCurrency } from '@/lib/formatters'

interface ContributionCompleteSummaryProps {
  totalAmount: number
  recordedCount: number
  skippedCount: number
  displayCurrency?: string
  onViewTransactions: () => void
  onClose: () => void
}

export function ContributionCompleteSummary({
  totalAmount,
  recordedCount,
  skippedCount,
  displayCurrency = 'USD',
  onViewTransactions,
  onClose,
}: ContributionCompleteSummaryProps) {
  return (
    <div className="text-center space-y-4">
      <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircleIcon className="w-8 h-8 text-green-600" />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          Aporte Registrado
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Has completado el registro de tu aporte mensual
        </p>
      </div>

      <div className="rounded-lg bg-gray-50 p-4">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">Monto total</dt>
            <dd className="font-medium text-gray-900">
              {formatCurrency(totalAmount.toFixed(2), displayCurrency)}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Transacciones</dt>
            <dd className="font-medium text-gray-900">
              {recordedCount} registradas
              {skippedCount > 0 && (
                <span className="text-gray-400"> ({skippedCount} omitidas)</span>
              )}
            </dd>
          </div>
        </dl>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onViewTransactions}
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Ver Transacciones
        </button>
        <button
          onClick={onClose}
          className="flex-1 rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}
```

### File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/features/contributions/hooks/usePendingContribution.ts` | CREATE | Hook for managing pending contribution state |
| `frontend/src/features/contributions/hooks/usePendingContribution.test.tsx` | CREATE | Hook tests |
| `frontend/src/features/contributions/components/ContributionFlowModal.tsx` | CREATE | Modal for guided transaction flow |
| `frontend/src/features/contributions/components/ContributionFlowModal.test.tsx` | CREATE | Modal tests |
| `frontend/src/features/contributions/components/ContributionCompleteSummary.tsx` | CREATE | Completion summary component |
| `frontend/src/features/contributions/components/ContributionCompleteSummary.test.tsx` | CREATE | Summary tests |
| `frontend/src/features/contributions/components/SuggestionActions.tsx` | MODIFY | Enable "Usar Sugerencia" button |
| `frontend/src/features/contributions/components/SuggestionActions.test.tsx` | MODIFY | Update tests for enabled button |
| `frontend/src/features/contributions/index.tsx` | MODIFY | Add modal trigger for contribution flow |
| `frontend/src/features/transactions/index.tsx` | MODIFY | Add pending contribution banner |
| `frontend/src/features/transactions/index.test.tsx` | MODIFY | Add tests for banner |
| `frontend/src/features/transactions/components/TransactionForm.tsx` | MODIFY | Add defaultValues, lockedAssetId, suggestedAmount props |
| `frontend/src/features/transactions/components/TransactionForm.test.tsx` | MODIFY | Add tests for new props |

### Architecture Compliance

- **Feature location:** All new components in `frontend/src/features/contributions/`
- **Hooks:** Custom hooks in `hooks/` subdirectory
- **Tests:** Co-located `*.test.tsx` files
- **State:** sessionStorage for cross-page persistence (no Zustand needed)
- **API calls:** Through existing `lib/api.ts` patterns
- **Styling:** Tailwind CSS with existing color patterns

### Previous Story Learnings (Story 10.2)

- `contribution-prefill` key in sessionStorage stores the pending data
- `ContributionAllocation` type has all fields needed for transaction creation
- `adjustedAllocation` is the final amount to invest (string decimal)
- SuggestionActions already saves to sessionStorage and navigates
- TransactionForm accepts `CreateTransactionFormData` and handles submission

### Code Patterns to Follow

From `CreateTransactionModal.tsx`:
- Use `useMutation` for API calls
- Invalidate `queryKeys.transactions.all` and `queryKeys.portfolio.all` after success
- Handle loading state with `isPending`

From `TransactionsPage`:
- Use `useAssets()` to get assets for form dropdown
- Handle error states with conditional rendering

### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Prefill expired (>24h) | Show "expired" message, offer to start fresh |
| Asset deleted after suggestion | Skip that asset with warning message |
| User navigates away mid-flow | Data persists in sessionStorage, can resume |
| User clears browser data | Contribution lost, start fresh |
| Zero remaining allocations | Show complete summary |
| All assets skipped | Show summary with 0 recorded, N skipped |

### Dependencies

**Requires (already done):**
- Story 10.1: Contribution Suggestion API (DONE)
- Story 10.2: Contribution Suggestion UI (DONE)
- Epic 4: Transaction Recording (DONE)

**Uses from existing code:**
- `TransactionForm` component (add new props)
- `CreateTransactionModal` patterns
- `usePendingContribution` hook (new)
- `api.transactions.create()` method

### References

- [Source: epics.md#Story 10.3] - Story requirements
- [Source: 10-2-contribution-suggestion-ui.md] - Previous story context
- [Source: contributions/components/SuggestionActions.tsx:27] - sessionStorage save
- [Source: transactions/index.tsx] - Transactions page structure
- [Source: transactions/components/CreateTransactionModal.tsx] - Transaction creation pattern
- [Source: transactions/components/TransactionForm.tsx] - Form component
- [Source: project-context.md#Frontend Patterns] - Component organization

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

