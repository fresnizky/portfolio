# Story 6.4: Settings & Preferences Management

Status: done

## Story

As a **user**,
I want **to configure my alert thresholds and preferences**,
So that **the app behaves according to my needs**.

## Acceptance Criteria

1. **Given** I am on the settings page, **When** the page loads, **Then** I see my current preferences: rebalanceThreshold (default 5%), priceAlertDays (default 7)

2. **Given** I want to change the rebalance threshold, **When** I update it to 10% and save, **Then** the threshold is saved and alerts use the new value

3. **Given** I want to change the price staleness alert, **When** I update priceAlertDays to 14 and save, **Then** prices are considered stale only after 14 days

4. **Given** I am on settings, **When** I view export options, **Then** I can export my data as JSON or CSV for backup

5. **Given** I click "Export JSON", **When** the export completes, **Then** I download a file containing all my assets, holdings, transactions, and snapshots

6. **Given** I view the settings page, **When** I look at my account info, **Then** I see my email and can change my password

## Tasks / Subtasks

- [ ] Task 1: Backend - Add settings fields to User model (AC: #1)
  - [ ] Add `rebalanceThreshold` Decimal field (default 5.0) to User model in Prisma schema
  - [ ] Add `priceAlertDays` Int field (default 7) to User model in Prisma schema
  - [ ] Create migration: `npx prisma migrate dev --name add_user_settings`
  - [ ] Generate Prisma client: `npx prisma generate`

- [ ] Task 2: Backend - Create settings service and routes (AC: #1, #2, #3)
  - [ ] Create `backend/src/services/settingsService.ts` with getSettings() and updateSettings()
  - [ ] Create `backend/src/validations/settings.ts` with Zod schemas
  - [ ] Create `backend/src/routes/settings.ts` with GET and PUT endpoints
  - [ ] Register settings route in `backend/src/index.ts`
  - [ ] Write tests for settings service and routes

- [ ] Task 3: Backend - Create export endpoints (AC: #4, #5)
  - [ ] Add `GET /api/settings/export/json` endpoint to settings routes
  - [ ] Add `GET /api/settings/export/csv` endpoint to settings routes
  - [ ] Export service should aggregate: assets, holdings (with prices), transactions, snapshots
  - [ ] JSON export: single file with all data
  - [ ] CSV export: zip file with multiple CSVs (assets.csv, holdings.csv, transactions.csv, snapshots.csv)
  - [ ] Write tests for export endpoints

- [ ] Task 4: Backend - Add password change endpoint (AC: #6)
  - [ ] Add `PUT /api/auth/password` endpoint to auth routes
  - [ ] Validate current password before allowing change
  - [ ] Hash new password with bcrypt
  - [ ] Write tests for password change

- [ ] Task 5: Backend - Update dashboard to use user settings (AC: #2, #3)
  - [ ] Modify `dashboardService.getDashboard()` to fetch user settings if no params provided
  - [ ] Use user's `rebalanceThreshold` as default `deviationPct`
  - [ ] Use user's `priceAlertDays` as default `staleDays`
  - [ ] Update tests to verify settings integration

- [ ] Task 6: Frontend - Add settings types and API methods (AC: all)
  - [ ] Add `UserSettings` interface to `frontend/src/types/api.ts`
  - [ ] Add `UpdateSettingsInput` interface
  - [ ] Add `ExportData` interface for JSON export response
  - [ ] Add `api.settings` object to `frontend/src/lib/api.ts` with get/update/exportJson/exportCsv methods
  - [ ] Add `api.auth.changePassword` method
  - [ ] Add query keys for settings to `frontend/src/lib/queryKeys.ts`

- [ ] Task 7: Frontend - Create useSettings hook (AC: #1, #2, #3)
  - [ ] Create `frontend/src/features/settings/hooks/useSettings.ts`
  - [ ] Use TanStack Query for fetching settings
  - [ ] Use mutation for updating settings
  - [ ] Invalidate dashboard queries on settings update
  - [ ] Write tests for hook

- [ ] Task 8: Frontend - Create SettingsForm component (AC: #1, #2, #3)
  - [ ] Create `frontend/src/features/settings/components/SettingsForm.tsx`
  - [ ] Number input for rebalanceThreshold (1-50%, step 0.5)
  - [ ] Number input for priceAlertDays (1-30 days)
  - [ ] Save button with loading state
  - [ ] Success/error toast notifications
  - [ ] Write tests

- [ ] Task 9: Frontend - Create ExportSection component (AC: #4, #5)
  - [ ] Create `frontend/src/features/settings/components/ExportSection.tsx`
  - [ ] "Export JSON" button that downloads portfolio-backup.json
  - [ ] "Export CSV" button that downloads portfolio-backup.zip
  - [ ] Loading indicators during export
  - [ ] File download trigger using blob URL
  - [ ] Write tests

- [ ] Task 10: Frontend - Create AccountSection component (AC: #6)
  - [ ] Create `frontend/src/features/settings/components/AccountSection.tsx`
  - [ ] Display user email (read-only)
  - [ ] Password change form with current password, new password, confirm password
  - [ ] Validation: min 8 chars, passwords must match
  - [ ] Success/error toast notifications
  - [ ] Write tests

- [ ] Task 11: Frontend - Create SettingsPage (AC: all)
  - [ ] Create `frontend/src/features/settings/index.tsx`
  - [ ] Compose SettingsForm, ExportSection, AccountSection
  - [ ] Card-based layout with clear section headings
  - [ ] Write integration tests

- [ ] Task 12: Frontend - Add settings route and navigation (AC: all)
  - [ ] Add `/settings` route to `frontend/src/router.tsx`
  - [ ] Add "Settings" link to navigation in `frontend/src/components/layout/Layout.tsx`
  - [ ] Position settings link appropriately (end of nav or as separate item)
  - [ ] Write tests for navigation

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
  rebalanceThreshold   Decimal   @default(5.0)  // NEW: Default 5%
  priceAlertDays       Int       @default(7)    // NEW: Default 7 days
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  // ... existing relations
}
```

### Settings API Endpoints

```typescript
// GET /api/settings
// Response: { data: { rebalanceThreshold: "5.0", priceAlertDays: 7 } }

// PUT /api/settings
// Request: { rebalanceThreshold: 10, priceAlertDays: 14 }
// Response: { data: { rebalanceThreshold: "10.0", priceAlertDays: 14 }, message: "Settings updated" }
```

### Export Endpoints

```typescript
// GET /api/settings/export/json
// Response: { data: ExportData }
// ExportData structure:
{
  exportedAt: string
  user: { email: string }
  assets: Asset[]
  holdings: Holding[]
  transactions: Transaction[]
  snapshots: Snapshot[]
}

// GET /api/settings/export/csv
// Response: application/zip file containing:
// - assets.csv
// - holdings.csv
// - transactions.csv
// - snapshots.csv
```

### Password Change Endpoint

```typescript
// PUT /api/auth/password
// Request: { currentPassword: string, newPassword: string }
// Response: { data: { success: true }, message: "Password changed successfully" }

// Error cases:
// - 401 if currentPassword is incorrect
// - 400 if newPassword is too short (< 8 chars)
```

### Settings Service Implementation

```typescript
// backend/src/services/settingsService.ts
import { prisma } from '@/config/database'

export interface UserSettings {
  rebalanceThreshold: string  // Decimal returned as string
  priceAlertDays: number
}

export interface UpdateSettingsInput {
  rebalanceThreshold?: number
  priceAlertDays?: number
}

export const settingsService = {
  async getSettings(userId: string): Promise<UserSettings> {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        rebalanceThreshold: true,
        priceAlertDays: true,
      },
    })

    return {
      rebalanceThreshold: user.rebalanceThreshold.toString(),
      priceAlertDays: user.priceAlertDays,
    }
  },

  async updateSettings(userId: string, input: UpdateSettingsInput): Promise<UserSettings> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.rebalanceThreshold !== undefined && {
          rebalanceThreshold: input.rebalanceThreshold
        }),
        ...(input.priceAlertDays !== undefined && {
          priceAlertDays: input.priceAlertDays
        }),
      },
      select: {
        rebalanceThreshold: true,
        priceAlertDays: true,
      },
    })

    return {
      rebalanceThreshold: user.rebalanceThreshold.toString(),
      priceAlertDays: user.priceAlertDays,
    }
  },
}
```

### Settings Validation Schema

```typescript
// backend/src/validations/settings.ts
import { z } from 'zod'

export const updateSettingsSchema = z.object({
  rebalanceThreshold: z.number()
    .min(1, 'Minimum threshold is 1%')
    .max(50, 'Maximum threshold is 50%')
    .optional(),
  priceAlertDays: z.number()
    .int('Must be a whole number')
    .min(1, 'Minimum is 1 day')
    .max(30, 'Maximum is 30 days')
    .optional(),
}).refine(
  (data) => data.rebalanceThreshold !== undefined || data.priceAlertDays !== undefined,
  { message: 'At least one setting must be provided' }
)

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
})
```

### Settings Routes Implementation

```typescript
// backend/src/routes/settings.ts
import { Router, Request, Response } from 'express'
import { settingsService } from '@/services/settingsService'
import { validate } from '@/middleware/validate'
import { updateSettingsSchema } from '@/validations/settings'

const router = Router()

// GET /api/settings
router.get('/', async (req: Request, res: Response) => {
  const settings = await settingsService.getSettings(req.user!.id)
  res.json({ data: settings })
})

// PUT /api/settings
router.put('/', validate(updateSettingsSchema), async (req: Request, res: Response) => {
  const settings = await settingsService.updateSettings(req.user!.id, req.body)
  res.json({ data: settings, message: 'Settings updated' })
})

export default router
```

### Export Service Implementation

```typescript
// backend/src/services/exportService.ts
import { prisma } from '@/config/database'
import archiver from 'archiver'
import { stringify } from 'csv-stringify/sync'

export interface ExportData {
  exportedAt: string
  user: { email: string }
  assets: any[]
  holdings: any[]
  transactions: any[]
  snapshots: any[]
}

export const exportService = {
  async exportJson(userId: string): Promise<ExportData> {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { email: true },
    })

    const [assets, holdings, transactions, snapshots] = await Promise.all([
      prisma.asset.findMany({ where: { userId } }),
      prisma.holding.findMany({
        where: { asset: { userId } },
        include: { asset: { select: { ticker: true } } },
      }),
      prisma.transaction.findMany({
        where: { asset: { userId } },
        include: { asset: { select: { ticker: true } } },
      }),
      prisma.portfolioSnapshot.findMany({
        where: { userId },
        include: { assetSnapshots: true },
      }),
    ])

    return {
      exportedAt: new Date().toISOString(),
      user: { email: user.email },
      assets,
      holdings,
      transactions,
      snapshots,
    }
  },

  async exportCsv(userId: string): Promise<Buffer> {
    const data = await this.exportJson(userId)

    const archive = archiver('zip', { zlib: { level: 9 } })
    const chunks: Buffer[] = []

    archive.on('data', (chunk) => chunks.push(chunk))

    // Assets CSV
    archive.append(stringify(data.assets, { header: true }), { name: 'assets.csv' })

    // Holdings CSV
    archive.append(stringify(data.holdings.map(h => ({
      ticker: h.asset.ticker,
      quantity: h.quantity,
      updatedAt: h.updatedAt,
    })), { header: true }), { name: 'holdings.csv' })

    // Transactions CSV
    archive.append(stringify(data.transactions.map(t => ({
      ticker: t.asset.ticker,
      type: t.type,
      date: t.date,
      quantity: t.quantity,
      price: t.price,
      commission: t.commission,
    })), { header: true }), { name: 'transactions.csv' })

    // Snapshots CSV
    archive.append(stringify(data.snapshots.map(s => ({
      date: s.date,
      totalValue: s.totalValue,
    })), { header: true }), { name: 'snapshots.csv' })

    await archive.finalize()

    return Buffer.concat(chunks)
  },
}
```

### Frontend Types

```typescript
// frontend/src/types/api.ts - Add these types

export interface UserSettings {
  rebalanceThreshold: string  // Decimal as string from API
  priceAlertDays: number
}

export interface UpdateSettingsInput {
  rebalanceThreshold?: number
  priceAlertDays?: number
}

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

export interface ExportData {
  exportedAt: string
  user: { email: string }
  assets: Asset[]
  holdings: Holding[]
  transactions: Transaction[]
  snapshots: Snapshot[]
}
```

### API Client Methods

```typescript
// frontend/src/lib/api.ts - Add to api object

settings: {
  get: async (): Promise<UserSettings> => {
    const res = await fetch(`${API_URL}/settings`, {
      headers: getAuthHeaders(),
    })
    return handleResponse<UserSettings>(res)
  },

  update: async (input: UpdateSettingsInput): Promise<UserSettings> => {
    const res = await fetch(`${API_URL}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(input),
    })
    return handleResponse<UserSettings>(res)
  },

  exportJson: async (): Promise<ExportData> => {
    const res = await fetch(`${API_URL}/settings/export/json`, {
      headers: getAuthHeaders(),
    })
    return handleResponse<ExportData>(res)
  },

  exportCsv: async (): Promise<Blob> => {
    const res = await fetch(`${API_URL}/settings/export/csv`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new ApiError(error.error, error.message, error.details)
    }
    return res.blob()
  },
},

// Add to auth object
auth: {
  // ... existing methods

  changePassword: async (input: ChangePasswordInput): Promise<{ success: boolean }> => {
    const res = await fetch(`${API_URL}/auth/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(input),
    })
    return handleResponse<{ success: boolean }>(res)
  },
},
```

### Query Keys

```typescript
// frontend/src/lib/queryKeys.ts - Add

settings: {
  all: ['settings'] as const,
  get: () => [...queryKeys.settings.all, 'get'] as const,
},
```

### useSettings Hook

```typescript
// frontend/src/features/settings/hooks/useSettings.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import type { UpdateSettingsInput } from '@/types/api'

export function useSettings() {
  const queryClient = useQueryClient()

  const settingsQuery = useQuery({
    queryKey: queryKeys.settings.get(),
    queryFn: () => api.settings.get(),
  })

  const updateMutation = useMutation({
    mutationFn: (input: UpdateSettingsInput) => api.settings.update(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.all })
      // Also invalidate dashboard since it uses these settings
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
    },
  })

  return {
    settings: settingsQuery.data,
    isLoading: settingsQuery.isLoading,
    error: settingsQuery.error,
    updateSettings: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  }
}
```

### SettingsForm Component

```typescript
// frontend/src/features/settings/components/SettingsForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSettings } from '../hooks/useSettings'
import { useEffect } from 'react'
import { toast } from '@/components/ui/Toast'

const settingsSchema = z.object({
  rebalanceThreshold: z.number()
    .min(1, 'Mínimo 1%')
    .max(50, 'Máximo 50%'),
  priceAlertDays: z.number()
    .int('Debe ser un número entero')
    .min(1, 'Mínimo 1 día')
    .max(30, 'Máximo 30 días'),
})

type SettingsFormData = z.infer<typeof settingsSchema>

export function SettingsForm() {
  const { settings, isLoading, updateSettings, isUpdating } = useSettings()

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
  })

  // Reset form when settings load
  useEffect(() => {
    if (settings) {
      reset({
        rebalanceThreshold: parseFloat(settings.rebalanceThreshold),
        priceAlertDays: settings.priceAlertDays,
      })
    }
  }, [settings, reset])

  const onSubmit = async (data: SettingsFormData) => {
    try {
      await updateSettings(data)
      toast.success('Configuración guardada')
    } catch (error) {
      toast.error('Error al guardar configuración')
    }
  }

  if (isLoading) {
    return <div className="animate-pulse h-48 bg-muted rounded-lg" />
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Umbral de rebalanceo
          </label>
          <p className="text-sm text-muted-foreground mb-2">
            Porcentaje de desviación para mostrar alertas de rebalanceo
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.5"
              min="1"
              max="50"
              {...register('rebalanceThreshold', { valueAsNumber: true })}
              className="w-24 px-3 py-2 border rounded-md"
            />
            <span className="text-muted-foreground">%</span>
          </div>
          {errors.rebalanceThreshold && (
            <p className="text-sm text-destructive mt-1">{errors.rebalanceThreshold.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Días para alerta de precios
          </label>
          <p className="text-sm text-muted-foreground mb-2">
            Número de días sin actualizar precios para mostrar alerta
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="30"
              {...register('priceAlertDays', { valueAsNumber: true })}
              className="w-24 px-3 py-2 border rounded-md"
            />
            <span className="text-muted-foreground">días</span>
          </div>
          {errors.priceAlertDays && (
            <p className="text-sm text-destructive mt-1">{errors.priceAlertDays.message}</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={!isDirty || isUpdating}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
      >
        {isUpdating ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  )
}
```

### ExportSection Component

```typescript
// frontend/src/features/settings/components/ExportSection.tsx
import { useState } from 'react'
import { api } from '@/lib/api'
import { toast } from '@/components/ui/Toast'

export function ExportSection() {
  const [isExportingJson, setIsExportingJson] = useState(false)
  const [isExportingCsv, setIsExportingCsv] = useState(false)

  const handleExportJson = async () => {
    setIsExportingJson(true)
    try {
      const data = await api.settings.exportJson()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      downloadFile(blob, 'portfolio-backup.json')
      toast.success('Exportación completada')
    } catch (error) {
      toast.error('Error al exportar datos')
    } finally {
      setIsExportingJson(false)
    }
  }

  const handleExportCsv = async () => {
    setIsExportingCsv(true)
    try {
      const blob = await api.settings.exportCsv()
      downloadFile(blob, 'portfolio-backup.zip')
      toast.success('Exportación completada')
    } catch (error) {
      toast.error('Error al exportar datos')
    } finally {
      setIsExportingCsv(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Exporta todos tus datos del portfolio como backup. Incluye activos, holdings, transacciones y snapshots.
      </p>

      <div className="flex gap-4">
        <button
          onClick={handleExportJson}
          disabled={isExportingJson}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 disabled:opacity-50"
        >
          {isExportingJson ? 'Exportando...' : 'Exportar JSON'}
        </button>

        <button
          onClick={handleExportCsv}
          disabled={isExportingCsv}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 disabled:opacity-50"
        >
          {isExportingCsv ? 'Exportando...' : 'Exportar CSV'}
        </button>
      </div>
    </div>
  )
}

function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
```

### AccountSection Component

```typescript
// frontend/src/features/settings/components/AccountSection.tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/api'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { toast } from '@/components/ui/Toast'

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Ingresa tu contraseña actual'),
  newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

type PasswordFormData = z.infer<typeof passwordSchema>

export function AccountSection() {
  const { user } = useAuth()
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [isChanging, setIsChanging] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  const onSubmit = async (data: PasswordFormData) => {
    setIsChanging(true)
    try {
      await api.auth.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      toast.success('Contraseña actualizada')
      reset()
      setShowPasswordForm(false)
    } catch (error: any) {
      if (error.message?.includes('incorrect')) {
        toast.error('Contraseña actual incorrecta')
      } else {
        toast.error('Error al cambiar contraseña')
      }
    } finally {
      setIsChanging(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <p className="text-muted-foreground">{user?.email}</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Contraseña</label>
        {!showPasswordForm ? (
          <button
            onClick={() => setShowPasswordForm(true)}
            className="text-sm text-primary hover:underline"
          >
            Cambiar contraseña
          </button>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <div>
              <input
                type="password"
                placeholder="Contraseña actual"
                {...register('currentPassword')}
                className="w-full px-3 py-2 border rounded-md"
              />
              {errors.currentPassword && (
                <p className="text-sm text-destructive mt-1">{errors.currentPassword.message}</p>
              )}
            </div>

            <div>
              <input
                type="password"
                placeholder="Nueva contraseña"
                {...register('newPassword')}
                className="w-full px-3 py-2 border rounded-md"
              />
              {errors.newPassword && (
                <p className="text-sm text-destructive mt-1">{errors.newPassword.message}</p>
              )}
            </div>

            <div>
              <input
                type="password"
                placeholder="Confirmar nueva contraseña"
                {...register('confirmPassword')}
                className="w-full px-3 py-2 border rounded-md"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isChanging}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {isChanging ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={() => {
                  reset()
                  setShowPasswordForm(false)
                }}
                className="px-4 py-2 text-muted-foreground hover:text-foreground"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
```

### SettingsPage

```typescript
// frontend/src/features/settings/index.tsx
import { SettingsForm } from './components/SettingsForm'
import { ExportSection } from './components/ExportSection'
import { AccountSection } from './components/AccountSection'

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">Personaliza tu experiencia en Portfolio Tracker</p>
      </div>

      {/* Preferences Section */}
      <section className="bg-card border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Preferencias de alertas</h2>
        <SettingsForm />
      </section>

      {/* Export Section */}
      <section className="bg-card border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Exportar datos</h2>
        <ExportSection />
      </section>

      {/* Account Section */}
      <section className="bg-card border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Cuenta</h2>
        <AccountSection />
      </section>
    </div>
  )
}
```

### Router Update

```typescript
// frontend/src/router.tsx - Add to routes inside Layout
{
  path: '/settings',
  element: <SettingsPage />,
}

// Import at top
import SettingsPage from '@/features/settings'
```

### Navigation Update

```typescript
// frontend/src/components/layout/Layout.tsx - Update navLinks
const navLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/holdings', label: 'Holdings & Prices' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/evolution', label: 'Evolución' },
  { to: '/settings', label: 'Configuración' },  // ADD THIS
]
```

### Dashboard Integration

```typescript
// backend/src/services/dashboardService.ts - Modify getDashboard
import { settingsService } from './settingsService'

async getDashboard(
  userId: string,
  params?: { deviationPct?: number; staleDays?: number }
) {
  // If no params provided, fetch from user settings
  let deviationPct = params?.deviationPct
  let staleDays = params?.staleDays

  if (deviationPct === undefined || staleDays === undefined) {
    const settings = await settingsService.getSettings(userId)
    deviationPct = deviationPct ?? parseFloat(settings.rebalanceThreshold)
    staleDays = staleDays ?? settings.priceAlertDays
  }

  // ... rest of implementation using deviationPct and staleDays
}
```

### File Structure

```
backend/
├── prisma/
│   └── schema.prisma                    (MODIFY - add settings fields to User)
├── src/
│   ├── routes/
│   │   ├── auth.ts                      (MODIFY - add password change endpoint)
│   │   └── settings.ts                  (NEW)
│   ├── services/
│   │   ├── settingsService.ts           (NEW)
│   │   ├── exportService.ts             (NEW)
│   │   └── dashboardService.ts          (MODIFY - use user settings)
│   ├── validations/
│   │   └── settings.ts                  (NEW)
│   └── index.ts                         (MODIFY - register settings route)

frontend/src/
├── types/
│   └── api.ts                           (MODIFY - add settings types)
├── lib/
│   ├── api.ts                           (MODIFY - add settings and password methods)
│   └── queryKeys.ts                     (MODIFY - add settings keys)
├── features/
│   └── settings/                        (NEW FOLDER)
│       ├── index.tsx                    (NEW - Settings page)
│       ├── index.test.tsx               (NEW)
│       ├── hooks/
│       │   ├── useSettings.ts           (NEW)
│       │   └── useSettings.test.tsx     (NEW)
│       └── components/
│           ├── SettingsForm.tsx         (NEW)
│           ├── SettingsForm.test.tsx    (NEW)
│           ├── ExportSection.tsx        (NEW)
│           ├── ExportSection.test.tsx   (NEW)
│           ├── AccountSection.tsx       (NEW)
│           └── AccountSection.test.tsx  (NEW)
├── components/
│   └── layout/
│       └── Layout.tsx                   (MODIFY - add settings nav link)
└── router.tsx                           (MODIFY - add settings route)
```

### Anti-Patterns to Avoid

```typescript
// NEVER expose password hash
res.json({ data: user }) // WRONG - may include passwordHash
res.json({ data: { email: user.email, ...settings } }) // CORRECT - explicit select

// NEVER allow negative thresholds
z.number().min(1).max(50) // CORRECT - bounded validation

// NEVER compare passwords without bcrypt
if (user.passwordHash === currentPassword) // WRONG - plaintext comparison
if (await bcrypt.compare(currentPassword, user.passwordHash)) // CORRECT

// NEVER skip file cleanup after download
const url = URL.createObjectURL(blob)
a.click()
// WRONG - memory leak
URL.revokeObjectURL(url) // CORRECT - cleanup

// NEVER hardcode settings in dashboard
const dashboard = await dashboardService.getDashboard(userId, { deviationPct: 5 }) // WRONG
const dashboard = await dashboardService.getDashboard(userId) // CORRECT - uses user settings
```

### Testing Requirements

```typescript
// Backend tests
describe('Settings Service', () => {
  it('should get user settings with defaults')
  it('should update rebalance threshold')
  it('should update price alert days')
  it('should validate threshold bounds (1-50)')
  it('should validate days bounds (1-30)')
})

describe('Export Service', () => {
  it('should export all user data as JSON')
  it('should include assets, holdings, transactions, snapshots')
  it('should export CSV as zip file')
  it('should create valid CSV files')
})

describe('GET /api/settings', () => {
  it('should return user settings')
  it('should return defaults for new user')
  it('should require authentication')
})

describe('PUT /api/settings', () => {
  it('should update settings')
  it('should reject invalid threshold')
  it('should reject invalid days')
})

describe('PUT /api/auth/password', () => {
  it('should change password with valid current password')
  it('should reject incorrect current password')
  it('should reject short new password')
  it('should hash new password')
})

// Frontend tests
describe('useSettings', () => {
  it('should fetch settings on mount')
  it('should update settings')
  it('should invalidate dashboard on settings update')
})

describe('SettingsForm', () => {
  it('should display current settings')
  it('should validate input bounds')
  it('should submit updated settings')
  it('should show success toast')
})

describe('ExportSection', () => {
  it('should trigger JSON download')
  it('should trigger CSV download')
  it('should show loading state')
})

describe('AccountSection', () => {
  it('should display user email')
  it('should toggle password form')
  it('should validate password match')
  it('should change password')
})
```

### Key Technical Constraints

- **Settings persistence**: Settings MUST be stored in database, not localStorage
- **Default values**: Database defaults (5%, 7 days) ensure backwards compatibility
- **Dashboard integration**: Dashboard MUST use user settings when no params override
- **Export completeness**: Export MUST include all user data for full backup
- **Password security**: MUST use bcrypt for password comparison and hashing
- **Validation bounds**: Threshold 1-50%, Days 1-30 - reject out of bounds

### Dependencies to Install

```bash
# Backend - for CSV export
cd backend
pnpm add csv-stringify archiver
pnpm add -D @types/archiver
```

### Previous Story Intelligence (6-3-onboarding-wizard)

**Key Patterns from Implementation:**
- Backend route pattern: Express router with async handlers
- Service pattern: Export object with async methods
- Validation pattern: Zod schemas with custom refinements
- Frontend form pattern: React Hook Form + Zod + useEffect for reset
- Toast notifications for success/error feedback
- Card-based layout for sections

**Files to Reference:**
- `backend/src/routes/onboarding.ts` for route structure
- `backend/src/services/onboardingService.ts` for service pattern
- `frontend/src/features/onboarding/` for feature structure
- `frontend/src/features/onboarding/hooks/useOnboarding.ts` for mutation patterns

### Git Patterns from Recent Commits

**Commit message format:**
```
feat(6-4-settings-preferences-management): descriptive message
```

**Branch pattern:**
```
feature/6-4-settings-preferences-management
```

### Project Context Reference

See `_bmad-output/project-context.md` for:
- TypeScript strict mode rules (no `any`)
- Path aliases (`@/features`, `@/lib`, `@/types`)
- Naming conventions (camelCase for files, PascalCase for components)
- API client usage pattern (always through `lib/api.ts`)
- Error handling patterns (`Errors.validation()`, `Errors.notFound()`)
- Backend service/route separation (routes parse request/response, services contain logic)
- Decimal fields returned as strings from API

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-6.4]
- [Source: _bmad-output/planning-artifacts/prd.md#Settings-&-Preferences]
- [Source: _bmad-output/planning-artifacts/prd.md#FR30-FR32]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend-Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Backend-Patterns]
- [Source: frontend/src/features/onboarding/ - Feature structure pattern]
- [Source: backend/src/services/onboardingService.ts - Service pattern]
- [Source: backend/src/routes/dashboard.ts:17-22 - Current threshold usage]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
