# Story 8.3: Fix Transaction Date Format Validation

Status: done

## Story

As a **user recording transactions**,
I want **the transaction form to correctly format the date before sending to the API**,
so that **my transactions are saved successfully without date validation errors**.

## Problem Description

El formulario de transacciones en el frontend usa un input `type="date"` que retorna fechas en formato `YYYY-MM-DD` (ej: `"2026-01-10"`), pero el backend espera formato ISO 8601 completo con timestamp (ej: `"2026-01-10T00:00:00.000Z"`). Esto causa errores de validación cuando el usuario intenta guardar una transacción.

**Error Observado:** "Invalid date format. Use ISO 8601 format." al intentar crear transacciones desde el formulario.

**Root Cause Analysis:**
1. **Frontend Form Default:** `TransactionForm.tsx:36` genera `new Date().toISOString().split('T')[0]` que produce `YYYY-MM-DD`
2. **HTML Date Input:** El input `type="date"` (línea 98) retorna `YYYY-MM-DD` por diseño del navegador
3. **Frontend Validation:** `frontend/src/validations/transaction.ts:8` solo valida `z.string().min(1)` - muy permisivo
4. **Backend Validation:** `backend/src/validations/transaction.ts:28` requiere `z.string().datetime()` - formato ISO 8601 completo
5. **Sin Conversión:** No hay lógica que convierta `YYYY-MM-DD` a ISO 8601 antes de enviar al API

## Acceptance Criteria

1. **Given** I am on the transaction form
   **When** I select a date using the date picker
   **Then** the form sends the date in ISO 8601 format to the API (e.g., `"2026-01-10T00:00:00.000Z"`)

2. **Given** I submit a transaction with a valid date
   **When** the API receives the request
   **Then** the date passes backend validation without errors

3. **Given** I create a transaction with today's date
   **When** I view the transaction in the history
   **Then** the date displays correctly in the local format (`dd/MM/yyyy`)

4. **Given** I use the date filter on transaction history
   **When** I select a date range
   **Then** the filter works correctly with the new date format

5. **Given** existing transactions in the database
   **When** I view the transaction history after the fix
   **Then** all dates display correctly (no regression)

## Tasks / Subtasks

- [x] Task 1: Update frontend form to convert date before submission (AC: #1, #2)
  - [x] 1.1 Modify `TransactionForm.tsx` onSubmit handler to convert `YYYY-MM-DD` to ISO 8601
  - [x] 1.2 Use `new Date(dateString + 'T00:00:00.000Z').toISOString()` for conversion
  - [x] 1.3 Update unit tests for TransactionForm to verify date conversion

- [x] Task 2: Update frontend validation schema for consistency (AC: #1)
  - [x] 2.1 Keep frontend schema permissive for form input (`YYYY-MM-DD` is valid for date picker)
  - [x] 2.2 Add comment explaining the conversion happens in onSubmit handler
  - [x] 2.3 Consider adding a `dateString` schema that accepts `YYYY-MM-DD` format

- [x] Task 3: Update useCreateTransaction hook to handle conversion (AC: #1, #2)
  - [x] 3.1 Review if conversion should happen in hook instead of form (Decision: keep in form per Dev Notes Option 1)
  - [x] 3.2 If in hook: transform date field before API call (N/A - conversion in form)
  - [x] 3.3 Add unit tests for date conversion in hook (N/A - covered by TransactionForm tests)

- [x] Task 4: Verify date filter handling (AC: #4)
  - [x] 4.1 Check TransactionFilters component date handling
  - [x] 4.2 Ensure filter dates are also converted to ISO 8601 if needed (Added transformFilters in useTransactions hook)
  - [x] 4.3 Test date range filtering works correctly (Added 2 new tests for date filter conversion)

- [x] Task 5: Test complete flow (AC: #1, #2, #3, #4, #5)
  - [x] 5.1 Test creating transaction with date picker (TransactionForm tests cover date conversion)
  - [x] 5.2 Test viewing transaction in history (displays correctly) (Existing tests pass)
  - [x] 5.3 Test date range filter on transaction list (New useTransactions tests verify ISO conversion)
  - [x] 5.4 Test existing transactions still display correctly (No regressions)
  - [x] 5.5 Run all existing transaction tests (no regressions) (Frontend: 463 pass, Backend: 542 pass)

## Dev Notes

### Current Implementation Analysis

**Frontend Form Default Value (TransactionForm.tsx:36):**
```typescript
date: new Date().toISOString().split('T')[0]  // Results in "YYYY-MM-DD"
```

**Frontend Validation (frontend/src/validations/transaction.ts:8):**
```typescript
date: z.string().min(1, 'Date is required')  // Very permissive
```

**Backend Validation (backend/src/validations/transaction.ts:28):**
```typescript
date: z.string().datetime({ message: 'Invalid date format. Use ISO 8601 format.' })
```

**The Mismatch:**
- Frontend sends: `"2026-01-10"` (YYYY-MM-DD from date input)
- Backend expects: `"2026-01-10T00:00:00.000Z"` (ISO 8601 datetime)

### Fix Implementation

**Option 1 (Recommended): Convert in Form onSubmit**

```typescript
// frontend/src/features/transactions/components/TransactionForm.tsx
const handleFormSubmit = (data: CreateTransactionFormData) => {
  // Convert YYYY-MM-DD to ISO 8601 format
  const isoDate = new Date(data.date + 'T00:00:00.000Z').toISOString()

  onSubmit({
    ...data,
    date: isoDate,
  })
}

// In JSX:
<form onSubmit={handleSubmit(handleFormSubmit)} ...>
```

**Option 2: Convert in useCreateTransaction Hook**

```typescript
// frontend/src/features/transactions/hooks/useTransactions.ts
export function useCreateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTransactionFormData) => {
      // Convert date before sending to API
      const payload = {
        ...data,
        date: new Date(data.date + 'T00:00:00.000Z').toISOString(),
      }
      return api.transactions.create(payload)
    },
    // ...
  })
}
```

**Option 3: Create a Date Transform Utility**

```typescript
// frontend/src/lib/dateUtils.ts
export function dateInputToISO(dateString: string): string {
  // Handle both YYYY-MM-DD and full ISO strings
  if (dateString.includes('T')) {
    return dateString // Already ISO format
  }
  return new Date(dateString + 'T00:00:00.000Z').toISOString()
}
```

### Architecture Compliance

- **Date/Time Format:** Architecture specifies ISO 8601 UTC for API (architecture.md:438-444)
- **Frontend Display:** Use `formatDate()` from `lib/formatters.ts` with Spanish locale
- **Validation:** Keep backend validation strict (ISO 8601), frontend can be permissive for UX
- **Conversion Layer:** Frontend is responsible for format conversion before API calls

### Files to Modify

| File | Change |
|------|--------|
| `frontend/src/features/transactions/components/TransactionForm.tsx` | Add date conversion in onSubmit |
| `frontend/src/features/transactions/components/TransactionForm.test.tsx` | Add tests for date conversion |
| `frontend/src/validations/transaction.ts` | Add comment about conversion |

### Files to Review (No Changes Expected)

| File | Review Purpose |
|------|----------------|
| `frontend/src/features/transactions/components/TransactionFilters.tsx` | Verify filter dates handled |
| `frontend/src/features/transactions/hooks/useTransactions.ts` | Verify no conflicting logic |
| `backend/src/validations/transaction.ts` | No changes - keep strict |
| `backend/src/services/transactionService.ts` | Verify date parsing works |

### Testing Approach

1. **Unit Tests (Frontend):**
   - Test `TransactionForm` submits ISO 8601 format
   - Test date conversion utility if created
   - Test form with various date inputs

2. **Integration Tests:**
   - Create transaction via UI -> verify saved correctly
   - View transaction -> verify displays correctly
   - Filter by date range -> verify works

### Previous Story Context

Story 8-2 (Fix Onboarding Detection) was completed successfully:
- Added `hasExistingData` field to onboarding status
- Backend logic enhanced to check asset count
- All 542 backend tests pass, all 460 frontend tests pass
- Pattern: Backend handles logic, frontend adapts to new response

This story follows similar pattern: frontend adapts to backend requirements.

### Project Context Reference

Ver `project-context.md` para:
- Date/Time handling patterns (ISO 8601 en API, `date-fns` en UI)
- Zod validation patterns
- React Hook Form + Zod integration
- Testing conventions (co-located tests)

### References

- [Source: Sprint Change Proposal - sprint-change-proposal-2026-01-11.md#Section 1 line 21]
- [Source: Architecture - architecture.md:438-444] - Date/Time Format specification
- [Source: Project Context - project-context.md#Date/Time Handling]
- [Source: frontend/src/features/transactions/components/TransactionForm.tsx:36] - Current default value
- [Source: frontend/src/features/transactions/components/TransactionForm.tsx:96-102] - Date input element
- [Source: frontend/src/validations/transaction.ts:8] - Permissive frontend validation
- [Source: backend/src/validations/transaction.ts:28] - Strict backend validation requiring ISO 8601
- [Source: Story 8-2 Completion Notes] - Previous story patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None - Implementation proceeded without blocking issues.

### Completion Notes List

- **Task 1**: Added `handleFormSubmit` wrapper in TransactionForm.tsx that converts `YYYY-MM-DD` to ISO 8601 (`2026-01-07T00:00:00.000Z`) before calling onSubmit. Added 2 new tests verifying date conversion.
- **Task 2**: Added explanatory comment to frontend validation schema explaining conversion happens in TransactionForm.handleFormSubmit.
- **Task 3**: Reviewed useCreateTransaction hook - conversion correctly happens in form per Dev Notes Option 1 recommendation.
- **Task 4**: Added `dateInputToISO` helper and `transformFilters` function in useTransactions hook to convert filter dates (fromDate, toDate) to ISO 8601. Added 2 new tests verifying filter date conversion.
- **Task 5**: All tests pass - Frontend: 463, Backend: 542. No regressions.

### File List

**Modified:**
- `frontend/src/features/transactions/components/TransactionForm.tsx` - Added handleFormSubmit with date conversion
- `frontend/src/features/transactions/components/TransactionForm.test.tsx` - Updated tests to expect ISO 8601 dates, added 2 new tests
- `frontend/src/validations/transaction.ts` - Added explanatory comment
- `frontend/src/features/transactions/hooks/useTransactions.ts` - Added dateInputToISO and transformFilters for filter date conversion
- `frontend/src/features/transactions/hooks/useTransactions.test.tsx` - Added 2 tests for filter date conversion

