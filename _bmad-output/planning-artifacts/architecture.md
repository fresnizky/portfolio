---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - path: '_bmad-output/planning-artifacts/prd.md'
    type: 'prd'
    description: 'Product Requirements Document - Portfolio Tracker (Web App Fintech)'
workflowType: 'architecture'
project_name: 'portfolio'
user_name: 'Fede'
date: '2026-01-06'
lastStep: 8
status: 'complete'
completedAt: '2026-01-06'
stackPreferences:
  frontend: 'React + Vite'
  backend: 'Express (Node.js)'
  database: 'PostgreSQL'
  orchestration: 'Docker Compose + dev-tunnel'
  hosting: 'Local inicial → VPS (mismo servidor)'
versions:
  node: '24.12.0'
  vite: '7.2.7'
  express: '5.x'
  postgresql: '18'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
33 requisitos funcionales organizados en 8 áreas: gestión de portfolio, holdings, transacciones, dashboard, alertas/coaching, histórico, onboarding y configuración. El core del sistema es el tracking de evolución temporal del portfolio con coaching activo para mantener disciplina de inversión.

**Non-Functional Requirements:**
- **Integridad de datos**: Crítico - el histórico es el valor central del producto
- **Performance**: Moderado - dashboard <3s, operaciones <2s (aceptable para uso semanal)
- **Seguridad**: Básica - protección de acceso sin exposición pública
- **Mantenibilidad**: Alta - proyecto personal de largo plazo

**Scale & Complexity:**
- Primary domain: Full-stack Web Application (SPA + REST API + PostgreSQL)
- Complexity level: Medium
- Estimated architectural components: 3 (Frontend, Backend, Database)

### Technical Constraints & Dependencies

| Constraint | Descripción |
|------------|-------------|
| **Stack definido** | React+Vite / Express / PostgreSQL / Docker Compose |
| **Hosting** | Local inicial con dev-tunnel, migración futura a VPS |
| **Usuario único** | Sin multi-tenancy, autenticación simplificada |
| **Sin integraciones** | MVP 100% manual, APIs de brokers en futuro lejano |

### Cross-Cutting Concerns Identified

1. **Validación de negocio**: Reglas como "targets suman 100%" aplicables en múltiples flujos
2. **Cálculos de portfolio**: Lógica de distribución, desviación, valuación reutilizable
3. **Gestión temporal**: Timestamps consistentes para snapshots, transacciones, precios
4. **Estado de datos**: Tracking de "frescura" de precios para alertas

## Starter Template Evaluation

### Primary Technology Domain

Full-stack Web Application con arquitectura de 3 capas dockerizadas:
- Frontend SPA (client-side rendering)
- Backend REST API
- PostgreSQL Database

### Starter Options Considered

**Frontend (React + Vite):**
- ✅ Vite oficial template `react-ts` - Seleccionado
- ❌ Create React App - Deprecated
- ❌ Next.js - Overhead de SSR innecesario para SPA personal

**Backend (Express):**
- ❌ Express Generator - Sin TypeScript, estructura básica
- ✅ Setup manual con TypeScript - Seleccionado para mayor control

**Orquestación:**
- ✅ Docker Compose manual - Integración con dev-tunnel

### Selected Approach: Hybrid (Vite starter + Manual backend)

**Rationale:**
- Vite provee excelente DX con HMR y build optimizado
- Express es minimalista por diseño, setup manual es apropiado
- Docker Compose permite configuración específica para dev-tunnel
- TypeScript en ambas capas para consistencia

**Initialization Commands:**

```bash
# Frontend (desde root del proyecto)
npm create vite@latest frontend -- --template react-ts

# Backend (setup manual)
mkdir backend && cd backend
npm init -y
npm install express cors dotenv
npm install -D typescript @types/express @types/node @types/cors ts-node nodemon

# Database (via Docker Compose)
# Se configura en docker-compose.yml
```

### Architectural Decisions Provided by Starters

**Frontend (Vite react-ts):**
- Language: TypeScript con configuración estricta
- Build: Vite 7.x con Rollup para producción
- Development: HMR instantáneo
- Linting: ESLint configurado
- Estructura: src/ con main.tsx como entry point

**Backend (Manual setup):**
- Language: TypeScript con ts-node para desarrollo
- Runtime: Node.js 24.x con Express 5.x
- Development: nodemon para hot reload
- Estructura: A definir en decisiones arquitectónicas

**Database:**
- PostgreSQL 18 (imagen oficial Docker)
- Volumen persistente para datos

**Technology Versions:**

| Tecnología | Versión |
|------------|---------|
| Node.js | 24.12.0 |
| Vite | 7.2.7 |
| Express | 5.x |
| PostgreSQL | 18 |

**Note:** La inicialización del proyecto y configuración de Docker Compose será la primera historia de implementación.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- ORM y acceso a datos
- Autenticación y seguridad
- Estructura de proyecto

**Important Decisions (Shape Architecture):**
- State management frontend
- Librerías de UI/UX
- Patrones de API

**Deferred Decisions (Post-MVP):**
- Versionado de API
- Backups automatizados
- Monitoreo avanzado

### Data Architecture

| Decisión | Elección | Rationale |
|----------|----------|-----------|
| **ORM** | Prisma (v7+) | Type-safe, migrations maduras, Prisma Studio para visualización, sin overhead Rust en v7 |
| **Migraciones** | Prisma Migrate | Integrado con el ORM, schema declarativo |
| **Validación** | Zod | Runtime validation + TypeScript inference, integrable con React Hook Form |

**Prisma Schema Location:** `backend/prisma/schema.prisma`

**Validation Strategy:**
- Zod schemas compartidos para request/response validation
- Prisma valida integridad a nivel de DB
- Zod valida reglas de negocio (ej: targets suman 100%)

### Authentication & Security

| Decisión | Elección | Rationale |
|----------|----------|-----------|
| **Autenticación** | JWT | Stateless, simple, sin infraestructura adicional |
| **Almacenamiento credentials** | Password hasheada en DB | Usuario único, bcrypt para hashing |
| **Rate Limiting** | express-rate-limit | Protección contra brute force, en memoria |
| **HTTPS** | Via dev-tunnel / nginx | Resuelto por infraestructura existente |
| **CORS** | Configurado para dominio específico | Solo acepta requests del frontend propio |

**JWT Strategy:**
- Access token con expiración corta (15min-1h)
- Refresh token opcional para mejor UX
- Secret en variables de entorno

**Rate Limit Config:**
- Login: 5 intentos por minuto
- API general: 100 requests por minuto

### API & Communication Patterns

| Decisión | Elección | Rationale |
|----------|----------|-----------|
| **Estilo API** | REST | Simple, suficiente para CRUD + cálculos |
| **Documentación** | Sin doc formal | Usuario único, sin API pública |
| **Versionado** | Sin versión inicial | Fácil de agregar después (`/api/v1`) |
| **Estructura de errores** | JSON estándar | `{ error: string, message: string, details?: object }` |
| **Content-Type** | JSON | Estándar para SPA |

**API Structure:**
```
/api/auth/*          - Login, refresh, logout
/api/assets/*        - CRUD de activos
/api/holdings/*      - Gestión de holdings
/api/transactions/*  - Registro de transacciones
/api/contributions/* - Sugerencias de distribución de aportes
/api/snapshots/*     - Histórico y evolución
/api/dashboard/*     - Datos agregados para dashboard
/api/settings/*      - Configuración de usuario
```

### Frontend Architecture

| Decisión | Elección | Rationale |
|----------|----------|-----------|
| **State Management** | Zustand | Liviano, sin boilerplate, API simple |
| **Fetching/Cache** | TanStack Query | Cache automático, loading/error states, refetch inteligente |
| **Estilos** | Tailwind CSS | Utility-first, desarrollo rápido |
| **Componentes UI** | Shadcn/ui | Componentes copiables, customizables, Tailwind-based |
| **Gráficos** | Recharts | React-native, ideal para line/pie charts de portfolio |
| **Formularios** | React Hook Form + Zod | Validación integrada, excelente DX |

**Frontend Structure:**
```
src/
├── components/     # Componentes UI reutilizables
├── features/       # Módulos por feature (dashboard, portfolio, etc.)
├── hooks/          # Custom hooks
├── lib/            # Utilidades, API client, validaciones
├── stores/         # Zustand stores
└── types/          # TypeScript types compartidos
```

### Infrastructure & Deployment

| Decisión | Elección | Rationale |
|----------|----------|-----------|
| **Contenedores** | Docker Compose | 3 servicios: frontend, backend, postgres |
| **Puertos** | Via dev-tunnel | Seguir flujo de `dev-tunnel register portfolio` |
| **Hot Reload** | Volumes + nodemon/vite | Desarrollo sin rebuild de contenedores |
| **Ambiente prod** | Mismo Docker Compose en VPS | Sin cambios de arquitectura |
| **Backups DB** | pg_dump manual inicial | Automatizar post-MVP |
| **Logs** | Console + archivo simple | Sin stack de observabilidad para MVP |
| **Variables de entorno** | .env + .env.ports | Separación de config y puertos dev-tunnel |

**Docker Compose Services:**
```yaml
services:
  frontend:   # React + Vite, puerto PORT_FRONTEND
  backend:    # Express + Prisma, puerto PORT_API
  db:         # PostgreSQL 18, puerto PORT_DB
```

### Decision Impact Analysis

**Implementation Sequence:**
1. Docker Compose + estructura de proyecto
2. PostgreSQL + Prisma schema inicial
3. Backend Express + auth (JWT)
4. Frontend React + routing básico
5. Features por módulo (dashboard, portfolio, etc.)

**Cross-Component Dependencies:**
- Zod schemas: compartidos entre frontend y backend
- Types de Prisma: exportados al frontend para type-safety
- Variables de entorno: .env.ports generado por dev-tunnel

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:** 15+ áreas donde diferentes agentes AI podrían tomar decisiones distintas. Los siguientes patrones aseguran consistencia.

### Naming Patterns

#### Database Naming (Prisma)

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| **Modelos** | PascalCase singular | `Asset`, `Transaction`, `Snapshot` |
| **Campos** | camelCase | `targetPercentage`, `createdAt`, `updatedAt` |
| **Foreign Keys** | camelCase con Id | `assetId`, `userId` |
| **Enums** | PascalCase | `AssetCategory`, `TransactionType` |
| **Índices** | Generados por Prisma | Automático |

```prisma
// Ejemplo correcto
model Asset {
  id               String   @id @default(cuid())
  ticker           String   @unique
  name             String
  category         AssetCategory
  targetPercentage Decimal
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

#### API Naming

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| **Recursos** | Plural, kebab-case | `/api/assets`, `/api/transactions` |
| **Acciones custom** | Verbo en ruta | `/api/portfolio/rebalance`, `/api/snapshots/create` |
| **Parámetros query** | camelCase | `?assetId=1&fromDate=2026-01-01` |
| **IDs en ruta** | `:id` | `/api/assets/:id` |
| **Nested resources** | Evitar más de 2 niveles | `/api/assets/:id/holdings` ✅ |

```typescript
// Ejemplo correcto
GET    /api/assets           // Lista
GET    /api/assets/:id       // Detalle
POST   /api/assets           // Crear
PUT    /api/assets/:id       // Actualizar
DELETE /api/assets/:id       // Eliminar
POST   /api/portfolio/rebalance  // Acción custom
```

#### Code Naming (TypeScript)

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| **Archivos componentes** | PascalCase.tsx | `Dashboard.tsx`, `AssetCard.tsx` |
| **Archivos utils/hooks** | camelCase.ts | `usePortfolio.ts`, `formatCurrency.ts` |
| **Archivos de test** | *.test.ts(x) | `AssetCard.test.tsx` |
| **Componentes React** | PascalCase | `function AssetCard()` |
| **Funciones** | camelCase | `calculateDeviation()`, `formatCurrency()` |
| **Variables** | camelCase | `const totalValue`, `let isLoading` |
| **Constantes** | UPPER_SNAKE_CASE | `const MAX_DEVIATION = 0.05` |
| **Types/Interfaces** | PascalCase | `type Asset`, `interface TransactionInput` |
| **Zod schemas** | camelCase + Schema | `const assetSchema`, `const createTransactionSchema` |

```typescript
// Ejemplo correcto
const MAX_PRICE_AGE_DAYS = 7

interface Asset {
  id: string
  ticker: string
  targetPercentage: number
}

function calculateDeviation(current: number, target: number): number {
  return current - target
}

const AssetCard: React.FC<{ asset: Asset }> = ({ asset }) => {
  // ...
}
```

### Structure Patterns

#### Test Location

| Decisión | Convención |
|----------|------------|
| **Ubicación** | Co-located (junto al archivo) |
| **Naming** | `*.test.ts` o `*.test.tsx` |
| **Mocks** | `__mocks__/` en el mismo directorio si necesario |

```
src/
├── components/
│   ├── AssetCard.tsx
│   └── AssetCard.test.tsx   # ✅ Co-located
├── lib/
│   ├── calculations.ts
│   └── calculations.test.ts  # ✅ Co-located
```

#### Component Organization

| Decisión | Convención |
|----------|------------|
| **Approach** | Feature-based |
| **Shared components** | `src/components/` |
| **Feature-specific** | `src/features/{feature}/components/` |

```
src/
├── components/           # Compartidos (Button, Modal, etc.)
│   └── ui/              # Shadcn components
├── features/
│   ├── dashboard/
│   │   ├── components/  # Componentes específicos del dashboard
│   │   ├── hooks/       # Hooks específicos
│   │   └── index.tsx    # Entry point del feature
│   ├── portfolio/
│   └── transactions/
```

### Format Patterns

#### API Response Format

```typescript
// Success Response
interface SuccessResponse<T> {
  data: T
  message?: string
}

// Error Response
interface ErrorResponse {
  error: string      // Código de error (ej: "VALIDATION_ERROR")
  message: string    // Mensaje legible
  details?: object   // Detalles adicionales (errores de campo, etc.)
}

// Lista con metadata (cuando aplique)
interface ListResponse<T> {
  data: T[]
  meta?: {
    total: number
    page?: number
    limit?: number
  }
}
```

```typescript
// Ejemplos correctos
// Success
{ "data": { "id": "1", "ticker": "VOO" } }

// Error
{ "error": "VALIDATION_ERROR", "message": "Targets must sum to 100%", "details": { "sum": 105 } }

// Lista
{ "data": [...], "meta": { "total": 5 } }
```

#### Date/Time Format

| Contexto | Formato | Ejemplo |
|----------|---------|---------|
| **API (JSON)** | ISO 8601 UTC | `"2026-01-06T15:30:00.000Z"` |
| **Database** | `timestamp with time zone` | Prisma maneja automáticamente |
| **UI Display** | Locale-aware | `formatDate(date, 'es-AR')` |

```typescript
// Backend: siempre retornar ISO strings
return { createdAt: asset.createdAt.toISOString() }

// Frontend: formatear para display
import { format } from 'date-fns'
format(new Date(createdAt), 'dd/MM/yyyy')
```

#### JSON Field Naming

| Regla | Convención |
|-------|------------|
| **Naming** | camelCase |
| **Nulls** | Incluir campo con `null`, no omitir |
| **Booleans** | `true`/`false` |
| **Empty arrays** | `[]` (no null, no omitir) |

```typescript
// Correcto
{ "assetId": "1", "targetPercentage": null, "isActive": true, "transactions": [] }

// Incorrecto
{ "asset_id": "1" }  // snake_case
{ "assetId": "1" }   // omitir targetPercentage si es null
```

### Communication Patterns

#### Zustand Store Pattern

```typescript
// Naming: use[Feature]Store
// Location: src/stores/[feature]Store.ts

import { create } from 'zustand'

interface PortfolioState {
  assets: Asset[]
  isLoading: boolean
  error: string | null
  setAssets: (assets: Asset[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
  assets: [],
  isLoading: false,
  error: null,
  setAssets: (assets) => set({ assets }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}))
```

#### TanStack Query Keys

```typescript
// Naming: [feature, action, params?]
// Location: src/lib/queryKeys.ts

export const queryKeys = {
  assets: {
    all: ['assets'] as const,
    list: () => [...queryKeys.assets.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.assets.all, 'detail', id] as const,
  },
  portfolio: {
    summary: () => ['portfolio', 'summary'] as const,
    history: (from?: string, to?: string) => ['portfolio', 'history', { from, to }] as const,
  },
  transactions: {
    all: ['transactions'] as const,
    list: (filters?: TransactionFilters) => [...queryKeys.transactions.all, 'list', filters] as const,
  },
}

// Uso
const { data } = useQuery({
  queryKey: queryKeys.assets.list(),
  queryFn: () => api.assets.list(),
})
```

### Process Patterns

#### Error Handling (Backend)

```typescript
// src/lib/errors.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public error: string,
    message: string,
    public details?: object
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// Errores predefinidos
export const Errors = {
  validation: (message: string, details?: object) => 
    new AppError(400, 'VALIDATION_ERROR', message, details),
  notFound: (resource: string) => 
    new AppError(404, 'NOT_FOUND', `${resource} not found`),
  unauthorized: () => 
    new AppError(401, 'UNAUTHORIZED', 'Authentication required'),
  forbidden: () => 
    new AppError(403, 'FORBIDDEN', 'Access denied'),
}

// Uso
throw Errors.validation('Targets must sum to 100%', { currentSum: 105 })
```

```typescript
// Middleware de error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.error,
      message: err.message,
      details: err.details,
    })
  }
  
  console.error(err)
  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  })
})
```

#### Error Handling (Frontend)

```typescript
// Error boundary para errores de render (React)
// Toast/notification para errores de API
// Inline errors para validación de formularios

// src/lib/api.ts
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json()
    throw new ApiError(error.error, error.message, error.details)
  }
  const { data } = await response.json()
  return data
}
```

#### Loading States

```typescript
// Naming convention para loading states
interface AsyncState {
  isLoading: boolean      // Operación en progreso
  isError: boolean        // Hubo error
  error: string | null    // Mensaje de error
}

// TanStack Query provee estos estados automáticamente
const { data, isLoading, isError, error } = useQuery(...)

// Para Zustand, seguir el mismo patrón
const { isLoading, setLoading } = usePortfolioStore()
```

### Enforcement Guidelines

**All AI Agents MUST:**

1. ✅ Seguir las convenciones de naming exactamente como se especifican
2. ✅ Usar la estructura de response JSON definida (data/error/message)
3. ✅ Ubicar tests co-located con sus archivos fuente
4. ✅ Usar ISO 8601 para fechas en API, locale-aware en UI
5. ✅ Implementar errores usando la clase AppError
6. ✅ Seguir el patrón de query keys para TanStack Query
7. ✅ Mantener stores de Zustand con el patrón use[Feature]Store

**Pattern Verification:**

- ESLint rules para naming conventions
- TypeScript strict mode para type safety
- Code review checklist basado en estos patrones

### Anti-Patterns to Avoid

```typescript
// ❌ INCORRECTO
const user_id = "1"              // Usar userId
const getuser = () => {}         // Usar getUser
{ "user_name": "Fede" }          // Usar userName
/api/asset                       // Usar /api/assets (plural)
throw new Error("Not found")     // Usar Errors.notFound()

// ✅ CORRECTO
const userId = "1"
const getUser = () => {}
{ "userName": "Fede" }
/api/assets
throw Errors.notFound('Asset')
```

## Project Structure & Boundaries

### Complete Project Directory Structure

```
portfolio/
├── .env.example                    # Template de variables de entorno
├── .env.ports                      # Generado por dev-tunnel (gitignore)
├── .gitignore
├── docker-compose.yml              # Orquestación de servicios
├── docker-compose.dev.yml          # Override para desarrollo (volumes)
├── README.md
│
├── frontend/                       # React + Vite SPA
│   ├── .env.example
│   ├── .gitignore
│   ├── Dockerfile
│   ├── Dockerfile.dev              # Con hot reload
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── public/
│   │   └── favicon.ico
│   └── src/
│       ├── main.tsx                # Entry point
│       ├── App.tsx                 # Root component + routing
│       ├── index.css               # Tailwind imports
│       │
│       ├── components/             # Componentes compartidos
│       │   ├── ui/                 # Shadcn components
│       │   │   ├── Button.tsx
│       │   │   ├── Card.tsx
│       │   │   ├── Input.tsx
│       │   │   ├── Modal.tsx
│       │   │   └── ...
│       │   ├── layout/
│       │   │   ├── Header.tsx
│       │   │   ├── Sidebar.tsx
│       │   │   └── Layout.tsx
│       │   └── common/
│       │       ├── LoadingSpinner.tsx
│       │       ├── ErrorBoundary.tsx
│       │       └── Toast.tsx
│       │
│       ├── features/               # Módulos por funcionalidad
│       │   ├── auth/
│       │   │   ├── components/
│       │   │   │   └── LoginForm.tsx
│       │   │   ├── hooks/
│       │   │   │   └── useAuth.ts
│       │   │   └── index.tsx       # Login page
│       │   │
│       │   ├── dashboard/
│       │   │   ├── components/
│       │   │   │   ├── PortfolioSummary.tsx
│       │   │   │   ├── AllocationChart.tsx
│       │   │   │   ├── DeviationAlerts.tsx
│       │   │   │   └── PriceAgeIndicator.tsx
│       │   │   ├── hooks/
│       │   │   │   └── useDashboard.ts
│       │   │   └── index.tsx       # Dashboard page
│       │   │
│       │   ├── portfolio/
│       │   │   ├── components/
│       │   │   │   ├── AssetList.tsx
│       │   │   │   ├── AssetCard.tsx
│       │   │   │   ├── AssetForm.tsx
│       │   │   │   └── TargetEditor.tsx
│       │   │   ├── hooks/
│       │   │   │   └── useAssets.ts
│       │   │   └── index.tsx       # Portfolio management page
│       │   │
│       │   ├── transactions/
│       │   │   ├── components/
│       │   │   │   ├── TransactionList.tsx
│       │   │   │   ├── TransactionForm.tsx
│       │   │   │   └── TransactionRow.tsx
│       │   │   ├── hooks/
│       │   │   │   └── useTransactions.ts
│       │   │   └── index.tsx       # Transactions page
│       │   │
│       │   ├── contributions/
│       │   │   ├── components/
│       │   │   │   ├── ContributionForm.tsx
│       │   │   │   ├── AllocationSuggestion.tsx
│       │   │   │   └── ContributionSummary.tsx
│       │   │   ├── hooks/
│       │   │   │   └── useContributionSuggestion.ts
│       │   │   └── index.tsx       # Contribution allocation page
│       │   │
│       │   ├── prices/
│       │   │   ├── components/
│       │   │   │   ├── PriceUpdateForm.tsx
│       │   │   │   └── PriceHistory.tsx
│       │   │   └── index.tsx       # Price update page
│       │   │
│       │   ├── evolution/
│       │   │   ├── components/
│       │   │   │   ├── EvolutionChart.tsx
│       │   │   │   └── SnapshotTable.tsx
│       │   │   └── index.tsx       # Historical evolution page
│       │   │
│       │   ├── settings/
│       │   │   ├── components/
│       │   │   │   └── SettingsForm.tsx
│       │   │   └── index.tsx       # Settings page
│       │   │
│       │   └── onboarding/
│       │       ├── components/
│       │       │   ├── WizardStep.tsx
│       │       │   ├── AssetSetup.tsx
│       │       │   ├── TargetSetup.tsx
│       │       │   └── HoldingsSetup.tsx
│       │       └── index.tsx       # Onboarding wizard
│       │
│       ├── hooks/                  # Hooks globales
│       │   ├── useApi.ts
│       │   └── useLocalStorage.ts
│       │
│       ├── lib/                    # Utilidades y configuración
│       │   ├── api.ts              # API client (fetch wrapper)
│       │   ├── queryClient.ts      # TanStack Query config
│       │   ├── queryKeys.ts        # Query key factory
│       │   ├── formatters.ts       # formatCurrency, formatDate, etc.
│       │   ├── calculations.ts     # Cálculos de portfolio compartidos
│       │   └── cn.ts               # Tailwind class merger
│       │
│       ├── stores/                 # Zustand stores
│       │   ├── authStore.ts
│       │   └── uiStore.ts          # Theme, sidebar state, etc.
│       │
│       ├── types/                  # TypeScript types
│       │   ├── api.ts              # API response types
│       │   ├── models.ts           # Domain models
│       │   └── index.ts            # Re-exports
│       │
│       └── validations/            # Zod schemas (compartidos con backend)
│           ├── asset.ts
│           ├── transaction.ts
│           └── settings.ts
│
├── backend/                        # Express + Prisma API
│   ├── .env.example
│   ├── .gitignore
│   ├── Dockerfile
│   ├── Dockerfile.dev              # Con nodemon
│   ├── package.json
│   ├── tsconfig.json
│   ├── nodemon.json
│   │
│   ├── prisma/
│   │   ├── schema.prisma           # Database schema
│   │   ├── migrations/             # Generated migrations
│   │   └── seed.ts                 # Seed data (usuario inicial)
│   │
│   └── src/
│       ├── index.ts                # Entry point
│       ├── app.ts                  # Express app setup
│       │
│       ├── config/                 # Configuración
│       │   ├── env.ts              # Environment variables validation
│       │   ├── database.ts         # Prisma client
│       │   └── cors.ts             # CORS config
│       │
│       ├── middleware/             # Express middleware
│       │   ├── auth.ts             # JWT verification
│       │   ├── errorHandler.ts     # Global error handler
│       │   ├── rateLimiter.ts      # Rate limiting
│       │   └── validate.ts         # Zod validation middleware
│       │
│       ├── routes/                 # Route definitions
│       │   ├── index.ts            # Route aggregator
│       │   ├── auth.ts             # /api/auth/*
│       │   ├── assets.ts           # /api/assets/*
│       │   ├── holdings.ts         # /api/holdings/*
│       │   ├── transactions.ts     # /api/transactions/*
│       │   ├── snapshots.ts        # /api/snapshots/*
│       │   ├── dashboard.ts        # /api/dashboard/*
│       │   └── settings.ts         # /api/settings/*
│       │
│       ├── services/               # Business logic
│       │   ├── authService.ts
│       │   ├── assetService.ts
│       │   ├── holdingService.ts
│       │   ├── transactionService.ts
│       │   ├── contributionService.ts    # Cálculo de distribución de aportes
│       │   ├── snapshotService.ts
│       │   ├── dashboardService.ts
│       │   └── calculationService.ts  # Lógica de cálculos
│       │
│       ├── lib/                    # Utilidades
│       │   ├── errors.ts           # AppError class
│       │   ├── jwt.ts              # JWT utilities
│       │   └── password.ts         # bcrypt utilities
│       │
│       ├── types/                  # TypeScript types
│       │   ├── express.d.ts        # Express type extensions
│       │   └── index.ts
│       │
│       └── validations/            # Zod schemas
│           ├── auth.ts
│           ├── asset.ts
│           ├── transaction.ts
│           └── settings.ts
│
└── shared/                         # Código compartido (opcional)
    └── validations/                # Zod schemas si se quiere DRY
        ├── asset.ts
        └── transaction.ts
```

### Architectural Boundaries

#### API Boundaries

| Boundary | Descripción |
|----------|-------------|
| **External** | `/api/*` - Único punto de entrada HTTP |
| **Auth** | Middleware JWT protege todas las rutas excepto `/api/auth/login` |
| **Rate Limit** | Aplicado a nivel de IP en todas las rutas |
| **CORS** | Solo acepta requests desde el dominio del frontend |

#### Component Boundaries (Frontend)

| Boundary | Regla |
|----------|-------|
| **Features** | Cada feature es autocontenido, no importa de otros features |
| **Components compartidos** | Solo en `src/components/`, usados por múltiples features |
| **Stores** | Cada store es independiente, sin dependencias circulares |
| **API calls** | Solo a través de `src/lib/api.ts`, nunca fetch directo |

#### Service Boundaries (Backend)

| Boundary | Regla |
|----------|-------|
| **Routes** | Solo parsing de request/response, delegan a services |
| **Services** | Contienen lógica de negocio, no acceden a req/res |
| **Prisma** | Solo accedido desde services, nunca desde routes |
| **Validations** | Ejecutadas en middleware antes de llegar a routes |

#### Data Boundaries

| Boundary | Regla |
|----------|-------|
| **Prisma** | Única interfaz con PostgreSQL |
| **Transactions** | Usadas para operaciones que afectan múltiples tablas |
| **Snapshots** | Datos históricos inmutables, solo inserción |

### Requirements to Structure Mapping

| Área Funcional (PRD) | Frontend | Backend |
|---------------------|----------|---------|
| **Portfolio Configuration** (FR1-6) | `features/portfolio/` | `routes/assets.ts`, `services/assetService.ts` |
| **Holdings Management** (FR7-11) | `features/portfolio/`, `features/prices/` | `routes/holdings.ts`, `services/holdingService.ts` |
| **Transaction Recording** (FR12-15) | `features/transactions/` | `routes/transactions.ts`, `services/transactionService.ts` |
| **Dashboard & Visualization** (FR16-20) | `features/dashboard/` | `routes/dashboard.ts`, `services/dashboardService.ts` |
| **Alerts & Coaching** (FR21-23) | `features/dashboard/components/` | `services/calculationService.ts` |
| **Historical Data** (FR24-26) | `features/evolution/` | `routes/snapshots.ts`, `services/snapshotService.ts` |
| **Onboarding** (FR27-29) | `features/onboarding/` | Usa otros services |
| **Settings** (FR30-32) | `features/settings/` | `routes/settings.ts` |
| **Contribution Allocation** (FR34-36) | `features/contributions/` | `routes/contributions.ts`, `services/contributionService.ts` |

### Integration Points

#### Internal Communication

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│  ┌─────────┐    ┌──────────────┐    ┌─────────────────────┐    │
│  │ Zustand │◄──►│ TanStack     │◄──►│ Features/Components │    │
│  │ Stores  │    │ Query Cache  │    │                     │    │
│  └─────────┘    └──────────────┘    └─────────────────────┘    │
│                        │                                        │
│                        ▼                                        │
│                 ┌─────────────┐                                 │
│                 │  API Client │                                 │
│                 │  (lib/api)  │                                 │
│                 └──────┬──────┘                                 │
└────────────────────────┼────────────────────────────────────────┘
                         │ HTTP/JSON
                         ▼
┌────────────────────────┴────────────────────────────────────────┐
│                         BACKEND                                  │
│  ┌──────────────┐    ┌───────────┐    ┌─────────────────────┐   │
│  │  Middleware  │───►│  Routes   │───►│     Services        │   │
│  │ (auth, rate) │    │           │    │  (business logic)   │   │
│  └──────────────┘    └───────────┘    └──────────┬──────────┘   │
│                                                   │              │
│                                                   ▼              │
│                                          ┌───────────────┐       │
│                                          │ Prisma Client │       │
│                                          └───────┬───────┘       │
└──────────────────────────────────────────────────┼───────────────┘
                                                   │
                                                   ▼
                                          ┌───────────────┐
                                          │  PostgreSQL   │
                                          │      18       │
                                          └───────────────┘
```

#### Data Flow

1. **User Action** → React Component
2. **Component** → TanStack Query mutation/query
3. **Query** → API Client (`lib/api.ts`)
4. **API Client** → HTTP Request to Backend
5. **Backend Middleware** → Auth + Rate Limit + Validation
6. **Route** → Service (business logic)
7. **Service** → Prisma (database)
8. **Response** → JSON back through the chain
9. **TanStack Query** → Cache update → Component re-render

### Docker Compose Configuration

```yaml
# docker-compose.yml
services:
  frontend:
    build: ./frontend
    ports:
      - "${PORT_FRONTEND:-10001}:5173"
    environment:
      - VITE_API_URL=http://localhost:${PORT_API:-10002}/api
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "${PORT_API:-10002}:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/portfolio
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    depends_on:
      - db

  db:
    image: postgres:18
    ports:
      - "${PORT_DB:-10003}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=portfolio

volumes:
  postgres_data:
```

```yaml
# docker-compose.dev.yml (override para desarrollo)
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    volumes:
      - ./frontend/src:/app/src
      - ./frontend/public:/app/public

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    volumes:
      - ./backend/src:/app/src
      - ./backend/prisma:/app/prisma
    environment:
      - NODE_ENV=development
```

### Development Workflow

```bash
# Registro inicial del proyecto con dev-tunnel
dev-tunnel register portfolio --path $(pwd)
dev-tunnel env portfolio > .env.ports

# Desarrollo local
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.ports up

# Iniciar túnel para acceso externo
dev-tunnel tunnel start
```

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
Todas las tecnologías seleccionadas son compatibles y forman un stack coherente:
- Frontend: React + Vite + TypeScript + Tailwind + Shadcn/ui + TanStack Query + Zustand
- Backend: Express 5.x + Prisma v7 + Zod
- Infrastructure: Docker Compose + PostgreSQL 18 + dev-tunnel

**Pattern Consistency:**
Los patrones de implementación están alineados con las decisiones tecnológicas y se aplican consistentemente en frontend y backend.

**Structure Alignment:**
La estructura del proyecto soporta todas las decisiones arquitectónicas con boundaries claros y mapeo directo de requisitos a directorios.

### Requirements Coverage Validation ✅

**Functional Requirements Coverage:**
Los 33 requisitos funcionales están cubiertos por la arquitectura:
- 8 áreas funcionales mapeadas a features/services específicos
- Cross-cutting concerns (validación, cálculos) centralizados en services compartidos

**Non-Functional Requirements Coverage:**
Los 13 requisitos no funcionales están arquitectónicamente soportados:
- Data integrity: PostgreSQL + Prisma + Docker volumes
- Performance: SPA + Query cache + DB indexes
- Security: JWT + bcrypt + rate limiting + HTTPS
- Maintainability: TypeScript + modular structure

### Implementation Readiness Validation ✅

**Decision Completeness:**
- ✅ Todas las tecnologías con versiones específicas
- ✅ Patrones de implementación con ejemplos de código
- ✅ Reglas de consistencia claras y aplicables

**Structure Completeness:**
- ✅ Árbol de directorios completo (frontend + backend)
- ✅ Todos los archivos de configuración identificados
- ✅ Boundaries de componentes definidos

**Pattern Completeness:**
- ✅ Naming conventions para DB, API, código
- ✅ Format patterns para responses, fechas, JSON
- ✅ Process patterns para errores y loading states

### Gap Analysis Results

**Critical Gaps:** Ninguno

**Important Gaps (a resolver en implementación):**
- Prisma schema detallado → Primera historia de implementación
- React Router config → Historia de setup frontend

**Nice-to-Have (post-MVP):**
- Testing framework config (Vitest)
- ESLint/Prettier config detallada
- CI/CD pipeline

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Security considerations addressed

**✅ Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**✅ Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** ✅ READY FOR IMPLEMENTATION

**Confidence Level:** Alto

**Key Strengths:**
- Stack moderno y bien integrado
- Patrones claros que previenen conflictos entre agentes AI
- Estructura modular que facilita desarrollo incremental
- Type-safety end-to-end (TypeScript + Prisma + Zod)

**Areas for Future Enhancement:**
- Backups automatizados de PostgreSQL
- Monitoreo y logging estructurado
- Testing e2e con Playwright
- PWA capabilities para mobile

### Implementation Handoff

**AI Agent Guidelines:**
1. Seguir todas las decisiones arquitectónicas exactamente como están documentadas
2. Usar los patrones de implementación consistentemente en todo el código
3. Respetar la estructura del proyecto y los boundaries definidos
4. Referirse a este documento para cualquier duda arquitectónica

**First Implementation Priority:**
```bash
# 1. Crear estructura base del proyecto
# - docker-compose.yml + docker-compose.dev.yml
# - frontend/ (npm create vite@latest frontend -- --template react-ts)
# - backend/ (manual setup con Express + Prisma)

# 2. Configurar PostgreSQL + Prisma schema inicial

# 3. Levantar servicios (deben estar respondiendo para dev-tunnel)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# 4. Registrar proyecto con dev-tunnel (servicios corriendo)
dev-tunnel register portfolio --path $(pwd)
dev-tunnel env portfolio > .env.ports

# 5. Reiniciar con puertos asignados
docker compose down
docker compose --env-file .env.ports up
```

## Architecture Completion Summary

### Workflow Completion

**Architecture Decision Workflow:** COMPLETED ✅
**Total Steps Completed:** 8
**Date Completed:** 2026-01-06
**Document Location:** `_bmad-output/planning-artifacts/architecture.md`

### Final Architecture Deliverables

**📋 Complete Architecture Document**
- Todas las decisiones arquitectónicas documentadas con versiones específicas
- Patrones de implementación que aseguran consistencia entre agentes AI
- Estructura completa del proyecto con todos los archivos y directorios
- Mapeo de requisitos a arquitectura
- Validación confirmando coherencia y completitud

**🏗️ Implementation Ready Foundation**
- 25+ decisiones arquitectónicas tomadas
- 15+ patrones de implementación definidos
- 3 componentes arquitectónicos especificados (Frontend, Backend, Database)
- 33 requisitos funcionales + 13 no funcionales completamente soportados

**📚 AI Agent Implementation Guide**
- Stack tecnológico con versiones verificadas
- Reglas de consistencia que previenen conflictos de implementación
- Estructura del proyecto con boundaries claros
- Patrones de integración y estándares de comunicación

### Development Sequence

1. **Inicializar proyecto** usando los comandos documentados de starter template
2. **Configurar ambiente de desarrollo** según la arquitectura
3. **Implementar foundations** arquitectónicas (Docker, DB, Auth)
4. **Construir features** siguiendo los patrones establecidos
5. **Mantener consistencia** con las reglas documentadas

### Quality Assurance Checklist

**✅ Architecture Coherence**
- [x] Todas las decisiones funcionan juntas sin conflictos
- [x] Las tecnologías elegidas son compatibles
- [x] Los patrones soportan las decisiones arquitectónicas
- [x] La estructura se alinea con todas las elecciones

**✅ Requirements Coverage**
- [x] Todos los requisitos funcionales están soportados
- [x] Todos los requisitos no funcionales están abordados
- [x] Los cross-cutting concerns están manejados
- [x] Los puntos de integración están definidos

**✅ Implementation Readiness**
- [x] Las decisiones son específicas y accionables
- [x] Los patrones previenen conflictos entre agentes
- [x] La estructura es completa y sin ambigüedades
- [x] Se proveen ejemplos para claridad

---

**Architecture Status:** ✅ READY FOR IMPLEMENTATION

**Next Phase:** Comenzar implementación usando las decisiones y patrones arquitectónicos documentados.

**Document Maintenance:** Actualizar esta arquitectura cuando se tomen decisiones técnicas mayores durante la implementación.

