# Story 6.3: Onboarding Wizard

Status: ready-for-dev

## Story

As a **new user**,
I want **a guided setup process to configure my portfolio**,
So that **I can get started quickly without confusion**.

## Acceptance Criteria

1. **Given** I am a new user with no assets configured, **When** I log in for the first time, **Then** I am redirected to the onboarding wizard

2. **Given** I am on step 1 of onboarding, **When** I add my first asset with ticker, name, category, **Then** I can add more assets or proceed to step 2

3. **Given** I am on step 2 of onboarding, **When** I assign target percentages to each asset, **Then** I see real-time validation that targets sum to 100% **And** I cannot proceed until targets are valid

4. **Given** I am on step 3 of onboarding, **When** I enter current holdings (quantities) for each asset, **Then** I can optionally enter current prices

5. **Given** I complete all onboarding steps, **When** I click "Finish Setup", **Then** I am redirected to the dashboard with my configured portfolio **And** a flag is set so I don't see onboarding again

6. **Given** I want to skip onboarding, **When** I click "Skip for now", **Then** I can access the app but see a reminder to complete setup

## Tasks / Subtasks

- [ ] Task 1: Backend - Add onboarding status to User model (AC: #1, #5, #6)
  - [ ] Add `onboardingCompleted` boolean field to User model in Prisma schema
  - [ ] Add `onboardingSkipped` boolean field for skip tracking
  - [ ] Create migration: `npx prisma migrate dev --name add_onboarding_status`
  - [ ] Create `backend/src/routes/onboarding.ts` with status endpoints
  - [ ] Add `GET /api/onboarding/status` endpoint
  - [ ] Add `POST /api/onboarding/complete` endpoint
  - [ ] Add `POST /api/onboarding/skip` endpoint
  - [ ] Create `backend/src/services/onboardingService.ts`
  - [ ] Write tests for onboarding service and routes

- [ ] Task 2: Backend - Add batch asset creation endpoint (AC: #2)
  - [ ] Add `POST /api/assets/batch` to `backend/src/routes/assets.ts`
  - [ ] Validate all assets in batch before creating any
  - [ ] Return created assets array
  - [ ] Write tests for batch endpoint

- [ ] Task 3: Backend - Add batch target update endpoint (AC: #3)
  - [ ] Add `PUT /api/assets/targets/batch` to `backend/src/routes/assets.ts`
  - [ ] Validate targets sum to 100% before updating
  - [ ] Update all targets atomically in transaction
  - [ ] Write tests for batch target endpoint

- [ ] Task 4: Backend - Add batch holdings/prices endpoint (AC: #4)
  - [ ] Add `POST /api/holdings/batch` to `backend/src/routes/holdings.ts`
  - [ ] Support optional price per holding
  - [ ] Create/update holdings and prices in single transaction
  - [ ] Write tests for batch holdings endpoint

- [ ] Task 5: Frontend - Add onboarding types and API methods (AC: all)
  - [ ] Add `OnboardingStatus` type to `frontend/src/types/api.ts`
  - [ ] Add `BatchAssetCreate`, `BatchTargetUpdate`, `BatchHoldingCreate` types
  - [ ] Add onboarding API methods to `frontend/src/lib/api.ts`
  - [ ] Add query keys for onboarding status
  - [ ] Write tests for API methods

- [ ] Task 6: Frontend - Create useOnboarding hook (AC: #1, #5, #6)
  - [ ] Create `frontend/src/features/onboarding/hooks/useOnboarding.ts`
  - [ ] Track current step (1-3)
  - [ ] Track form data for each step (assets, targets, holdings)
  - [ ] Handle complete and skip actions
  - [ ] Write tests for hook

- [ ] Task 7: Frontend - Create OnboardingLayout component (AC: all)
  - [ ] Create `frontend/src/features/onboarding/components/OnboardingLayout.tsx`
  - [ ] Progress indicator showing steps 1-2-3
  - [ ] Title and description for each step
  - [ ] Navigation buttons (Back, Next/Finish, Skip)
  - [ ] Write tests

- [ ] Task 8: Frontend - Create Step1AssetSetup component (AC: #2)
  - [ ] Create `frontend/src/features/onboarding/components/Step1AssetSetup.tsx`
  - [ ] Form to add asset: ticker (uppercase), name, category dropdown (ETF/FCI/Crypto/Cash)
  - [ ] List of added assets with delete option
  - [ ] "Add Asset" button to add to local list
  - [ ] Minimum 1 asset required to proceed
  - [ ] Write tests

- [ ] Task 9: Frontend - Create Step2TargetSetup component (AC: #3)
  - [ ] Create `frontend/src/features/onboarding/components/Step2TargetSetup.tsx`
  - [ ] Display all assets with target percentage input
  - [ ] Real-time sum indicator (e.g., "Total: 85% - Faltan 15%")
  - [ ] Color-coded validation: red if != 100%, green if == 100%
  - [ ] Cannot proceed if sum != 100%
  - [ ] Write tests

- [ ] Task 10: Frontend - Create Step3HoldingsSetup component (AC: #4)
  - [ ] Create `frontend/src/features/onboarding/components/Step3HoldingsSetup.tsx`
  - [ ] Display all assets with quantity input and optional price input
  - [ ] Default quantity to 0
  - [ ] Price field marked as optional
  - [ ] Calculate and display total portfolio value if prices entered
  - [ ] Write tests

- [ ] Task 11: Frontend - Create OnboardingWizard page (AC: all)
  - [ ] Create `frontend/src/features/onboarding/index.tsx`
  - [ ] Compose OnboardingLayout with step components
  - [ ] Handle step navigation and validation
  - [ ] Call batch APIs on finish (assets -> targets -> holdings)
  - [ ] Handle success: mark complete, redirect to dashboard
  - [ ] Handle skip: mark skipped, redirect to dashboard with reminder
  - [ ] Write tests for full wizard flow

- [ ] Task 12: Frontend - Add onboarding redirect logic (AC: #1, #6)
  - [ ] Modify `frontend/src/features/auth/hooks/useAuth.ts` to check onboarding status
  - [ ] Modify `frontend/src/router.tsx` to redirect new users to `/onboarding`
  - [ ] Add `/onboarding` route
  - [ ] Show "Complete setup" banner in Layout when onboardingSkipped is true
  - [ ] Write tests for redirect logic

- [ ] Task 13: Run all tests and ensure passing
  - [ ] Run `pnpm test` in backend and frontend
  - [ ] Fix any failing tests
  - [ ] Verify all acceptance criteria are covered

## Dev Notes

### Prisma Schema Changes

```prisma
// Update backend/prisma/schema.prisma
model User {
  id                   String    @id @default(cuid())
  email                String    @unique
  passwordHash         String
  onboardingCompleted  Boolean   @default(false)
  onboardingSkipped    Boolean   @default(false)
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  // ... existing relations
}
```

### Onboarding API Endpoints

```typescript
// GET /api/onboarding/status
// Response: { data: { completed: boolean, skipped: boolean } }

// POST /api/onboarding/complete
// Response: { data: { completed: true } }

// POST /api/onboarding/skip
// Response: { data: { skipped: true } }
```

### Batch Asset Creation

```typescript
// POST /api/assets/batch
// Request:
{
  "assets": [
    { "ticker": "VOO", "name": "Vanguard S&P 500", "category": "ETF" },
    { "ticker": "GLD", "name": "SPDR Gold Shares", "category": "ETF" },
    { "ticker": "BTC", "name": "Bitcoin", "category": "Crypto" }
  ]
}
// Response: { data: Asset[], message: "3 assets created" }
```

### Batch Target Update

```typescript
// PUT /api/assets/targets/batch
// Request:
{
  "targets": [
    { "assetId": "clxyz1...", "targetPercentage": 60 },
    { "assetId": "clxyz2...", "targetPercentage": 30 },
    { "assetId": "clxyz3...", "targetPercentage": 10 }
  ]
}
// Response: { data: Asset[], message: "Targets updated (sum: 100%)" }

// Validation Error Response:
{ "error": "VALIDATION_ERROR", "message": "Targets must sum to 100%", "details": { "sum": 105 } }
```

### Batch Holdings Creation

```typescript
// POST /api/holdings/batch
// Request:
{
  "holdings": [
    { "assetId": "clxyz1...", "quantity": 15.5, "price": 450.00 },
    { "assetId": "clxyz2...", "quantity": 2, "price": 2100.00 },
    { "assetId": "clxyz3...", "quantity": 0.5 }  // price optional
  ]
}
// Response: { data: Holding[], message: "3 holdings created" }
```

### Frontend Types

```typescript
// frontend/src/types/api.ts

export interface OnboardingStatus {
  completed: boolean
  skipped: boolean
}

export interface BatchAssetCreate {
  ticker: string
  name: string
  category: 'ETF' | 'FCI' | 'Crypto' | 'Cash'
}

export interface BatchTargetUpdate {
  assetId: string
  targetPercentage: number
}

export interface BatchHoldingCreate {
  assetId: string
  quantity: number
  price?: number
}
```

### API Client Methods

```typescript
// frontend/src/lib/api.ts

onboarding: {
  getStatus: async (): Promise<OnboardingStatus> => {
    const res = await fetch(`${API_URL}/onboarding/status`, {
      headers: getAuthHeaders(),
    })
    return handleResponse<OnboardingStatus>(res)
  },

  complete: async (): Promise<{ completed: boolean }> => {
    const res = await fetch(`${API_URL}/onboarding/complete`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })
    return handleResponse(res)
  },

  skip: async (): Promise<{ skipped: boolean }> => {
    const res = await fetch(`${API_URL}/onboarding/skip`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })
    return handleResponse(res)
  },
},

// Add to existing assets object:
assets: {
  // ... existing methods

  createBatch: async (assets: BatchAssetCreate[]): Promise<Asset[]> => {
    const res = await fetch(`${API_URL}/assets/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ assets }),
    })
    return handleResponse<Asset[]>(res)
  },

  updateTargetsBatch: async (targets: BatchTargetUpdate[]): Promise<Asset[]> => {
    const res = await fetch(`${API_URL}/assets/targets/batch`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ targets }),
    })
    return handleResponse<Asset[]>(res)
  },
},

// Add to holdings:
holdings: {
  // ... existing methods

  createBatch: async (holdings: BatchHoldingCreate[]): Promise<Holding[]> => {
    const res = await fetch(`${API_URL}/holdings/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ holdings }),
    })
    return handleResponse<Holding[]>(res)
  },
},
```

### useOnboarding Hook

```typescript
// frontend/src/features/onboarding/hooks/useOnboarding.ts
import { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { BatchAssetCreate, BatchTargetUpdate, BatchHoldingCreate } from '@/types/api'

interface OnboardingData {
  assets: (BatchAssetCreate & { tempId: string })[]
  targets: Record<string, number> // tempId -> percentage
  holdings: Record<string, { quantity: number; price?: number }> // tempId -> data
}

export function useOnboarding() {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<OnboardingData>({
    assets: [],
    targets: {},
    holdings: {},
  })

  const queryClient = useQueryClient()

  const addAsset = useCallback((asset: BatchAssetCreate) => {
    const tempId = crypto.randomUUID()
    setData(prev => ({
      ...prev,
      assets: [...prev.assets, { ...asset, tempId }],
      targets: { ...prev.targets, [tempId]: 0 },
      holdings: { ...prev.holdings, [tempId]: { quantity: 0 } },
    }))
  }, [])

  const removeAsset = useCallback((tempId: string) => {
    setData(prev => {
      const { [tempId]: _t, ...targets } = prev.targets
      const { [tempId]: _h, ...holdings } = prev.holdings
      return {
        ...prev,
        assets: prev.assets.filter(a => a.tempId !== tempId),
        targets,
        holdings,
      }
    })
  }, [])

  const setTarget = useCallback((tempId: string, percentage: number) => {
    setData(prev => ({
      ...prev,
      targets: { ...prev.targets, [tempId]: percentage },
    }))
  }, [])

  const setHolding = useCallback((tempId: string, quantity: number, price?: number) => {
    setData(prev => ({
      ...prev,
      holdings: { ...prev.holdings, [tempId]: { quantity, price } },
    }))
  }, [])

  const targetSum = Object.values(data.targets).reduce((sum, v) => sum + v, 0)
  const isTargetValid = Math.abs(targetSum - 100) < 0.01 // Allow 0.01 tolerance

  const canProceed = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1: return data.assets.length > 0
      case 2: return isTargetValid
      case 3: return true // Holdings are optional
      default: return false
    }
  }

  const completeMutation = useMutation({
    mutationFn: async () => {
      // 1. Create assets
      const createdAssets = await api.assets.createBatch(
        data.assets.map(({ tempId, ...a }) => a)
      )

      // Build tempId -> realId map
      const idMap = new Map<string, string>()
      data.assets.forEach((a, i) => {
        idMap.set(a.tempId, createdAssets[i].id)
      })

      // 2. Update targets
      const targets: BatchTargetUpdate[] = data.assets.map(a => ({
        assetId: idMap.get(a.tempId)!,
        targetPercentage: data.targets[a.tempId],
      }))
      await api.assets.updateTargetsBatch(targets)

      // 3. Create holdings
      const holdings: BatchHoldingCreate[] = data.assets
        .filter(a => data.holdings[a.tempId].quantity > 0)
        .map(a => ({
          assetId: idMap.get(a.tempId)!,
          ...data.holdings[a.tempId],
        }))

      if (holdings.length > 0) {
        await api.holdings.createBatch(holdings)
      }

      // 4. Mark onboarding complete
      await api.onboarding.complete()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] })
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['holdings'] })
    },
  })

  const skipMutation = useMutation({
    mutationFn: () => api.onboarding.skip(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] })
    },
  })

  return {
    step,
    setStep,
    data,
    addAsset,
    removeAsset,
    setTarget,
    setHolding,
    targetSum,
    isTargetValid,
    canProceed,
    complete: completeMutation.mutateAsync,
    skip: skipMutation.mutateAsync,
    isCompleting: completeMutation.isPending,
    isSkipping: skipMutation.isPending,
    error: completeMutation.error || skipMutation.error,
  }
}
```

### OnboardingLayout Component

```typescript
// frontend/src/features/onboarding/components/OnboardingLayout.tsx
import { cn } from '@/lib/cn'

interface OnboardingLayoutProps {
  step: number
  title: string
  description: string
  canProceed: boolean
  onBack: () => void
  onNext: () => void
  onSkip: () => void
  isLastStep: boolean
  isSubmitting: boolean
  children: React.ReactNode
}

const steps = [
  { number: 1, title: 'Activos' },
  { number: 2, title: 'Targets' },
  { number: 3, title: 'Holdings' },
]

export function OnboardingLayout({
  step,
  title,
  description,
  canProceed,
  onBack,
  onNext,
  onSkip,
  isLastStep,
  isSubmitting,
  children,
}: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress Bar */}
      <div className="border-b">
        <div className="container max-w-2xl mx-auto py-6">
          <div className="flex justify-between items-center">
            {steps.map((s, i) => (
              <div key={s.number} className="flex items-center">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                  step >= s.number
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}>
                  {s.number}
                </div>
                <span className={cn(
                  'ml-2 text-sm',
                  step >= s.number ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {s.title}
                </span>
                {i < steps.length - 1 && (
                  <div className={cn(
                    'w-12 h-0.5 mx-4',
                    step > s.number ? 'bg-primary' : 'bg-muted'
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 container max-w-2xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>

        {children}
      </div>

      {/* Navigation */}
      <div className="border-t">
        <div className="container max-w-2xl mx-auto py-4 flex justify-between">
          <div>
            {step > 1 && (
              <button
                onClick={onBack}
                className="px-4 py-2 text-muted-foreground hover:text-foreground"
                disabled={isSubmitting}
              >
                Volver
              </button>
            )}
          </div>

          <div className="flex gap-4">
            <button
              onClick={onSkip}
              className="px-4 py-2 text-muted-foreground hover:text-foreground"
              disabled={isSubmitting}
            >
              Saltar por ahora
            </button>
            <button
              onClick={onNext}
              disabled={!canProceed || isSubmitting}
              className={cn(
                'px-6 py-2 rounded-lg font-medium',
                canProceed
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
            >
              {isSubmitting ? 'Procesando...' : isLastStep ? 'Finalizar Setup' : 'Continuar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### Step1AssetSetup Component

```typescript
// frontend/src/features/onboarding/components/Step1AssetSetup.tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { BatchAssetCreate } from '@/types/api'

const assetSchema = z.object({
  ticker: z.string().min(1, 'Ticker requerido').max(10).transform(v => v.toUpperCase()),
  name: z.string().min(1, 'Nombre requerido'),
  category: z.enum(['ETF', 'FCI', 'Crypto', 'Cash']),
})

interface Step1AssetSetupProps {
  assets: (BatchAssetCreate & { tempId: string })[]
  onAdd: (asset: BatchAssetCreate) => void
  onRemove: (tempId: string) => void
}

export function Step1AssetSetup({ assets, onAdd, onRemove }: Step1AssetSetupProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(assetSchema),
    defaultValues: { ticker: '', name: '', category: 'ETF' as const },
  })

  const onSubmit = (data: BatchAssetCreate) => {
    onAdd(data)
    reset()
  }

  return (
    <div className="space-y-6">
      {/* Asset Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-card border rounded-lg p-6">
        <h3 className="font-medium mb-4">Agregar activo</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-sm text-muted-foreground">Ticker</label>
            <input
              {...register('ticker')}
              placeholder="VOO"
              className="w-full mt-1 px-3 py-2 border rounded-md"
            />
            {errors.ticker && (
              <p className="text-sm text-destructive mt-1">{errors.ticker.message}</p>
            )}
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Nombre</label>
            <input
              {...register('name')}
              placeholder="Vanguard S&P 500"
              className="w-full mt-1 px-3 py-2 border rounded-md"
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Categoría</label>
            <select
              {...register('category')}
              className="w-full mt-1 px-3 py-2 border rounded-md"
            >
              <option value="ETF">ETF</option>
              <option value="FCI">FCI</option>
              <option value="Crypto">Crypto</option>
              <option value="Cash">Cash</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
        >
          + Agregar
        </button>
      </form>

      {/* Asset List */}
      {assets.length > 0 && (
        <div className="bg-card border rounded-lg p-6">
          <h3 className="font-medium mb-4">Activos agregados ({assets.length})</h3>
          <div className="space-y-2">
            {assets.map(asset => (
              <div
                key={asset.tempId}
                className="flex items-center justify-between py-2 px-3 bg-muted rounded-md"
              >
                <div>
                  <span className="font-mono font-medium">{asset.ticker}</span>
                  <span className="mx-2 text-muted-foreground">-</span>
                  <span>{asset.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">({asset.category})</span>
                </div>
                <button
                  onClick={() => onRemove(asset.tempId)}
                  className="text-destructive hover:text-destructive/80"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {assets.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          Agrega al menos un activo para continuar
        </p>
      )}
    </div>
  )
}
```

### Step2TargetSetup Component

```typescript
// frontend/src/features/onboarding/components/Step2TargetSetup.tsx
import { cn } from '@/lib/cn'
import type { BatchAssetCreate } from '@/types/api'

interface Step2TargetSetupProps {
  assets: (BatchAssetCreate & { tempId: string })[]
  targets: Record<string, number>
  onSetTarget: (tempId: string, percentage: number) => void
  targetSum: number
  isValid: boolean
}

export function Step2TargetSetup({
  assets,
  targets,
  onSetTarget,
  targetSum,
  isValid,
}: Step2TargetSetupProps) {
  return (
    <div className="space-y-6">
      {/* Target Sum Indicator */}
      <div className={cn(
        'p-4 rounded-lg border-2',
        isValid ? 'border-green-500 bg-green-50' : 'border-amber-500 bg-amber-50'
      )}>
        <div className="flex justify-between items-center">
          <span className="font-medium">Total de targets:</span>
          <span className={cn(
            'text-2xl font-bold',
            isValid ? 'text-green-600' : 'text-amber-600'
          )}>
            {targetSum.toFixed(1)}%
          </span>
        </div>
        {!isValid && (
          <p className="text-sm text-amber-600 mt-1">
            {targetSum < 100
              ? `Faltan ${(100 - targetSum).toFixed(1)}% para completar`
              : `Excede por ${(targetSum - 100).toFixed(1)}%`}
          </p>
        )}
        {isValid && (
          <p className="text-sm text-green-600 mt-1">
            Los targets suman exactamente 100%
          </p>
        )}
      </div>

      {/* Target Inputs */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="font-medium mb-4">Asignar porcentajes objetivo</h3>
        <div className="space-y-4">
          {assets.map(asset => (
            <div key={asset.tempId} className="flex items-center gap-4">
              <div className="flex-1">
                <span className="font-mono">{asset.ticker}</span>
                <span className="text-muted-foreground ml-2">{asset.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={targets[asset.tempId] || 0}
                  onChange={(e) => onSetTarget(asset.tempId, parseFloat(e.target.value) || 0)}
                  className="w-24 px-3 py-2 border rounded-md text-right"
                />
                <span className="text-muted-foreground">%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

### Step3HoldingsSetup Component

```typescript
// frontend/src/features/onboarding/components/Step3HoldingsSetup.tsx
import { formatCurrency } from '@/lib/formatters'
import type { BatchAssetCreate } from '@/types/api'

interface Step3HoldingsSetupProps {
  assets: (BatchAssetCreate & { tempId: string })[]
  holdings: Record<string, { quantity: number; price?: number }>
  onSetHolding: (tempId: string, quantity: number, price?: number) => void
}

export function Step3HoldingsSetup({
  assets,
  holdings,
  onSetHolding,
}: Step3HoldingsSetupProps) {
  // Calculate total value if all prices are set
  const totalValue = assets.reduce((sum, asset) => {
    const h = holdings[asset.tempId]
    if (h && h.quantity > 0 && h.price) {
      return sum + (h.quantity * h.price)
    }
    return sum
  }, 0)

  const hasAnyPrices = assets.some(a => holdings[a.tempId]?.price)

  return (
    <div className="space-y-6">
      {/* Total Value */}
      {hasAnyPrices && totalValue > 0 && (
        <div className="p-4 rounded-lg bg-muted">
          <div className="flex justify-between items-center">
            <span className="font-medium">Valor total estimado:</span>
            <span className="text-2xl font-bold">{formatCurrency(totalValue)}</span>
          </div>
        </div>
      )}

      {/* Holdings Inputs */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="font-medium mb-4">Cargar posiciones actuales</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Ingresa las cantidades que posees de cada activo. Los precios son opcionales.
        </p>

        <div className="space-y-4">
          {assets.map(asset => {
            const h = holdings[asset.tempId] || { quantity: 0 }
            const value = h.quantity && h.price ? h.quantity * h.price : null

            return (
              <div key={asset.tempId} className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-mono font-medium">{asset.ticker}</span>
                    <span className="text-muted-foreground ml-2">{asset.name}</span>
                  </div>
                  {value !== null && (
                    <span className="text-sm font-medium">
                      Valor: {formatCurrency(value)}
                    </span>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm text-muted-foreground">Cantidad</label>
                    <input
                      type="number"
                      min="0"
                      step="0.0001"
                      value={h.quantity || ''}
                      onChange={(e) => onSetHolding(
                        asset.tempId,
                        parseFloat(e.target.value) || 0,
                        h.price
                      )}
                      placeholder="0"
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">
                      Precio actual (opcional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={h.price || ''}
                      onChange={(e) => onSetHolding(
                        asset.tempId,
                        h.quantity,
                        parseFloat(e.target.value) || undefined
                      )}
                      placeholder="$0.00"
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

### Redirect Logic

```typescript
// Modify frontend/src/features/auth/hooks/useAuth.ts

// Add to the hook:
const { data: onboardingStatus } = useQuery({
  queryKey: ['onboarding', 'status'],
  queryFn: () => api.onboarding.getStatus(),
  enabled: isAuthenticated,
})

const needsOnboarding = isAuthenticated &&
  !onboardingStatus?.completed &&
  !onboardingStatus?.skipped

return {
  ...existingReturns,
  onboardingStatus,
  needsOnboarding,
}
```

```typescript
// Modify frontend/src/router.tsx

// Add onboarding route
{ path: '/onboarding', element: <OnboardingPage /> }

// In ProtectedRoute wrapper:
function ProtectedRoute({ children }) {
  const { isAuthenticated, needsOnboarding } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  // Redirect to onboarding if needed (but not if already there)
  if (needsOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" />
  }

  return children
}
```

### Setup Reminder Banner

```typescript
// Add to frontend/src/components/layout/Layout.tsx

const { onboardingStatus } = useAuth()

// In the Layout return, before main content:
{onboardingStatus?.skipped && !onboardingStatus?.completed && (
  <div className="bg-amber-100 border-b border-amber-200 px-4 py-2">
    <div className="container max-w-7xl mx-auto flex justify-between items-center">
      <span className="text-sm text-amber-800">
        Completa la configuración de tu portfolio para empezar a usar la app.
      </span>
      <Link
        to="/onboarding"
        className="text-sm font-medium text-amber-900 hover:underline"
      >
        Completar setup
      </Link>
    </div>
  </div>
)}
```

### File Structure

```
backend/
├── prisma/
│   └── schema.prisma                    (MODIFY - add onboarding fields to User)
├── src/
│   ├── routes/
│   │   ├── assets.ts                    (MODIFY - add batch endpoints)
│   │   ├── holdings.ts                  (MODIFY - add batch endpoint)
│   │   └── onboarding.ts                (NEW)
│   ├── services/
│   │   └── onboardingService.ts         (NEW)
│   └── validations/
│       └── onboarding.ts                (NEW)

frontend/src/
├── types/
│   └── api.ts                           (MODIFY - add onboarding types)
├── lib/
│   ├── api.ts                           (MODIFY - add onboarding and batch methods)
│   └── queryKeys.ts                     (MODIFY - add onboarding keys)
├── features/
│   ├── auth/
│   │   └── hooks/
│   │       └── useAuth.ts               (MODIFY - add onboarding check)
│   └── onboarding/                      (NEW FOLDER)
│       ├── index.tsx                    (NEW - Wizard page)
│       ├── index.test.tsx               (NEW)
│       ├── hooks/
│       │   ├── useOnboarding.ts         (NEW)
│       │   └── useOnboarding.test.tsx   (NEW)
│       └── components/
│           ├── OnboardingLayout.tsx     (NEW)
│           ├── OnboardingLayout.test.tsx(NEW)
│           ├── Step1AssetSetup.tsx      (NEW)
│           ├── Step1AssetSetup.test.tsx (NEW)
│           ├── Step2TargetSetup.tsx     (NEW)
│           ├── Step2TargetSetup.test.tsx(NEW)
│           ├── Step3HoldingsSetup.tsx   (NEW)
│           └── Step3HoldingsSetup.test.tsx(NEW)
├── components/
│   └── layout/
│       └── Layout.tsx                   (MODIFY - add setup reminder)
└── router.tsx                           (MODIFY - add onboarding route + redirect)
```

### Anti-Patterns to Avoid

```typescript
// NEVER create assets one by one in a loop
for (const asset of assets) {
  await api.assets.create(asset) // WRONG - N requests
}
await api.assets.createBatch(assets) // CORRECT - 1 request

// NEVER skip validation on targets sum
if (targets.reduce((s, t) => s + t.percentage, 0) !== 100) {
  throw Errors.validation('Targets must sum to 100%')
}

// NEVER store onboarding state only in frontend
localStorage.setItem('onboardingDone', 'true') // WRONG - not persistent
await api.onboarding.complete() // CORRECT - persisted in DB

// NEVER redirect without checking current path
if (needsOnboarding) return <Navigate to="/onboarding" /> // May cause infinite loop
if (needsOnboarding && location.pathname !== '/onboarding') // CORRECT

// NEVER proceed without validating step requirements
onNext() // WRONG
if (canProceed(step)) onNext() // CORRECT
```

### Testing Requirements

```typescript
// Backend tests
describe('Onboarding Service', () => {
  it('should get onboarding status for user')
  it('should mark onboarding as completed')
  it('should mark onboarding as skipped')
  it('should only allow one completion per user')
})

describe('POST /api/assets/batch', () => {
  it('should create multiple assets in one request')
  it('should validate all assets before creating any')
  it('should reject if any ticker is duplicate')
  it('should return all created assets with IDs')
})

describe('PUT /api/assets/targets/batch', () => {
  it('should update all targets atomically')
  it('should reject if targets do not sum to 100')
  it('should accept targets that sum to exactly 100')
  it('should return updated assets')
})

describe('POST /api/holdings/batch', () => {
  it('should create multiple holdings in one request')
  it('should create price records for holdings with price')
  it('should skip price for holdings without price')
})

// Frontend tests
describe('useOnboarding', () => {
  it('should track current step')
  it('should manage assets, targets, and holdings data')
  it('should calculate target sum correctly')
  it('should validate step before allowing proceed')
  it('should call APIs in correct order on complete')
})

describe('OnboardingWizard', () => {
  it('should render step 1 initially')
  it('should prevent proceed if no assets added')
  it('should navigate to step 2 when assets added')
  it('should prevent proceed if targets != 100')
  it('should submit and redirect on finish')
  it('should skip and redirect when skip clicked')
})
```

### Key Technical Constraints

- **Atomic operations**: All batch operations must be atomic (all or nothing)
- **Target validation**: Backend MUST validate targets sum to 100% before accepting
- **Onboarding state**: MUST be persisted in database, not just localStorage
- **Redirect safety**: Must prevent infinite redirect loops
- **Error handling**: Show clear error messages if batch operations fail
- **Performance**: Minimize API calls using batch endpoints

### Previous Story Intelligence (6-2-evolution-chart-historical-view)

**Key Patterns from Frontend Implementation:**
- Feature folder structure: `features/{feature}/components/`, `features/{feature}/hooks/`
- Use TanStack Query with `queryKeys` factory for data fetching
- Use React Hook Form + Zod for form validation
- Tests co-located with components
- All monetary values returned as strings from API
- formatCurrency and other formatters in `lib/formatters.ts`
- date-fns with Spanish locale for date formatting

**Files to Reference:**
- `frontend/src/features/evolution/` for feature structure pattern
- `frontend/src/lib/api.ts` for API method patterns
- `frontend/src/router.tsx` for route configuration
- `frontend/src/components/layout/Layout.tsx` for navigation

### Git Patterns from Recent Commits

**Commit message format:**
```
feat(story-key): descriptive message
chore: mark story X as done
```

**Branch pattern:**
```
feature/6-3-onboarding-wizard
```

### Project Context Reference

See `_bmad-output/project-context.md` for:
- TypeScript strict mode rules (no `any`)
- Path aliases (`@/features`, `@/lib`, `@/types`)
- Naming conventions (camelCase for files, PascalCase for components)
- API client usage pattern (always through `lib/api.ts`)
- Error handling patterns (`Errors.validation()`, `Errors.notFound()`)
- Backend service/route separation (routes parse request/response, services contain logic)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-6.3]
- [Source: _bmad-output/planning-artifacts/prd.md#Onboarding]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend-Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Backend-Patterns]
- [Source: frontend/src/features/evolution/ - Feature structure pattern]
- [Source: frontend/src/lib/api.ts - API client pattern]
- [Source: backend/src/routes/assets.ts - Route pattern]
- [Source: backend/src/services/assetService.ts - Service pattern]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
