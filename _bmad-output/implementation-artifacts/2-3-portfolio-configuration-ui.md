# Story 2.3: Portfolio Configuration UI

Status: completed

## Story

As a **user**,
I want **a visual interface to manage my assets and targets**,
so that **I can easily configure my investment strategy**.

## Acceptance Criteria

1. **Given** I am on the portfolio configuration page, **When** the page loads, **Then** I see a list of all my assets with their current targets

2. **Given** I click "Add Asset", **When** I fill the form with ticker, name, category and target, **Then** the asset is created and appears in the list

3. **Given** I click edit on an asset, **When** I modify the data and save, **Then** the asset is updated in the list

4. **Given** I click delete on an asset, **When** I confirm the deletion, **Then** the asset is removed from the list

5. **Given** I am editing targets, **When** targets don't sum to 100%, **Then** I see a real-time indicator showing the current sum and the difference

6. **Given** targets sum to 100%, **When** I view the target editor, **Then** I see a green checkmark confirming valid configuration

## Tasks / Subtasks

- [x] Task 1: Extend API Client for Assets (AC: #1, #2, #3, #4)
  - [x] Add Asset types to `frontend/src/types/api.ts`
  - [x] Add `api.assets` methods in `frontend/src/lib/api.ts` (list, create, update, delete, batchUpdateTargets)
  - [x] Add tests for new API methods

- [x] Task 2: Create Portfolio Feature Module Structure (AC: #1)
  - [x] Create `frontend/src/features/portfolio/` directory structure
  - [x] Create `index.tsx` as Portfolio page entry point
  - [x] Add route to `router.tsx` for `/portfolio`
  - [x] Add navigation link in Layout component

- [x] Task 3: Asset List Component (AC: #1)
  - [x] Create `AssetList.tsx` component with TanStack Query for data fetching
  - [x] Display ticker, name, category, targetPercentage for each asset
  - [x] Add loading and error states
  - [x] Add empty state message when no assets exist
  - [x] Add tests for AssetList component

- [x] Task 4: Target Sum Indicator Component (AC: #5, #6)
  - [x] Create `TargetSumIndicator.tsx` component
  - [x] Calculate sum from asset list in real-time
  - [x] Display current sum with color coding (red <100, green =100, red >100)
  - [x] Show difference from 100% (e.g., "-10%" or "+5%")
  - [x] Display green checkmark when sum is exactly 100%
  - [x] Add tests for TargetSumIndicator component

- [x] Task 5: Asset Form Component for Create/Edit (AC: #2, #3)
  - [x] Create `AssetForm.tsx` with React Hook Form + Zod validation
  - [x] Fields: ticker (uppercase, required), name (required), category (dropdown), targetPercentage (0-100)
  - [x] Reuse form for both create (empty) and edit (prefilled) modes
  - [x] Add validation messages for each field
  - [x] Add loading state during submission
  - [x] Add tests for AssetForm component

- [x] Task 6: Asset Card Component with Actions (AC: #3, #4)
  - [x] Create `AssetCard.tsx` to display individual asset
  - [x] Add edit button (pencil icon) triggering form modal
  - [x] Add delete button (trash icon) with confirmation dialog
  - [x] Visual distinction by category (different colors/badges)
  - [x] Add tests for AssetCard component

- [x] Task 7: Create Asset Modal (AC: #2)
  - [x] Create modal/dialog for adding new asset
  - [x] Use AssetForm in create mode
  - [x] On success, close modal and refetch asset list (invalidate query)
  - [x] Show error message on failure
  - [x] Add tests for create flow

- [x] Task 8: Edit Asset Modal (AC: #3)
  - [x] Create modal/dialog for editing existing asset
  - [x] Use AssetForm in edit mode with prefilled data
  - [x] On success, close modal and refetch asset list
  - [x] Show error message on failure
  - [x] Add tests for edit flow

- [x] Task 9: Delete Asset Confirmation (AC: #4)
  - [x] Create confirmation dialog component
  - [x] Show asset ticker/name in confirmation message
  - [x] Warn about data loss (transactions, holdings)
  - [x] On confirm, call delete API and refetch list
  - [x] Show loading state during deletion
  - [x] Add tests for delete flow

- [x] Task 10: Target Editor Mode (AC: #5, #6)
  - [x] Create `TargetEditor.tsx` for batch editing targets
  - [x] Display all assets with editable target inputs
  - [x] Real-time sum calculation with TargetSumIndicator
  - [x] Save button enabled only when sum = 100%
  - [x] Use batch update endpoint for atomic save
  - [x] Add tests for TargetEditor component

- [x] Task 11: Integration Testing
  - [x] Test full CRUD flow with mocked API
  - [x] Test target validation prevents save when sum != 100%
  - [x] Test error handling for API failures
  - [x] Integrated all components in PortfolioPage

- [x] Task 12: UX Improvements (User Feedback)
  - [x] Remove targetPercentage field from AssetForm (create/edit) - targets only editable via TargetEditor
  - [x] Update AssetForm tests to reflect removed field
  - [x] Add warning message in TargetEditor when sum != 100%
  - [x] Update AssetCard to show name more prominently than ticker

- [x] Task 13: Allow Target Sum < 100% (User Requested)
  - [x] Backend: Remove sum=100% validation from batchUpdateTargets endpoint (now allows sum <= 100%)
  - [x] Backend: Update tests to allow sum < 100%
  - [x] Frontend: Enable Save button when sum <= 100% (warn but allow)
  - [x] Frontend: Update TargetEditor tests to reflect new behavior
  - [x] Frontend: Update integration tests

## Dev Notes

### Critical Architecture Patterns

**IMPORTANT - This is a Frontend Story:**
This story implements the UI for portfolio configuration, building on the backend API completed in Stories 2.1 and 2.2. The backend already provides:
- `GET /api/assets` - List all user assets
- `POST /api/assets` - Create new asset
- `PUT /api/assets/:id` - Update asset (including targetPercentage)
- `DELETE /api/assets/:id` - Delete asset
- `PUT /api/assets/targets` - Batch update targets (atomic)

**Frontend Stack (from Architecture):**
- React 19 with TypeScript strict mode
- Vite 7.x for build tooling
- TanStack Query v5 for server state (fetching, caching, mutations)
- Zustand for client state (if needed, but prefer TanStack Query for server data)
- React Hook Form + Zod for form handling and validation
- Tailwind CSS + Shadcn/ui for styling and components
- Vitest for testing

### API Client Extension

```typescript
// frontend/src/types/api.ts (additions)

export type AssetCategory = 'ETF' | 'FCI' | 'CRYPTO' | 'CASH'

export interface Asset {
  id: string
  ticker: string
  name: string
  category: AssetCategory
  targetPercentage: string  // Decimal from Prisma comes as string
  createdAt: string
  updatedAt: string
  userId: string
}

export interface CreateAssetInput {
  ticker: string
  name: string
  category: AssetCategory
  targetPercentage?: number
}

export interface UpdateAssetInput {
  ticker?: string
  name?: string
  category?: AssetCategory
  targetPercentage?: number
}

export interface BatchUpdateTargetsInput {
  targets: Array<{
    assetId: string
    targetPercentage: number
  }>
}
```

```typescript
// frontend/src/lib/api.ts (additions)

import type { Asset, CreateAssetInput, UpdateAssetInput, BatchUpdateTargetsInput } from '@/types/api'

// Add to api object:
assets: {
  list: async (): Promise<Asset[]> => {
    const res = await fetch(`${API_URL}/assets`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    return handleResponse<Asset[]>(res)
  },

  create: async (input: CreateAssetInput): Promise<Asset> => {
    const res = await fetch(`${API_URL}/assets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(input),
    })
    return handleResponse<Asset>(res)
  },

  update: async (id: string, input: UpdateAssetInput): Promise<Asset> => {
    const res = await fetch(`${API_URL}/assets/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(input),
    })
    return handleResponse<Asset>(res)
  },

  delete: async (id: string): Promise<void> => {
    const res = await fetch(`${API_URL}/assets/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    if (!res.ok) {
      const json = await res.json()
      throw new ApiError(json.error, json.message, json.details)
    }
    // DELETE returns 204 No Content
  },

  batchUpdateTargets: async (input: BatchUpdateTargetsInput): Promise<Asset[]> => {
    const res = await fetch(`${API_URL}/assets/targets`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(input),
    })
    return handleResponse<Asset[]>(res)
  },
},
```

### Component Structure

```
frontend/src/features/portfolio/
├── index.tsx                 # Portfolio page (entry point)
├── components/
│   ├── AssetList.tsx         # List of assets with TanStack Query
│   ├── AssetList.test.tsx
│   ├── AssetCard.tsx         # Individual asset display with actions
│   ├── AssetCard.test.tsx
│   ├── AssetForm.tsx         # Create/Edit form with RHF + Zod
│   ├── AssetForm.test.tsx
│   ├── TargetEditor.tsx      # Batch target editing interface
│   ├── TargetEditor.test.tsx
│   ├── TargetSumIndicator.tsx # Real-time target sum display
│   └── TargetSumIndicator.test.tsx
└── hooks/
    ├── useAssets.ts          # TanStack Query hooks for assets
    └── useAssets.test.tsx
```

### TanStack Query Hooks Pattern

```typescript
// frontend/src/features/portfolio/hooks/useAssets.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import type { CreateAssetInput, UpdateAssetInput, BatchUpdateTargetsInput } from '@/types/api'

export function useAssets() {
  return useQuery({
    queryKey: queryKeys.assets.list(),
    queryFn: () => api.assets.list(),
  })
}

export function useCreateAsset() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (input: CreateAssetInput) => api.assets.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all })
    },
  })
}

export function useUpdateAsset() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAssetInput }) => 
      api.assets.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all })
    },
  })
}

export function useDeleteAsset() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => api.assets.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all })
    },
  })
}

export function useBatchUpdateTargets() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (input: BatchUpdateTargetsInput) => api.assets.batchUpdateTargets(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all })
    },
  })
}
```

### Zod Validation Schema (Frontend)

```typescript
// frontend/src/validations/asset.ts

import { z } from 'zod'

export const assetCategorySchema = z.enum(['ETF', 'FCI', 'CRYPTO', 'CASH'])

export const createAssetSchema = z.object({
  ticker: z.string()
    .trim()
    .min(1, 'Ticker is required')
    .max(20, 'Ticker must be 20 characters or less')
    .transform(val => val.toUpperCase()),
  name: z.string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  category: assetCategorySchema,
  targetPercentage: z.coerce.number()
    .min(0, 'Target must be at least 0%')
    .max(100, 'Target cannot exceed 100%')
    .optional()
    .default(0),
})

export const updateAssetSchema = createAssetSchema.partial()

export type CreateAssetFormData = z.infer<typeof createAssetSchema>
export type UpdateAssetFormData = z.infer<typeof updateAssetSchema>
```

### UI Component Patterns

**Asset Card Layout:**
```
┌─────────────────────────────────────────────────────┐
│ [ETF Badge]  VOO                          [⚙️] [🗑️] │
│ Vanguard S&P 500 ETF                                │
│ Target: 60%                                         │
└─────────────────────────────────────────────────────┘
```

**Target Sum Indicator States:**
```
[❌ Sum: 90% (-10%)]  // Red, below 100
[✅ Sum: 100%]        // Green, exactly 100
[❌ Sum: 115% (+15%)] // Red, above 100
```

**Category Badge Colors (Tailwind):**
- ETF: `bg-blue-100 text-blue-800`
- FCI: `bg-green-100 text-green-800`
- CRYPTO: `bg-orange-100 text-orange-800`
- CASH: `bg-gray-100 text-gray-800`

### Shadcn/ui Components to Use

Based on the architecture and story requirements, use these Shadcn components:
- `Card` - For AssetCard layout
- `Button` - Actions (Add, Edit, Delete, Save)
- `Dialog` / `AlertDialog` - Modals for create/edit/delete
- `Form` - With React Hook Form integration
- `Input` - Text fields
- `Select` - Category dropdown
- `Badge` - Category indicators
- `Toast` / `Sonner` - Success/error notifications
- `Table` - Asset list (alternative to cards)

**Installation (if not already installed):**
```bash
npx shadcn@latest add card button dialog alert-dialog form input select badge sonner table
```

### Real-Time Target Sum Calculation

```typescript
// frontend/src/features/portfolio/components/TargetSumIndicator.tsx

interface Props {
  assets: Asset[]
  pendingChanges?: Map<string, number>  // For local edits before save
}

export function TargetSumIndicator({ assets, pendingChanges }: Props) {
  const sum = assets.reduce((acc, asset) => {
    const target = pendingChanges?.get(asset.id) ?? Number(asset.targetPercentage)
    return acc + target
  }, 0)

  const roundedSum = Math.round(sum * 100) / 100
  const difference = roundedSum - 100
  const isValid = roundedSum === 100

  return (
    <div className={cn(
      'flex items-center gap-2 text-sm font-medium',
      isValid ? 'text-green-600' : 'text-red-600'
    )}>
      {isValid ? (
        <CheckCircle className="h-4 w-4" />
      ) : (
        <XCircle className="h-4 w-4" />
      )}
      <span>Sum: {roundedSum}%</span>
      {!isValid && (
        <span className="text-muted-foreground">
          ({difference > 0 ? '+' : ''}{difference}%)
        </span>
      )}
    </div>
  )
}
```

### Delete Confirmation Dialog

```typescript
// Use AlertDialog from Shadcn for delete confirmation
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive" size="icon">
      <Trash2 className="h-4 w-4" />
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete {asset.ticker}?</AlertDialogTitle>
      <AlertDialogDescription>
        This will permanently delete the asset "{asset.name}" and all associated data.
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Project Structure Notes

**Files to create:**
```
frontend/src/
├── features/
│   └── portfolio/
│       ├── index.tsx
│       ├── components/
│       │   ├── AssetList.tsx
│       │   ├── AssetList.test.tsx
│       │   ├── AssetCard.tsx
│       │   ├── AssetCard.test.tsx
│       │   ├── AssetForm.tsx
│       │   ├── AssetForm.test.tsx
│       │   ├── TargetEditor.tsx
│       │   ├── TargetEditor.test.tsx
│       │   ├── TargetSumIndicator.tsx
│       │   └── TargetSumIndicator.test.tsx
│       └── hooks/
│           ├── useAssets.ts
│           └── useAssets.test.tsx
├── validations/
│   └── asset.ts              # Add Zod schemas
└── types/
    └── api.ts                # Add Asset types
```

**Files to modify:**
```
frontend/src/
├── lib/
│   ├── api.ts                # Add assets methods
│   └── queryKeys.ts          # Already has assets keys (verify)
├── router.tsx                # Add /portfolio route
└── components/
    └── layout/
        └── Layout.tsx        # Add Portfolio nav link
```

### Testing Strategy

**Component Tests (Vitest + Testing Library):**
- AssetList: renders loading, error, empty, and data states
- AssetCard: displays asset info, triggers edit/delete actions
- AssetForm: validates inputs, submits correctly
- TargetSumIndicator: calculates and displays correct sum/state
- TargetEditor: manages local state, enables/disables save button

**Mock API Setup:**
```typescript
// Use MSW or vi.mock for API mocking
vi.mock('@/lib/api', () => ({
  api: {
    assets: {
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      batchUpdateTargets: vi.fn(),
    },
  },
}))
```

**Test Cases to Cover:**
1. List loads and displays assets correctly
2. Create form validates required fields
3. Create form submits and refreshes list
4. Edit form prefills with existing data
5. Edit form updates and refreshes list
6. Delete shows confirmation dialog
7. Delete removes asset and refreshes list
8. Target sum indicator shows correct values
9. Target editor enables save only when sum = 100%
10. Error handling shows appropriate messages

### Previous Story Intelligence

**From Story 2.2 Implementation:**
- Backend returns `targetPercentage` as Prisma Decimal (string in JSON)
- Batch update endpoint: `PUT /api/assets/targets` with `{ targets: [...] }`
- Target validation: sum must equal exactly 100%
- Error response includes `{ sum, difference }` in details
- Tests use Vitest with 141 passing tests

**From Story 2.1 Implementation:**
- Asset CRUD fully functional
- Categories: ETF, FCI, CRYPTO, CASH
- Ticker must be unique per user
- All endpoints require authentication

**Frontend Patterns from Epic 1:**
- Auth store uses Zustand with persistence
- API client uses fetch with `handleResponse` helper
- TanStack Query for server state
- Vitest + Testing Library for component tests
- Path aliases: `@/` for `src/`

### Git Intelligence

**Recent Commits (Story 2.2):**
- Target validation added to asset service
- Batch update endpoint with atomic transactions
- Decimal handling with rounding to 2 places
- Comprehensive test coverage

**Files Modified in 2.2:**
- `backend/src/validations/asset.ts`
- `backend/src/services/assetService.ts`
- `backend/src/routes/assets.ts`

### Important Implementation Notes

1. **Decimal to Number:** Backend returns `targetPercentage` as string (Prisma Decimal). Convert with `Number(asset.targetPercentage)` in frontend.

2. **Form Default Values:** When editing, convert Decimal string to number for form default values.

3. **Toast Notifications:** Use Sonner for success/error toasts. Install if not present.

4. **Error Handling:** API returns structured errors. Display user-friendly messages.

5. **Query Invalidation:** Always invalidate `queryKeys.assets.all` after mutations.

6. **Loading States:** Show skeleton/spinner while loading. Disable buttons during mutations.

7. **Optimistic Updates (Optional):** Consider for better UX, but start with query invalidation.

8. **Form Reset:** Reset form after successful submission. Close modal.

9. **Accessibility:** Use proper ARIA labels, focus management in modals.

10. **Responsive Design:** Cards should stack on mobile, grid on desktop.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.3-Portfolio-Configuration-UI]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend-Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Component-Organization]
- [Source: _bmad-output/planning-artifacts/prd.md#FR1-FR6]
- [Source: _bmad-output/project-context.md#Frontend-Patterns]
- [Source: _bmad-output/implementation-artifacts/2-1-asset-crud-api-database-model.md]
- [Source: _bmad-output/implementation-artifacts/2-2-target-percentage-assignment-validation.md]
- [Source: frontend/src/lib/api.ts]
- [Source: frontend/src/lib/queryKeys.ts]
- [Source: frontend/src/types/api.ts]

## Dev Agent Record

### Agent Model Used

Claude 4 Sonnet (Anthropic)

### Debug Log References

### Completion Notes List

- **Task 1 (2026-01-07):** Extended API client with Asset types and methods
  - Added `AssetCategory`, `Asset`, `CreateAssetInput`, `UpdateAssetInput`, `BatchUpdateTargetsInput` types to `frontend/src/types/api.ts`
  - Added `api.assets` methods: `list`, `create`, `update`, `delete`, `batchUpdateTargets` to `frontend/src/lib/api.ts`
  - Added comprehensive tests for all asset API methods (14 new test cases)
  - All 20 tests passing, typecheck clean, lint clean

- **Task 2 (2026-01-07):** Created Portfolio feature module structure
  - Created `frontend/src/features/portfolio/` directory with components/ and hooks/ subdirs
  - Created `PortfolioPage` component as entry point
  - Added `/portfolio` route to router.tsx
  - Added navigation links (Dashboard, Portfolio) to Layout component with NavLink active states
  - All 40 tests passing, typecheck clean, lint clean

- **Task 3 (2026-01-07):** Created AssetList component
  - Created `useAssets` hook with TanStack Query (list, create, update, delete, batchUpdateTargets)
  - Created `AssetList.tsx` with table display of assets (ticker, name, category badge, target %)
  - Implemented loading skeleton, empty state, and error state
  - Category badges with distinct colors (ETF=blue, FCI=green, CRYPTO=orange, CASH=gray)
  - Added 6 comprehensive tests for AssetList component
  - All 46 tests passing, typecheck clean, lint clean

- **Task 4 (2026-01-07):** Created TargetSumIndicator component
  - Real-time sum calculation with support for pending local changes
  - Color coding: green when sum=100%, red otherwise
  - Shows difference from 100% with +/- prefix
  - SVG icons for checkmark (valid) and X (invalid)
  - Accessible with role="status" and aria-live="polite"
  - 8 comprehensive tests covering all scenarios
  - All 54 tests passing, typecheck clean, lint clean

- **Task 5 (2026-01-07):** Created AssetForm component
  - React Hook Form + Zod validation for type-safe forms
  - Fields: ticker (uppercase transform), name, category dropdown, targetPercentage
  - Dual mode: create (empty form) and edit (prefilled from asset prop)
  - Validation messages for required fields and constraints
  - Loading state with spinner during submission
  - 14 comprehensive tests covering create, edit, validation, and UI states
  - All 68 tests passing, typecheck clean, lint clean

- **Task 6 (2026-01-07):** Created AssetCard component
  - Card display with ticker, name, category badge, and target percentage
  - Edit button (pencil icon) with aria-label for accessibility
  - Delete button (trash icon) with hover state (red)
  - Category-specific badge colors (ETF=blue, FCI=green, CRYPTO=orange, CASH=gray)
  - Hover shadow effect for interactivity
  - 12 comprehensive tests covering display, actions, and category styles
  - All 80 tests passing, typecheck clean, lint clean

- **Tasks 7, 8, 9 (2026-01-07):** Created modal system for CRUD operations
  - Created reusable `Modal` and `ConfirmDialog` base components
  - `CreateAssetModal`: Opens form in create mode, handles success/error states
  - `EditAssetModal`: Opens form prefilled with asset data, handles updates
  - `DeleteAssetDialog`: Confirmation with warning about data loss, loading state
  - All modals close on ESC key, overlay click, and prevent close during loading
  - 18 comprehensive tests for modal flows (5 create + 6 edit + 7 delete)
  - All 98 tests passing, typecheck clean, lint clean

- **Task 10 (2026-01-07):** Created TargetEditor component
  - Batch editing of target percentages for all assets
  - Real-time sum calculation with TargetSumIndicator integration
  - Save button disabled when sum != 100% OR no changes made
  - Uses batch update endpoint for atomic save
  - Error handling with message display
  - Loading state during save operation
  - 10 comprehensive tests covering all scenarios
  - All 108 tests passing, typecheck clean, lint clean

- **Task 11 (2026-01-07):** Integration testing and PortfolioPage assembly
  - Fully integrated PortfolioPage with all components
  - Asset cards grid with responsive layout (1/2/3 columns)
  - Add Asset button in header, Edit Targets link for batch editing
  - Loading, error, and empty states handled
  - Target sum indicator in header showing allocation status
  - 15 comprehensive integration tests covering:
    - Initial load states (loading, error, empty, data)
    - Full CRUD flows (create, edit, delete)
    - Target editor with validation
    - Error handling for API failures
  - All 123 tests passing, typecheck clean, lint clean

### File List

- `frontend/src/types/api.ts` (modified) - Added Asset types
- `frontend/src/lib/api.ts` (modified) - Added api.assets methods
- `frontend/src/lib/api.test.ts` (modified) - Added tests for asset API methods
- `frontend/src/features/portfolio/index.tsx` (new) - Portfolio page entry point
- `frontend/src/features/portfolio/components/` (new) - Components directory
- `frontend/src/features/portfolio/hooks/` (new) - Hooks directory
- `frontend/src/router.tsx` (modified) - Added /portfolio route
- `frontend/src/components/layout/Layout.tsx` (modified) - Added navigation links
- `frontend/src/features/portfolio/hooks/useAssets.ts` (new) - TanStack Query hooks for assets
- `frontend/src/features/portfolio/components/AssetList.tsx` (new) - Asset list component
- `frontend/src/features/portfolio/components/AssetList.test.tsx` (new) - Tests for AssetList
- `frontend/src/features/portfolio/index.tsx` (modified) - Integrated AssetList component
- `frontend/src/features/portfolio/components/TargetSumIndicator.tsx` (new) - Target sum indicator
- `frontend/src/features/portfolio/components/TargetSumIndicator.test.tsx` (new) - Tests for indicator
- `frontend/src/validations/asset.ts` (new) - Zod validation schemas for assets
- `frontend/src/features/portfolio/components/AssetForm.tsx` (new) - Create/Edit form component
- `frontend/src/features/portfolio/components/AssetForm.test.tsx` (new) - Tests for AssetForm
- `frontend/src/features/portfolio/components/AssetCard.tsx` (new) - Asset card with actions
- `frontend/src/features/portfolio/components/AssetCard.test.tsx` (new) - Tests for AssetCard
- `frontend/src/components/common/Modal.tsx` (new) - Reusable modal component
- `frontend/src/components/common/ConfirmDialog.tsx` (new) - Confirmation dialog component
- `frontend/src/features/portfolio/components/CreateAssetModal.tsx` (new) - Create asset modal
- `frontend/src/features/portfolio/components/CreateAssetModal.test.tsx` (new) - Tests for create modal
- `frontend/src/features/portfolio/components/EditAssetModal.tsx` (new) - Edit asset modal
- `frontend/src/features/portfolio/components/EditAssetModal.test.tsx` (new) - Tests for edit modal
- `frontend/src/features/portfolio/components/DeleteAssetDialog.tsx` (new) - Delete confirmation dialog
- `frontend/src/features/portfolio/components/DeleteAssetDialog.test.tsx` (new) - Tests for delete dialog
- `frontend/src/features/portfolio/components/TargetEditor.tsx` (new) - Target editor component
- `frontend/src/features/portfolio/components/TargetEditor.test.tsx` (new) - Tests for TargetEditor
- `frontend/src/features/portfolio/index.tsx` (modified) - Full page integration with all components
- `frontend/src/features/portfolio/index.test.tsx` (new) - Integration tests for PortfolioPage

- **Task 12 (2026-01-08):** UX Improvements
  - Removed `targetPercentage` from AssetForm schema - targets are now managed exclusively via TargetEditor
  - Updated AssetCard to show name more prominently (larger font) than ticker
  - Added warning message in TargetEditor when sum != 100%
  - Updated all affected tests (AssetForm, CreateAssetModal, PortfolioPage integration)
  - All 122 tests passing, typecheck clean, lint clean

### Story Completion Summary

**Story 2.3: Portfolio Configuration UI is COMPLETE**

All 12 tasks implemented:
1. ✅ API Client extended with Asset types and methods
2. ✅ Portfolio feature module structure created
3. ✅ AssetList component with loading/error/empty states
4. ✅ TargetSumIndicator with real-time calculation
5. ✅ AssetForm with React Hook Form + Zod validation
6. ✅ AssetCard with edit/delete actions
7. ✅ CreateAssetModal for adding new assets
8. ✅ EditAssetModal for updating assets
9. ✅ DeleteAssetDialog with confirmation
10. ✅ TargetEditor for batch target editing
11. ✅ Integration testing (15 tests)
12. ✅ UX improvements (name prominence, warning messages)

**Test Coverage:** 122 frontend tests passing
**Quality:** TypeScript strict mode, ESLint clean
