# Story 8.2: Fix Onboarding Detection for Existing Assets

Status: done

## Story

As a **user who already has assets configured in my portfolio**,
I want **the onboarding wizard to not appear when I login**,
so that **I can go directly to the dashboard without unnecessary steps**.

## Problem Description

The onboarding wizard is shown to users even when they already have assets configured in their portfolio. This happens because the onboarding detection logic only checks the `onboardingCompleted` and `onboardingSkipped` flags in the User model, without considering whether the user actually has existing data.

**Error Observed:** User with 5+ assets still sees onboarding wizard after login.

**Root Cause Analysis:**
1. **Detection Logic:** `needsOnboarding` in `useAuth.ts` only checks `onboardingCompleted` and `onboardingSkipped` flags
2. **No Data Check:** Backend `getStatus` in `onboardingService.ts` doesn't check if user has existing assets
3. **Missing Auto-Skip:** No mechanism to auto-complete/skip onboarding when user already has configured portfolio

## Acceptance Criteria

1. **Given** I am a user with existing assets in my portfolio
   **When** I login to the application
   **Then** I am redirected directly to the dashboard (not to onboarding)

2. **Given** I am a user with existing assets AND `onboardingCompleted=false` AND `onboardingSkipped=false`
   **When** the system checks my onboarding status
   **Then** the system detects I have assets and treats onboarding as "not needed"

3. **Given** I am a new user with NO assets
   **When** I login for the first time
   **Then** I am redirected to the onboarding wizard as expected

4. **Given** I complete the onboarding wizard
   **When** I finish all steps
   **Then** the `onboardingCompleted` flag is set to true (existing behavior preserved)

5. **Given** the fix is deployed
   **When** existing users with assets login
   **Then** they go directly to dashboard without any action needed on their part

## Tasks / Subtasks

- [x] Task 1: Update backend onboarding status to check for existing assets (AC: #1, #2, #5)
  - [x] 1.1 Modify `onboardingService.getStatus()` to count user's assets
  - [x] 1.2 Return `{ completed: true, skipped: false, hasExistingData: true }` when user has assets
  - [x] 1.3 Add `hasExistingData` field to `OnboardingStatus` type
  - [x] 1.4 Write unit tests for new detection logic

- [x] Task 2: Update backend route and types (AC: #2)
  - [x] 2.1 Update `/api/onboarding/status` response to include `hasExistingData`
  - [x] 2.2 Update TypeScript types for OnboardingStatus

- [x] Task 3: Update frontend types and logic (AC: #1, #3)
  - [x] 3.1 Update `OnboardingStatus` type in `frontend/src/types/api.ts`
  - [x] 3.2 Update `needsOnboarding` logic in `useAuth.ts` to consider `hasExistingData` (not needed - backend handles it)
  - [x] 3.3 Verify existing onboarding flow still works for new users

- [x] Task 4: Test the complete flow (AC: #1, #3, #4, #5)
  - [x] 4.1 Test user with existing assets goes to dashboard
  - [x] 4.2 Test new user (no assets) goes to onboarding
  - [x] 4.3 Test onboarding completion still works
  - [x] 4.4 Test skip onboarding still works

## Dev Notes

### Current Implementation Analysis

**Backend - onboardingService.ts (lines 14-31):**
```typescript
async getStatus(userId: string): Promise<OnboardingStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      onboardingCompleted: true,
      onboardingSkipped: true,
    },
  })

  if (!user) {
    return { completed: false, skipped: false }
  }

  return {
    completed: user.onboardingCompleted,
    skipped: user.onboardingSkipped,
  }
}
```

**Frontend - useAuth.ts (lines 46-49):**
```typescript
const needsOnboarding = isAuthenticated &&
  onboardingStatus &&
  !onboardingStatus.completed &&
  !onboardingStatus.skipped
```

### Fix Implementation

**Option 1 (Recommended): Backend detects existing data and returns enhanced status**

```typescript
// backend/src/services/onboardingService.ts
async getStatus(userId: string): Promise<OnboardingStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      onboardingCompleted: true,
      onboardingSkipped: true,
      _count: {
        select: { assets: true }
      }
    },
  })

  if (!user) {
    return { completed: false, skipped: false, hasExistingData: false }
  }

  const hasExistingData = user._count.assets > 0

  return {
    completed: user.onboardingCompleted || hasExistingData,
    skipped: user.onboardingSkipped,
    hasExistingData,
  }
}
```

**Option 2: Frontend checks assets separately**
- Less clean, requires additional API call
- Not recommended due to extra latency

### Type Updates

**Backend types:**
```typescript
// backend/src/services/onboardingService.ts
export interface OnboardingStatus {
  completed: boolean
  skipped: boolean
  hasExistingData: boolean
}
```

**Frontend types:**
```typescript
// frontend/src/types/api.ts
export interface OnboardingStatus {
  completed: boolean
  skipped: boolean
  hasExistingData?: boolean  // Optional for backward compatibility
}
```

### Files to Modify

| File | Change |
|------|--------|
| `backend/src/services/onboardingService.ts` | Add asset count check to getStatus |
| `backend/src/routes/onboarding.ts` | No changes needed (uses service) |
| `frontend/src/types/api.ts` | Add `hasExistingData` to OnboardingStatus |
| `frontend/src/features/auth/hooks/useAuth.ts` | No changes needed if backend handles it |

### Testing Approach

1. **Unit Tests (Backend):**
   - Test `getStatus` returns `completed: true` when user has assets
   - Test `getStatus` returns `completed: false` when user has no assets
   - Test existing `markCompleted` and `markSkipped` still work

2. **Integration Tests:**
   - Login with user that has assets -> verify goes to dashboard
   - Login with new user (no assets) -> verify goes to onboarding
   - Complete onboarding -> verify flag is set

### Architecture Compliance

- **Service Layer:** Business logic stays in `onboardingService.ts`
- **Route Layer:** Route just calls service, no business logic
- **Error Handling:** Use existing `Errors` patterns if needed
- **Types:** Maintain consistency between frontend and backend
- **Prisma:** Use `_count` relation for efficient asset counting

### Previous Story Context

Story 8-1 (Fix Mobile Login) was completed successfully. Key learnings:
- CORS middleware was refactored to dedicated file
- `credentials: 'include'` added to all fetch calls
- TypeScript strict mode errors were fixed
- No regressions in existing functionality

These patterns should be followed for consistency.

### Database Schema Reference

```prisma
model User {
  id                  String    @id @default(cuid())
  email               String    @unique
  passwordHash        String
  onboardingCompleted Boolean   @default(false)
  onboardingSkipped   Boolean   @default(false)
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  assets              Asset[]   // Relation to count
  // ... other relations
}

model Asset {
  id               String        @id @default(cuid())
  ticker           String
  name             String
  category         AssetCategory
  currency         Currency      @default(USD)
  targetPercentage Decimal       @db.Decimal(5, 2)
  userId           String
  user             User          @relation(fields: [userId], references: [id])
  // ... other fields
}
```

### References

- [Source: Sprint Change Proposal - sprint-change-proposal-2026-01-11.md#Section 1]
- [Source: Architecture - architecture.md#Onboarding]
- [Source: Project Context - project-context.md#API Patterns]
- [Source: backend/src/services/onboardingService.ts:14-31] - Current getStatus logic
- [Source: frontend/src/features/auth/hooks/useAuth.ts:46-49] - Current needsOnboarding logic
- [Source: Story 8-1 Completion Notes] - Previous story learnings

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

- Backend `onboardingService.getStatus()` now counts user assets using Prisma `_count` relation
- Returns `completed: true` when user has existing assets, even if `onboardingCompleted` flag is false
- Added `hasExistingData` boolean field to `OnboardingStatus` interface (backend and frontend)
- `markCompleted()` and `markSkipped()` also updated to return `hasExistingData`
- Frontend `needsOnboarding` logic unchanged - backend already sets `completed: true` for users with assets
- All 542 backend tests pass, all 460 frontend tests pass
- No regressions detected

### File List

- backend/src/services/onboardingService.ts (modified)
- backend/src/services/onboardingService.test.ts (modified)
- backend/src/routes/onboarding.test.ts (modified)
- frontend/src/types/api.ts (modified)
- _bmad-output/implementation-artifacts/sprint-status.yaml (modified)
- _bmad-output/implementation-artifacts/8-2-fix-onboarding-detection-existing-assets.md (modified)

