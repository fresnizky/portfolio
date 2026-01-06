# AGENTS.md - Portfolio Tracker

Guidelines for AI coding agents working on this codebase.

## Project Overview

Fintech web app for personal investment portfolio tracking:
- **Frontend**: React + Vite + TypeScript SPA (`frontend/`)
- **Backend**: Express 5.x + TypeScript + Prisma ORM (`backend/`)
- **Database**: PostgreSQL 18
- **Orchestration**: Docker Compose with dev-tunnel integration

## Build, Lint, and Test Commands

### Docker Development

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.ports up
```

### Frontend (`frontend/` directory)

```bash
pnpm dev              # Start dev server with HMR
pnpm build            # Production build
pnpm lint             # Run ESLint
pnpm typecheck        # TypeScript type checking
pnpm test             # Run all tests (Vitest)
pnpm test <file>      # Single test (e.g., pnpm test AssetCard.test.tsx)
```

### Backend (`backend/` directory)

```bash
pnpm dev              # Start with nodemon (hot reload)
pnpm build            # Compile TypeScript
pnpm lint             # Run ESLint
pnpm typecheck        # TypeScript type checking
pnpm test             # Run all tests (Vitest)
pnpm test <file>      # Single test (e.g., pnpm test assetService.test.ts)
```

### Prisma (`backend/` directory)

```bash
pnpm prisma generate       # Generate Prisma client
pnpm prisma migrate dev    # Run migrations (development)
pnpm prisma studio         # Open Prisma Studio GUI
```

## Code Style Guidelines

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Component files | PascalCase.tsx | `AssetCard.tsx` |
| Utils/hooks files | camelCase.ts | `usePortfolio.ts` |
| Test files | *.test.ts(x) | `AssetCard.test.tsx` |
| React components | PascalCase | `function AssetCard()` |
| Functions/variables | camelCase | `calculateDeviation` |
| Constants | UPPER_SNAKE_CASE | `MAX_DEVIATION` |
| Types/Interfaces | PascalCase | `interface Asset` |
| Prisma models | PascalCase singular | `Asset`, `Transaction` |
| API routes | plural | `/api/assets` |

### Import Order

```typescript
// 1. React/framework imports
import React, { useState } from 'react'

// 2. Third-party libraries
import { z } from 'zod'

// 3. Internal absolute imports (@/ alias)
import { Button } from '@/components/ui/Button'

// 4. Relative imports
import { AssetCard } from './AssetCard'
```

### Formatting

- **Indentation**: 2 spaces
- **Quotes**: Single quotes
- **Semicolons**: None
- **Line length**: 100 chars max

### API Response Format

```typescript
// Success: { data: T, message?: string }
// Error: { error: string, message: string, details?: object }
```

### Error Handling (Backend)

```typescript
import { Errors } from '@/lib/errors'

throw Errors.notFound('Asset')
throw Errors.validation('Targets must sum to 100%', { currentSum: 105 })
```

### Date/Time

- API: ISO 8601 UTC (`"2026-01-06T15:30:00.000Z"`)
- UI Display: Locale-aware (`format(date, 'dd/MM/yyyy')`)

## Project Structure

```
frontend/src/
├── components/       # Shared UI (ui/, layout/, common/)
├── features/         # Feature modules (dashboard, portfolio, etc.)
├── hooks/            # Global hooks
├── lib/              # API client, utilities
├── stores/           # Zustand stores
├── types/            # TypeScript types
└── validations/      # Zod schemas

backend/src/
├── config/           # Environment, database
├── middleware/       # Auth, error handler, validation
├── routes/           # Express handlers
├── services/         # Business logic
├── lib/              # Utilities (errors, jwt)
└── validations/      # Zod schemas
```

### Test Location

Tests are **co-located** with source files:
```
AssetCard.tsx → AssetCard.test.tsx
calculations.ts → calculations.test.ts
```

## Key Patterns

### Zustand Stores
```typescript
// Naming: use[Feature]Store in src/stores/[feature]Store.ts
export const usePortfolioStore = create<PortfolioState>((set) => ({...}))
```

### TanStack Query Keys
```typescript
// Location: src/lib/queryKeys.ts
export const queryKeys = {
  assets: { all: ['assets'], list: () => [...queryKeys.assets.all, 'list'] }
}
```

## Anti-Patterns to Avoid

```typescript
// WRONG                          // RIGHT
const user_id = "1"               const userId = "1"
/api/asset                        /api/assets
throw new Error("Not found")      throw Errors.notFound('Asset')
import '../../../Button'          import '@/components/ui/Button'
```

## Environment Setup

```bash
# First-time setup
dev-tunnel register portfolio --path $(pwd)
dev-tunnel env portfolio > .env.ports
cp .env.example .env
```

### Port Assignments

| Service | Variable | Default |
|---------|----------|---------|
| Frontend | PORT_FRONTEND | 10001 |
| Backend | PORT_API | 10002 |
| PostgreSQL | PORT_DB | 10003 |

## Key Dependencies

**Frontend**: React 19, Vite 7, TanStack Query, Zustand, Tailwind + Shadcn/ui, React Hook Form + Zod

**Backend**: Express 5, Node 24, Prisma v7, Zod, bcrypt, jsonwebtoken
