# Story 1.2: Database Schema & Prisma Setup

Status: review

## Story

**As a** developer,
**I want** Prisma ORM configured with the initial User model,
**So that** I have a type-safe database layer ready for authentication.

## Acceptance Criteria

1. **AC1: Database migration creates User table**
   - **Given** the backend service is running
   - **When** I run `npx prisma migrate dev`
   - **Then** the User table is created in PostgreSQL with fields: id, email, passwordHash, createdAt, updatedAt

2. **AC2: Prisma generates TypeScript types**
   - **Given** the Prisma schema
   - **When** I run `npx prisma generate`
   - **Then** TypeScript types are generated for the User model

3. **AC3: Prisma client provides type-safe access**
   - **Given** the Prisma client
   - **When** I import it in backend code
   - **Then** I get full TypeScript autocomplete for database operations

## Tasks / Subtasks

- [x] Task 1: Install and configure Prisma (AC: 1, 2, 3)
  - [x] Install Prisma CLI and client: `pnpm add prisma @prisma/client`
  - [x] Install Prisma dev dependency: `pnpm add -D prisma`
  - [x] Run `npx prisma init` to create initial schema
  - [x] Configure datasource for PostgreSQL with DATABASE_URL env var
  - [x] Create `backend/src/config/database.ts` with Prisma client singleton

- [x] Task 2: Create User model schema (AC: 1, 2)
  - [x] Define User model with required fields (id, email, passwordHash, createdAt, updatedAt)
  - [x] Use `@id @default(cuid())` for id field
  - [x] Add `@unique` constraint to email field
  - [x] Add appropriate field types (String, DateTime)
  - [x] Configure `@updatedAt` for automatic timestamp

- [x] Task 3: Run initial migration (AC: 1)
  - [x] Ensure DATABASE_URL is correctly set in .env
  - [x] Run `npx prisma migrate dev --name init-user-model`
  - [x] Verify migration creates User table in PostgreSQL
  - [x] Verify migration files are created in `prisma/migrations/`

- [x] Task 4: Generate Prisma client and verify types (AC: 2, 3)
  - [x] Run `npx prisma generate`
  - [x] Verify types are generated in `node_modules/.prisma/client`
  - [x] Test import and autocomplete in backend code
  - [x] Create a simple test route to verify database connection

- [x] Task 5: Add Prisma scripts to package.json (AC: 1, 2, 3)
  - [x] Add `prisma:generate` script
  - [x] Add `prisma:migrate` script
  - [x] Add `prisma:studio` script
  - [x] Add `db:push` script for quick schema sync
  - [x] Add `postinstall` script to run prisma generate

- [x] Task 6: Update Docker configuration (AC: 1, 2, 3)
  - [x] Update backend Dockerfile.dev to include prisma generate step
  - [x] Update docker-compose.dev.yml to mount prisma folder
  - [x] Add DATABASE_URL to backend service environment
  - [x] Test full Docker workflow with migrations

- [x] Task 7: Create baseline test (AC: 3)
  - [x] Create `backend/src/config/database.test.ts`
  - [x] Test Prisma client can connect to database
  - [x] Test basic CRUD operations compile correctly (type checking)
  - [x] Verify tests pass with `pnpm test`

## Dev Notes

### Technology Stack (from Architecture)

| Component | Technology | Version |
|-----------|------------|---------|
| ORM | Prisma | 7+ (no Rust engine) |
| Database | PostgreSQL | 18 |
| Runtime | Node.js | 24.12.0 |
| Language | TypeScript | 5.x (strict mode) |

### Critical Architecture Patterns

**Prisma Schema Location:** `backend/prisma/schema.prisma`

**User Model Schema:**
```prisma
// backend/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

**Database Client Singleton Pattern:**
```typescript
// backend/src/config/database.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

**Naming Conventions (CRITICAL - from architecture.md):**
| Element | Convention | Example |
|---------|------------|---------|
| Models | PascalCase singular | `User`, `Asset`, `Transaction` |
| Fields | camelCase | `passwordHash`, `createdAt`, `updatedAt` |
| Foreign Keys | camelCase with Id suffix | `userId`, `assetId` |
| IDs | cuid() by default | `@id @default(cuid())` |

### Environment Configuration

**DATABASE_URL Format:**
```
postgresql://portfolio_user:portfolio_pass@db:5432/portfolio
```

**NOTE:** The service name is `db` (not `localhost`) when running inside Docker network.

For local development outside Docker:
```
postgresql://portfolio_user:portfolio_pass@localhost:10003/portfolio
```

### package.json Scripts (add to existing)

```json
{
  "scripts": {
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "db:push": "prisma db push",
    "postinstall": "prisma generate"
  }
}
```

### Docker Considerations

**Volume Mount for Prisma:**
The `prisma/` folder needs to be mounted in docker-compose.dev.yml to persist migrations:
```yaml
services:
  backend:
    volumes:
      - ./backend/src:/app/src
      - ./backend/prisma:/app/prisma  # ADD THIS
```

**Dockerfile.dev Update:**
Add prisma generate after npm install:
```dockerfile
RUN npm install
RUN npx prisma generate  # ADD THIS LINE
```

### Project Structure Notes

**Files to Create:**
```
backend/
├── prisma/
│   ├── schema.prisma           # Prisma schema definition
│   └── migrations/             # Auto-generated by migrate
│       └── {timestamp}_init_user_model/
│           └── migration.sql
└── src/
    └── config/
        └── database.ts         # Prisma client singleton
```

**This story creates ONLY the database foundation. Do NOT create:**
- Authentication logic (Story 1.3)
- Auth routes or middleware (Story 1.3)
- Frontend auth flow (Story 1.4)
- Any other models beyond User

### Previous Story Learnings (Story 1.1)

From the completed scaffolding story:
- Docker Compose is fully functional with `docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.ports up`
- Backend uses `pnpm` as package manager (not npm)
- Hot reload works via nodemon
- PostgreSQL is accessible at PORT_DB (10003)
- Test framework (Vitest) is already configured
- Error handler middleware exists at `backend/src/middleware/errorHandler.ts`
- TypeScript strict mode is enabled

**Port Configuration (from .env.ports):**
- PORT_FRONTEND: 10001
- PORT_API: 10002
- PORT_DB: 10003

### Testing Approach

Tests should be co-located:
- `backend/src/config/database.test.ts` - Test Prisma client connection

**Vitest Configuration:** Already exists at `backend/vitest.config.ts`

**Test Pattern:**
```typescript
import { describe, it, expect } from 'vitest'
import { prisma } from './database'

describe('Database', () => {
  it('should connect to PostgreSQL', async () => {
    // Test connection
    await expect(prisma.$connect()).resolves.not.toThrow()
  })

  it('should have User model with correct fields', () => {
    // Type check - this compiles = types are correct
    const userFields = prisma.user.fields
    expect(userFields).toHaveProperty('id')
    expect(userFields).toHaveProperty('email')
    expect(userFields).toHaveProperty('passwordHash')
    expect(userFields).toHaveProperty('createdAt')
    expect(userFields).toHaveProperty('updatedAt')
  })
})
```

### Verification Commands

```bash
# Inside backend container or with proper DATABASE_URL:
npx prisma migrate dev --name init-user-model
npx prisma generate
npx prisma studio  # Opens visual database browser

# Verify migration applied:
docker exec -it portfolio-db-1 psql -U portfolio_user -d portfolio -c "\dt"
# Should show: public | User | table | portfolio_user

# Verify User table structure:
docker exec -it portfolio-db-1 psql -U portfolio_user -d portfolio -c "\d \"User\""
```

### References

- [Source: architecture.md#Data-Architecture] - Prisma selection and validation strategy
- [Source: architecture.md#Naming-Patterns] - Database naming conventions (PascalCase models, camelCase fields)
- [Source: architecture.md#Project-Structure-Boundaries] - Prisma schema location
- [Source: epics.md#Story-1.2] - Original acceptance criteria
- [Source: project-context.md#Database-Prisma] - Quick reference for Prisma patterns
- [Source: 1-1-project-scaffolding-docker-setup.md] - Previous story context and Docker setup

## Dev Agent Record

### Agent Model Used

Claude 3.5 Sonnet (claude-sonnet-4-20250514)

### Debug Log References

- Prisma 7 requires `@prisma/adapter-pg` for direct PostgreSQL connections (engine type "client" mode)
- `prisma.config.ts` is now required for datasource URL configuration in Prisma 7
- `datasourceUrl` property in schema.prisma is deprecated in Prisma 7 - must use prisma.config.ts instead

### Completion Notes List

- ✅ Installed Prisma 7.2.0 with @prisma/client and @prisma/adapter-pg
- ✅ Created User model with id (cuid), email (unique), passwordHash, createdAt, updatedAt
- ✅ Ran migration `20260107034108_init_user_model` - User table created successfully
- ✅ Generated Prisma client with TypeScript types
- ✅ Created database.ts singleton using pg Pool adapter (required for Prisma 7)
- ✅ Added prisma scripts to package.json (generate, migrate, studio, db:push, postinstall)
- ✅ Updated Dockerfile.dev to copy prisma files before pnpm install
- ✅ Updated docker-compose.dev.yml to mount prisma folder and config
- ✅ Created database.test.ts with connection and type verification tests
- ✅ All tests passing (4 tests total)
- ✅ Docker build and migration status verified

### File List

**New Files:**
- backend/prisma/schema.prisma
- backend/prisma/migrations/20260107034108_init_user_model/migration.sql
- backend/prisma/migrations/migration_lock.toml
- backend/prisma.config.ts
- backend/src/config/database.ts
- backend/src/config/database.test.ts

**Modified Files:**
- backend/package.json (added prisma scripts and dependencies)
- backend/pnpm-lock.yaml (updated dependencies)
- backend/Dockerfile.dev (added prisma copy and generate steps)
- docker-compose.dev.yml (added prisma volume mounts)
- _bmad-output/implementation-artifacts/sprint-status.yaml (status: in-progress → review)

## Change Log

| Date | Change |
|------|--------|
| 2026-01-07 | Initial implementation of Prisma 7 with User model, migrations, and Docker configuration |
