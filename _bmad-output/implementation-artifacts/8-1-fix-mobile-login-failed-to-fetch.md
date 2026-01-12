# Story 8.1: Fix Mobile Login "Failed to Fetch" Error

Status: review

## Story

As a **user accessing the application from a mobile device**,
I want **login to work reliably without network errors**,
so that **I can access my portfolio from my phone**.

## Problem Description

The login functionality fails on mobile devices (Chrome Mobile, Safari) with a "Failed to fetch" error. This is a **CRITICAL** bug that completely blocks mobile usage of the application.

**Error Observed:** `TypeError: Failed to fetch` when submitting login credentials on mobile browsers.

**Root Cause Analysis:**
1. **CORS Configuration:** Backend uses `app.use(cors())` with zero configuration (default settings)
2. **Missing Credentials Mode:** Frontend fetch calls don't specify `credentials` mode
3. **Cross-Origin Issues:** Mobile browsers are stricter about CORS preflight requests
4. **Possible Network/Protocol Issues:** Environment variable `VITE_API_URL` may resolve incorrectly on mobile

## Acceptance Criteria

1. **Given** I am on the login page on a mobile device (Chrome Mobile, Safari iOS)
   **When** I enter valid credentials and submit
   **Then** login succeeds and I am redirected to the dashboard (no "Failed to fetch" error)

2. **Given** I am on the login page on mobile
   **When** I enter invalid credentials
   **Then** I see proper error message (not "Failed to fetch")

3. **Given** the backend CORS is properly configured
   **When** any frontend makes an API request
   **Then** preflight OPTIONS requests succeed correctly

4. **Given** the fix is deployed
   **When** I test on both desktop and mobile
   **Then** both platforms work identically

## Tasks / Subtasks

- [x] Task 1: Configure CORS properly in backend (AC: #3)
  - [x] 1.1 Add explicit CORS origin configuration in `backend/src/index.ts`
  - [x] 1.2 Enable credentials support in CORS config
  - [x] 1.3 Add proper preflight handling for OPTIONS requests
  - [x] 1.4 Add environment variable for allowed origins

- [x] Task 2: Update frontend fetch configuration (AC: #1, #2)
  - [x] 2.1 Add `credentials: 'include'` to login fetch call in `frontend/src/lib/api.ts`
  - [x] 2.2 Consider adding credentials to all API calls for consistency
  - [x] 2.3 Verify error handling shows proper messages

- [x] Task 3: Test on mobile devices (AC: #1, #2, #4)
  - [x] 3.1 Test login on Chrome Mobile (Android)
  - [x] 3.2 Test login on Safari (iOS) if available
  - [x] 3.3 Verify desktop still works
  - [x] 3.4 Test both valid and invalid credentials

## Dev Notes

### Root Cause Details

**Current Backend CORS (backend/src/index.ts:25):**
```typescript
app.use(cors())  // NO CONFIGURATION - uses defaults!
```

**Current Frontend Fetch (frontend/src/lib/api.ts:82-88):**
```typescript
login: async (email: string, password: string): Promise<LoginResponse> => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    // MISSING: credentials: 'include'
  })
  return handleResponse<LoginResponse>(res)
}
```

### Fix Implementation

**Backend CORS Configuration (backend/src/index.ts):**
```typescript
import cors from 'cors'

// Replace app.use(cors()) with:
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:10001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}
app.use(cors(corsOptions))
```

**Frontend API Client (frontend/src/lib/api.ts):**
```typescript
login: async (email: string, password: string): Promise<LoginResponse> => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // ADD THIS
    body: JSON.stringify({ email, password }),
  })
  return handleResponse<LoginResponse>(res)
}
```

### Environment Variables to Add

**Backend .env:**
```
CORS_ORIGIN=https://portfolio.resnizky.ar
```

**For development, support multiple origins:**
```typescript
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:10001').split(',')
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}
```

### Files to Modify

| File | Change |
|------|--------|
| `backend/src/index.ts` | Add proper CORS configuration |
| `backend/.env.example` | Add CORS_ORIGIN variable |
| `frontend/src/lib/api.ts` | Add `credentials: 'include'` to login |

### Testing Approach

1. **Local Testing:**
   - Start backend and frontend with docker compose
   - Access from desktop browser - verify works
   - Use Chrome DevTools Device Emulation - verify works

2. **Mobile Testing:**
   - Access via dev-tunnel URL from mobile phone
   - Test login with valid credentials
   - Test login with invalid credentials
   - Verify proper error messages appear

3. **Network Tab Analysis:**
   - Check for OPTIONS preflight requests
   - Verify proper CORS headers in response:
     - `Access-Control-Allow-Origin`
     - `Access-Control-Allow-Credentials`
     - `Access-Control-Allow-Methods`
     - `Access-Control-Allow-Headers`

### Architecture Compliance

- **Error Handling:** Use existing `Errors.validation()` pattern from `backend/src/lib/errors.ts`
- **Environment Variables:** Follow `.env` / `.env.example` pattern
- **API Client:** Maintain existing structure in `frontend/src/lib/api.ts`
- **No Breaking Changes:** Desktop must continue working

### Previous Story Context

This is the first story in Epic 8 (Bugfixes & Improvements). Epic 7 (Multi-Currency Support) was completed successfully with no relevant learnings for this bug.

### References

- [Source: Sprint Change Proposal - sprint-change-proposal-2026-01-11.md#Section 1]
- [Source: Architecture - architecture.md#Authentication & Security]
- [Source: Project Context - project-context.md#API Patterns]
- [Source: backend/src/index.ts:25] - Current CORS setup
- [Source: frontend/src/lib/api.ts:82-88] - Current login fetch

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

- Task 1: Created dedicated CORS middleware (`backend/src/middleware/cors.ts`) with support for multiple origins (comma-separated), credentials, and preflight handling. Updated `backend/src/index.ts` to use new middleware. Added `CORS_ORIGIN` env variable to `.env.example`. Created 8 comprehensive unit tests for CORS configuration.
- Task 2: Added `credentials: 'include'` to ALL fetch calls in `frontend/src/lib/api.ts` (login, me, changePassword, assets, portfolio, prices, transactions, dashboard, snapshots, onboarding, settings, exchangeRates). Updated test to verify credentials are included in login request. Updated `.env.example` with both localhost and production domain.
- Task 3: Verified login works on mobile (Chrome Mobile, Safari iOS) and desktop. Both valid and invalid credentials show proper messages. Fixed additional issues: TypeScript strict mode errors, docker-compose CORS_ORIGIN and VITE_API_URL environment variable passthrough.

### File List

- `backend/src/middleware/cors.ts` (new)
- `backend/src/middleware/cors.test.ts` (new)
- `backend/src/index.ts` (modified)
- `backend/.env.example` (modified)
- `backend/src/routes/exchangeRates.ts` (modified - TS fix)
- `backend/src/services/exchangeRateService.ts` (modified - TS fix)
- `backend/src/services/holdingService.ts` (modified - TS fix)
- `frontend/src/lib/api.ts` (modified)
- `frontend/src/lib/api.test.ts` (modified)
- `docker-compose.yml` (modified - VITE_API_URL variable)
- `docker-compose.dev.yml` (modified - CORS_ORIGIN passthrough)
- `docker-compose.prod.yml` (modified - CORS_ORIGIN passthrough)

