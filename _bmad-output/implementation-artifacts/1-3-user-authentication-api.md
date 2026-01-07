# Story 1.3: User Authentication API

Status: ready-for-dev

## Story

**As a** user,
**I want** to register and login with email/password,
**So that** my portfolio data is protected.

## Acceptance Criteria

1. **AC1: User registration with hashed password**
   - **Given** I am a new user
   - **When** I POST to `/api/auth/register` with valid email and password
   - **Then** a new user is created with bcrypt-hashed password
   - **And** I receive a JWT access token

2. **AC2: User login with JWT token**
   - **Given** I am a registered user
   - **When** I POST to `/api/auth/login` with correct credentials
   - **Then** I receive a JWT access token (15min-1h expiration)

3. **AC3: Failed login handling**
   - **Given** I provide incorrect credentials
   - **When** I POST to `/api/auth/login`
   - **Then** I receive a 401 Unauthorized error
   - **And** after 5 failed attempts in 1 minute, I am rate-limited

4. **AC4: Protected routes with JWT verification**
   - **Given** I have a valid JWT token
   - **When** I include it in Authorization header
   - **Then** protected API routes accept my requests

## Tasks / Subtasks

- [x] Task 1: Install authentication dependencies (AC: 1, 2, 3, 4)
  - [x] Install bcrypt: `pnpm add bcrypt`
  - [x] Install bcrypt types: `pnpm add -D @types/bcrypt`
  - [x] Install jsonwebtoken: `pnpm add jsonwebtoken`
  - [x] Install jsonwebtoken types: `pnpm add -D @types/jsonwebtoken`
  - [x] Install express-rate-limit: `pnpm add express-rate-limit`

- [x] Task 2: Create password utilities (AC: 1, 2)
  - [x] Create `backend/src/lib/password.ts` with hashPassword and verifyPassword functions
  - [x] Use bcrypt with salt rounds 10-12
  - [x] Add tests in `backend/src/lib/password.test.ts`

- [x] Task 3: Create JWT utilities (AC: 2, 4)
  - [x] Create `backend/src/lib/jwt.ts` with generateToken and verifyToken functions
  - [x] Configure JWT_SECRET from environment variable (required)
  - [x] Set token expiration to 1 hour (configurable via JWT_EXPIRES_IN env var)
  - [x] Add tests in `backend/src/lib/jwt.test.ts`

- [x] Task 4: Create Zod validation schemas (AC: 1, 2)
  - [x] Create `backend/src/validations/auth.ts` with registerSchema and loginSchema
  - [x] Email validation: valid email format
  - [x] Password validation: minimum 8 characters
  - [x] Add tests for validation schemas

- [x] Task 5: Create auth service (AC: 1, 2, 3)
  - [x] Create `backend/src/services/authService.ts`
  - [x] Implement `register(email, password)` - hash password, create user, generate token
  - [x] Implement `login(email, password)` - verify credentials, generate token
  - [x] Handle duplicate email error (Prisma unique constraint)
  - [x] Handle invalid credentials error
  - [x] Add tests in `backend/src/services/authService.test.ts`

- [x] Task 6: Create auth middleware (AC: 4)
  - [x] Create `backend/src/middleware/auth.ts` with JWT verification middleware
  - [x] Extract token from `Authorization: Bearer <token>` header
  - [x] Verify token and attach user to request object
  - [x] Return 401 Unauthorized if token is missing or invalid
  - [x] Add TypeScript type extension for Request with user
  - [x] Add tests in `backend/src/middleware/auth.test.ts`

- [x] Task 7: Create rate limiter middleware (AC: 3)
  - [x] Create `backend/src/middleware/rateLimiter.ts`
  - [x] Configure login rate limiter: 5 attempts per minute per IP
  - [x] Configure general API rate limiter: 100 requests per minute per IP
  - [x] Return 429 Too Many Requests with retry-after header

- [x] Task 8: Create auth routes (AC: 1, 2, 3)
  - [x] Create `backend/src/routes/auth.ts`
  - [x] POST `/api/auth/register` - register new user
  - [x] POST `/api/auth/login` - authenticate user
  - [x] Apply auth rate limiter to both routes
  - [x] Use Zod validation middleware for request body
  - [x] Add integration tests in `backend/src/routes/auth.test.ts`

- [ ] Task 9: Update environment configuration (AC: 1, 2, 4)
  - [ ] Add JWT_SECRET to .env.example (required, no default)
  - [ ] Add JWT_EXPIRES_IN to .env.example (default: 1h)
  - [ ] Update `backend/src/config/env.ts` to validate JWT env vars
  - [ ] Update docker-compose.yml with JWT_SECRET placeholder

- [ ] Task 10: Create protected test route (AC: 4)
  - [ ] Create `/api/auth/me` route to verify token and return user data
  - [ ] Apply auth middleware to this route
  - [ ] Return user email and id (not passwordHash)
  - [ ] Add integration test

## Dev Notes

### Technology Stack (from Architecture)

| Component | Technology | Version | Notes |
|-----------|------------|---------|-------|
| Password Hashing | bcrypt | latest | Salt rounds: 10-12 |
| JWT | jsonwebtoken | latest | RS256 not required for single-tenant |
| Rate Limiting | express-rate-limit | latest | In-memory store (single instance) |
| Validation | Zod | (already installed) | From Story 1.2 context |

### Critical Architecture Patterns

**JWT Strategy (from architecture.md):**
- Access token with 15min-1h expiration
- Refresh token optional for better UX (not required for MVP)
- Secret in environment variables

**Rate Limit Config (from architecture.md):**
- Login: 5 attempts per minute per IP
- API general: 100 requests per minute per IP

**Error Response Format (CRITICAL - from architecture.md):**
```typescript
interface ErrorResponse {
  error: string      // Código de error (ej: "VALIDATION_ERROR", "UNAUTHORIZED")
  message: string    // Mensaje legible
  details?: object   // Detalles adicionales
}
```

**AppError Class (already exists from Story 1.1):**
```typescript
// Use existing Errors utility from backend/src/lib/errors.ts
import { Errors } from '@/lib/errors'

throw Errors.validation('Email already registered')
throw Errors.unauthorized()  // 401 - Authentication required
throw Errors.forbidden()     // 403 - Access denied
```

### File Structure to Create

```
backend/src/
├── lib/
│   ├── password.ts           # bcrypt utilities
│   ├── password.test.ts
│   ├── jwt.ts                # JWT utilities
│   └── jwt.test.ts
├── middleware/
│   ├── auth.ts               # JWT verification middleware
│   ├── auth.test.ts
│   ├── rateLimiter.ts        # Rate limiting configuration
│   └── validate.ts           # Zod validation middleware (if not exists)
├── routes/
│   ├── auth.ts               # /api/auth/* routes
│   └── auth.test.ts
├── services/
│   ├── authService.ts        # Authentication business logic
│   └── authService.test.ts
├── validations/
│   └── auth.ts               # Zod schemas for auth
└── types/
    └── express.d.ts          # Request type extension for user
```

### API Endpoints Specification

**POST /api/auth/register**
```typescript
// Request
{
  "email": "user@example.com",
  "password": "securepassword123"
}

// Response (201 Created)
{
  "data": {
    "user": {
      "id": "cuid...",
      "email": "user@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}

// Error (400 - Validation)
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid request body",
  "details": { "email": "Invalid email format" }
}

// Error (409 - Duplicate)
{
  "error": "CONFLICT",
  "message": "Email already registered"
}
```

**POST /api/auth/login**
```typescript
// Request
{
  "email": "user@example.com",
  "password": "securepassword123"
}

// Response (200 OK)
{
  "data": {
    "user": {
      "id": "cuid...",
      "email": "user@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}

// Error (401 - Unauthorized)
{
  "error": "UNAUTHORIZED",
  "message": "Invalid email or password"
}

// Error (429 - Rate Limited)
{
  "error": "TOO_MANY_REQUESTS",
  "message": "Too many login attempts. Try again later.",
  "details": { "retryAfter": 60 }
}
```

**GET /api/auth/me** (Protected)
```typescript
// Headers
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

// Response (200 OK)
{
  "data": {
    "id": "cuid...",
    "email": "user@example.com"
  }
}

// Error (401 - No token)
{
  "error": "UNAUTHORIZED",
  "message": "Authentication required"
}

// Error (401 - Invalid token)
{
  "error": "UNAUTHORIZED",
  "message": "Invalid or expired token"
}
```

### TypeScript Type Extension for Request

```typescript
// backend/src/types/express.d.ts
import { User } from '@prisma/client'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
      }
    }
  }
}

export {}
```

### Zod Validation Schemas

```typescript
// backend/src/validations/auth.ts
import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
```

### Environment Variables

```bash
# Add to .env.example
JWT_SECRET=           # Required - generate with: openssl rand -base64 32
JWT_EXPIRES_IN=1h     # Optional - default 1 hour

# Add to docker-compose.yml backend service environment
- JWT_SECRET=${JWT_SECRET:?JWT_SECRET is required}
- JWT_EXPIRES_IN=${JWT_EXPIRES_IN:-1h}
```

### Previous Story Intelligence (Story 1.2)

**From Story 1.2 Dev Notes and Completion:**
- Prisma 7 is configured with `@prisma/adapter-pg` for PostgreSQL connections
- User model exists with: id (cuid), email (unique), passwordHash, createdAt, updatedAt
- Database client singleton is at `backend/src/config/database.ts`
- Use `prisma` import from database.ts, not direct PrismaClient instantiation
- Tests use Vitest (already configured)
- All tests must pass before marking story complete

**From Story 1.2 Review Follow-ups (apply learnings):**
- Remove any hardcoded secrets from docker-compose.yml
- Use required variable syntax: `${VAR:?error message}` for critical env vars
- Ensure tests verify actual functionality, not just type compilation

**Prisma Client Usage:**
```typescript
import { prisma } from '@/config/database'

// Create user
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    passwordHash: hashedPassword,
  },
})

// Find user by email
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' },
})
```

### Git Intelligence (Recent Commits)

Recent implementation patterns from Story 1.2:
1. Use feature branch: `feature/1-3-user-authentication-api`
2. Commit message format: `feat(1-3): description` or `fix(1-3): description`
3. Update sprint-status.yaml after implementation
4. Story goes through: backlog → ready-for-dev → in-progress → review → done

### Testing Approach

**Test Co-location (from architecture.md):**
All tests are co-located with their source files:
- `password.ts` → `password.test.ts`
- `jwt.ts` → `jwt.test.ts`
- `authService.ts` → `authService.test.ts`

**Test Categories:**
1. **Unit tests** - password.ts, jwt.ts (no DB required)
2. **Integration tests** - authService.ts, auth routes (require DB)

**Running Tests:**
```bash
pnpm test                    # Run all tests
pnpm test password.test.ts   # Single test file
```

**Test Utilities:**
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/config/database'

// Clean up test users after tests
afterAll(async () => {
  await prisma.user.deleteMany({
    where: { email: { startsWith: 'test_' } },
  })
})
```

### Security Considerations

1. **Password Requirements:**
   - Minimum 8 characters (Zod validation)
   - bcrypt with salt rounds 10-12 (balance security/performance)

2. **JWT Security:**
   - Never log tokens
   - Don't include passwordHash in JWT payload
   - Use strong secret (minimum 32 bytes)
   - Set reasonable expiration (1 hour for MVP)

3. **Rate Limiting:**
   - Prevents brute force attacks
   - Per-IP tracking (in-memory for single instance)
   - Clear error message with retry-after

4. **Error Messages:**
   - Don't reveal if email exists (use generic "Invalid email or password")
   - Don't expose stack traces in production

### CRITICAL Reminders for Dev Agent

1. **Use existing patterns** - Don't reinvent error handling, use `Errors` from `lib/errors.ts`
2. **Co-locate tests** - Every new file needs its `.test.ts` companion
3. **Naming conventions** - camelCase for files/functions, PascalCase for types
4. **API response format** - Always wrap in `{ data: ... }` for success
5. **Environment validation** - JWT_SECRET must be required, not optional
6. **Prisma import** - Use `import { prisma } from '@/config/database'`
7. **TypeScript strict** - All types must be explicit, no `any`

### Project Structure Notes

**Alignment with Architecture:**
- Routes at `backend/src/routes/` - follows defined structure
- Services at `backend/src/services/` - business logic separated from routes
- Middleware at `backend/src/middleware/` - follows existing pattern
- Validations at `backend/src/validations/` - Zod schemas centralized

**Import Alias:**
The project uses `@/` alias for `backend/src/`. Use:
```typescript
import { prisma } from '@/config/database'
import { Errors } from '@/lib/errors'
```

### References

- [Source: architecture.md#Authentication-Security] - JWT strategy and rate limiting config
- [Source: architecture.md#API-Communication-Patterns] - Error response format
- [Source: architecture.md#Process-Patterns] - AppError class usage
- [Source: architecture.md#Naming-Patterns] - File and code naming conventions
- [Source: epics.md#Story-1.3] - Original acceptance criteria
- [Source: 1-2-database-schema-prisma-setup.md] - Previous story patterns and Prisma usage
- [Source: prd.md#Security] - NFR8-NFR10 security requirements

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4 (claude-sonnet-4-20250514)

### Debug Log References

### Completion Notes List

- Task 1: Installed authentication dependencies (bcrypt ^6.0.0, jsonwebtoken ^9.0.3, express-rate-limit ^8.2.1) and type definitions (@types/bcrypt ^6.0.0, @types/jsonwebtoken ^9.0.10)
- Task 2: Created password utilities with hashPassword and verifyPassword functions using bcrypt (salt rounds 10). Added 5 unit tests.
- Task 3: Created JWT utilities with generateToken and verifyToken functions. Uses StringValue type from ms for proper typing. Added 7 unit tests.
- Task 4: Created Zod validation schemas using z.email() (Zod 4 API) and z.string().min(). Added 10 unit tests.
- Task 5: Created auth service with register/login methods, AppError class, and Errors factory. Configured test separation (unit vs integration). Added 7 unit tests.
- Task 6: Created auth middleware for JWT verification with Express Request type extension. Added 5 unit tests.
- Task 7: Created rate limiter middleware (authRateLimiter: 5/min, apiRateLimiter: 100/min). Added 4 unit tests.
- Task 8: Created auth routes with Zod validation middleware. Installed supertest. Added 8 tests.

### File List

- backend/package.json (modified)
- backend/pnpm-lock.yaml (modified)
- backend/vitest.config.ts (modified)
- backend/vitest.integration.config.ts (created)
- backend/src/lib/password.ts (created)
- backend/src/lib/password.test.ts (created)
- backend/src/lib/jwt.ts (created)
- backend/src/lib/jwt.test.ts (created)
- backend/src/lib/errors.ts (created)
- backend/src/validations/auth.ts (created)
- backend/src/validations/auth.test.ts (created)
- backend/src/services/authService.ts (created)
- backend/src/services/authService.test.ts (created)
- backend/src/config/database.integration.ts (renamed from database.test.ts)
- backend/src/middleware/auth.ts (created)
- backend/src/middleware/auth.test.ts (created)
- backend/src/types/express.d.ts (created)
- backend/src/middleware/rateLimiter.ts (created)
- backend/src/middleware/rateLimiter.test.ts (created)
- backend/src/middleware/validate.ts (created)
- backend/src/routes/auth.ts (created)
- backend/src/routes/auth.test.ts (created)

## Change Log

| Date | Change |
|------|--------|
| 2026-01-07 | Story created by SM agent with comprehensive context from epics, architecture, and previous story learnings |
| 2026-01-07 | Task 1 completed: Installed auth dependencies (bcrypt, jsonwebtoken, express-rate-limit) and type definitions |
| 2026-01-07 | Task 2 completed: Created password utilities (hashPassword, verifyPassword) with bcrypt and unit tests |
| 2026-01-07 | Task 3 completed: Created JWT utilities (generateToken, verifyToken) with proper StringValue typing and unit tests |
| 2026-01-07 | Task 4 completed: Created Zod validation schemas (registerSchema, loginSchema) using Zod 4 API with unit tests |
| 2026-01-07 | Task 5 completed: Created auth service, AppError/Errors utilities, separated unit/integration tests |
| 2026-01-07 | Task 6 completed: Created auth middleware with JWT verification and Express type extension |
| 2026-01-07 | Task 7 completed: Created rate limiter middleware for auth (5/min) and API (100/min) |
| 2026-01-07 | Task 8 completed: Created auth routes (/register, /login) with Zod validation and rate limiting |
