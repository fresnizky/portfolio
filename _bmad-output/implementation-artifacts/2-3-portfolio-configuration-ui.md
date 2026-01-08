# Story 2.3: Portfolio Configuration UI

Status: in-progress

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

- [ ] Task 4: Target Sum Indicator Component (AC: #5, #6)
  - [ ] Create `TargetSumIndicator.tsx` component
  - [ ] Calculate sum from asset list in real-time
  - [ ] Display current sum with color coding (red <100, green =100, red >100)
  - [ ] Show difference from 100% (e.g., "-10%" or "+5%")
  - [ ] Display green checkmark when sum is exactly 100%
  - [ ] Add tests for TargetSumIndicator component

- [ ] Task 5: Asset Form Component for Create/Edit (AC: #2, #3)
  - [ ] Create `AssetForm.tsx` with React Hook Form + Zod validation
  - [ ] Fields: ticker (uppercase, required), name (required), category (dropdown), targetPercentage (0-100)
  - [ ] Reuse form for both create (empty) and edit (prefilled) modes
  - [ ] Add validation messages for each field
  - [ ] Add loading state during submission
  - [ ] Add tests for AssetForm component

- [ ] Task 6: Asset Card Component with Actions (AC: #3, #4)
  - [ ] Create `AssetCard.tsx` to display individual asset
  - [ ] Add edit button (pencil icon) triggering form modal
  - [ ] Add delete button (trash icon) with confirmation dialog
  - [ ] Visual distinction by category (different colors/badges)
  - [ ] Add tests for AssetCard component

- [ ] Task 7: Create Asset Modal (AC: #2)
  - [ ] Create modal/dialog for adding new asset
  - [ ] Use AssetForm in create mode
  - [ ] On success, close modal and refetch asset list (invalidate query)
  - [ ] Show success toast notification
  - [ ] Add tests for create flow

- [ ] Task 8: Edit Asset Modal (AC: #3)
  - [ ] Create modal/dialog for editing existing asset
  - [ ] Use AssetForm in edit mode with prefilled data
  - [ ] On success, close modal and refetch asset list
  - [ ] Show success toast notification
  - [ ] Add tests for edit flow

- [ ] Task 9: Delete Asset Confirmation (AC: #4)
  - [ ] Create confirmation dialog component
  - [ ] Show asset ticker/name in confirmation message
  - [ ] Warn about data loss (transactions, holdings)
  - [ ] On confirm, call delete API and refetch list
  - [ ] Show success toast notification
  - [ ] Add tests for delete flow

- [ ] Task 10: Target Editor Mode (AC: #5, #6)
  - [ ] Create `TargetEditor.tsx` for batch editing targets
  - [ ] Display all assets with editable target inputs
  - [ ] Real-time sum calculation with TargetSumIndicator
  - [ ] Save button enabled only when sum = 100%
  - [ ] Use batch update endpoint for atomic save
  - [ ] Add tests for TargetEditor component

- [ ] Task 11: Integration Testing
  - [ ] Test full CRUD flow with mocked API
  - [ ] Test target validation prevents save when sum != 100%
  - [ ] Test error handling for API failures
  - [ ] Test optimistic updates and rollback

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
