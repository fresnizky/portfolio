# Story 8.5: Improve Mobile Font Size

Status: done

## Story

As a **user accessing Portfolio Tracker from a mobile device**,
I want **text and labels to be sized appropriately for mobile screens**,
so that **I can read and interact with the app comfortably without straining or zooming**.

## Problem Description

Los tamaños de fuente en la aplicación fueron diseñados principalmente para desktop. En mobile, algunos textos resultan demasiado pequeños para leer cómodamente, especialmente:

- Labels y valores en PositionsList (dashboard)
- Textos secundarios en TransactionCard
- Inputs y labels en formularios
- Estadísticas y porcentajes en cards pequeñas

**Root Cause Analysis:**
1. **Clases de Tailwind estáticas:** Los componentes usan `text-sm`, `text-xs` sin variantes responsivas
2. **Sin breakpoints móviles:** No hay uso de prefijos como `sm:` o `md:` para adaptar tamaños
3. **Diseño desktop-first:** El diseño actual asume pantallas grandes como caso base

**Áreas afectadas identificadas:**
- `features/dashboard/components/PositionsList.tsx` - text-sm/text-xs estáticos
- `features/transactions/components/TransactionCard.tsx` - text-sm/text-xs estáticos
- `features/holdings/components/PositionCard.tsx` - tamaños pequeños
- `features/onboarding/components/*` - inputs y labels
- `features/portfolio/components/AssetCard.tsx` - textos secundarios
- `features/evolution/components/*` - labels de charts

## Acceptance Criteria

1. **Given** I am viewing the dashboard on a mobile device (viewport < 640px)
   **When** I look at the positions list
   **Then** all text (ticker, name, values, percentages) is clearly readable without zooming
   **And** the base font size is at least 16px for primary text

2. **Given** I am viewing transactions on mobile
   **When** I look at transaction cards
   **Then** all labels and values are readable with adequate contrast and size
   **And** the touch targets for interactive elements are at least 44x44px

3. **Given** I am filling out a form on mobile (add transaction, add asset, etc.)
   **When** I interact with input fields
   **Then** labels are readable (minimum 14px)
   **And** input text is at least 16px (prevents iOS auto-zoom)

4. **Given** I am viewing charts (evolution, dashboard distribution)
   **When** I look at chart labels and legends
   **Then** they are readable without squinting

5. **Given** I switch between mobile and desktop views
   **When** I resize the browser window
   **Then** text sizes adjust smoothly using Tailwind's responsive breakpoints

6. **Given** existing functionality on desktop
   **When** I view the app on desktop
   **Then** the UI appearance is unchanged or improved (no regression)

## Tasks / Subtasks

- [x] Task 1: Audit current font sizes across components (AC: #1, #2, #3)
  - [x] 1.1 Create inventory of all `text-sm`, `text-xs`, `text-base` usage in frontend/src
  - [x] 1.2 Identify components with mobile readability issues
  - [x] 1.3 Document current font sizes vs recommended mobile sizes

- [x] Task 2: Implement responsive font sizes in dashboard components (AC: #1)
  - [x] 2.1 Update `PositionsList.tsx` with mobile-first responsive classes
  - [x] 2.2 Update `PortfolioSummaryCard.tsx` for mobile readability
  - [x] 2.3 Update `ExchangeRateIndicator.tsx` for mobile display

- [x] Task 3: Implement responsive font sizes in transaction components (AC: #2)
  - [x] 3.1 Update `TransactionCard.tsx` with responsive text classes
  - [x] 3.2 Update `TransactionForm.tsx` inputs and labels

- [x] Task 4: Implement responsive font sizes in holdings/portfolio components (AC: #1, #2)
  - [x] 4.1 Update `PositionCard.tsx` with mobile-first responsive classes
  - [x] 4.2 Update `AssetCard.tsx` and `AssetForm.tsx` for mobile

- [x] Task 5: Implement responsive font sizes in forms and inputs (AC: #3)
  - [x] 5.1 Update onboarding wizard components (Step1, Step2, Step3)
  - [x] 5.2 Ensure all input fields use minimum 16px font size
  - [x] 5.3 Update label sizes across all form components

- [x] Task 6: Update chart components for mobile (AC: #4)
  - [x] 6.1 Update `EvolutionChart.tsx` label sizes
  - [x] 6.2 Update `EvolutionSummary.tsx` for mobile readability
  - [x] 6.3 Update `CurrencyToggle.tsx` button sizes

- [x] Task 7: Test and verify changes (AC: #5, #6)
  - [x] 7.1 Test on mobile viewport (375px width - iPhone SE)
  - [x] 7.2 Test on tablet viewport (768px width)
  - [x] 7.3 Test on desktop viewport (1280px+)
  - [x] 7.4 Verify no visual regressions on desktop
  - [x] 7.5 Run existing tests to ensure no breakage

## Dev Notes

### Current Implementation Analysis

**Problem Example - PositionsList.tsx:46-53:**
```typescript
// Current: static text-sm/text-xs that's hard to read on mobile
<p className="font-medium text-gray-900">{position.ticker}</p>
<p className="text-sm text-gray-500">{position.name}</p>
// ...
<p className="text-xs text-gray-500">
  ({formatCurrency(position.originalValue, position.originalCurrency)})
</p>
```

**Problem Example - TransactionCard.tsx:37-43:**
```typescript
// Current: text-xs is very small on mobile
<span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${typeStyles[transaction.type]}`}>
  {transaction.type}
</span>
<span className="text-sm font-medium text-gray-500">{transaction.asset.ticker}</span>
```

### Recommended Fix Pattern

Use Tailwind's mobile-first responsive design approach:

```typescript
// FIX: Mobile-first approach - larger on mobile, smaller on desktop
<p className="text-base md:text-sm text-gray-500">{position.name}</p>
<span className="text-sm md:text-xs font-medium">{transaction.type}</span>
```

**Tailwind Font Size Reference:**
| Class | Size | Mobile Recommendation |
|-------|------|----------------------|
| text-xs | 12px | Avoid on mobile, use for desktop only |
| text-sm | 14px | Use for secondary text on mobile |
| text-base | 16px | Use for primary text on mobile (prevents iOS zoom) |
| text-lg | 18px | Use for emphasis on mobile |

**Mobile-First Pattern:**
```css
/* Mobile-first: larger by default, smaller on md+ */
className="text-base md:text-sm"  /* 16px mobile, 14px desktop */
className="text-sm md:text-xs"     /* 14px mobile, 12px desktop */
className="text-lg md:text-base"   /* 18px mobile, 16px desktop */
```

### iOS Safari 16px Rule

**CRITICAL:** iOS Safari auto-zooms inputs with font-size < 16px. All `<input>` elements MUST have at least `text-base` (16px) to prevent this behavior.

```typescript
// WRONG - causes iOS zoom
<input className="text-sm ..." />

// CORRECT - prevents iOS zoom
<input className="text-base ..." />
```

### Architecture Compliance

- **Tailwind CSS:** Use responsive prefixes (`sm:`, `md:`, `lg:`) per architecture doc
- **Mobile-First:** Tailwind is mobile-first by default - unprefixed classes apply to mobile
- **Testing:** Co-located tests in same directory as components
- **No Custom CSS:** Use only Tailwind utility classes, no custom CSS

### Files to Modify

| File | Primary Changes |
|------|-----------------|
| `frontend/src/features/dashboard/components/PositionsList.tsx` | Add responsive text classes |
| `frontend/src/features/dashboard/components/PortfolioSummaryCard.tsx` | Mobile-friendly card text |
| `frontend/src/features/transactions/components/TransactionCard.tsx` | Responsive labels/values |
| `frontend/src/features/transactions/components/TransactionForm.tsx` | Input sizes (16px min) |
| `frontend/src/features/holdings/components/PositionCard.tsx` | Mobile readability |
| `frontend/src/features/portfolio/components/AssetCard.tsx` | Responsive text |
| `frontend/src/features/portfolio/components/AssetForm.tsx` | Form input sizes |
| `frontend/src/features/onboarding/components/Step1AssetSetup.tsx` | Input/label sizes |
| `frontend/src/features/onboarding/components/Step2TargetSetup.tsx` | Input/label sizes |
| `frontend/src/features/onboarding/components/Step3HoldingsSetup.tsx` | Input/label sizes |
| `frontend/src/features/evolution/components/EvolutionChart.tsx` | Chart label sizes |
| `frontend/src/features/evolution/components/EvolutionSummary.tsx` | Summary text sizes |
| `frontend/src/features/evolution/components/CurrencyToggle.tsx` | Toggle button sizes |
| `frontend/src/features/settings/index.tsx` | Settings page text |
| `frontend/src/features/settings/components/*.tsx` | Settings form components |

### Testing Approach

1. **Manual Testing:**
   - Use Chrome DevTools device emulation (iPhone SE, iPhone 12, iPad)
   - Test actual physical device if available
   - Check that text is readable without zooming at 1x scale

2. **Automated Testing:**
   - Existing tests should pass (no functional changes)
   - Consider adding visual regression tests if tooling available

3. **Key Test Scenarios:**
   - Dashboard positions list readability
   - Transaction history readability
   - Form input interactions (no iOS zoom)
   - Chart labels visible

### Previous Story Context

Story 8-4 (Fix BTC Decimal Precision) patterns to follow:
- Simple, targeted changes to existing components
- Pattern: identify problem → minimal fix → verify no regression
- 470 tests passed after changes
- Centralized shared utilities when duplicated (formatQuantity)

This story follows similar pattern: identify text-size issues → apply responsive classes → verify readability.

### Web Research Notes

**Tailwind CSS v4.x Mobile Best Practices (2026):**
- Mobile-first responsive design is default
- Use `sm:`, `md:`, `lg:`, `xl:` breakpoints
- Default breakpoints: sm=640px, md=768px, lg=1024px, xl=1280px
- Avoid `text-xs` (12px) on mobile - prefer `text-sm` (14px) minimum

**iOS Safari Font Size Recommendations:**
- Minimum 16px for form inputs to prevent auto-zoom
- Body text minimum 16px for comfortable reading
- Secondary text minimum 14px

### References

- [Source: Sprint Change Proposal - sprint-change-proposal-2026-01-11.md#line 24] - "Font sizes en mobile son pequeños"
- [Source: Sprint Change Proposal - sprint-change-proposal-2026-01-11.md#line 64] - Priority: Baja
- [Source: frontend/src/features/dashboard/components/PositionsList.tsx:46-53] - Current text-sm/text-xs usage
- [Source: frontend/src/features/transactions/components/TransactionCard.tsx:37-43] - Current text-xs usage
- [Source: Project Context - project-context.md#Frontend Patterns] - Tailwind CSS usage
- [Source: Architecture - architecture.md#Frontend Architecture] - Tailwind CSS + Shadcn/ui

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - Implementation completed without issues

### Completion Notes List

- **Audit completado:** Inventario de 189 usos de text-sm/text-xs en 57 archivos
- **Pattern aplicado:** Mobile-first responsive (`text-base md:text-sm`, `text-sm md:text-xs`)
- **iOS zoom fix:** Todos los inputs ahora usan `text-base` (16px) para prevenir auto-zoom en iOS Safari
- **Tests pasaron:** 470 tests ejecutados sin regresiones
- **Sin cambios funcionales:** Solo cambios de CSS classes, comportamiento idéntico

### File List

**Modified:**
- frontend/src/features/dashboard/components/PositionsList.tsx
- frontend/src/features/dashboard/components/PortfolioSummaryCard.tsx
- frontend/src/features/dashboard/components/ExchangeRateIndicator.tsx
- frontend/src/features/transactions/components/TransactionCard.tsx
- frontend/src/features/transactions/components/TransactionForm.tsx
- frontend/src/features/holdings/components/PositionCard.tsx
- frontend/src/features/portfolio/components/AssetCard.tsx
- frontend/src/features/portfolio/components/AssetForm.tsx
- frontend/src/features/onboarding/components/Step1AssetSetup.tsx
- frontend/src/features/onboarding/components/Step2TargetSetup.tsx
- frontend/src/features/onboarding/components/Step3HoldingsSetup.tsx
- frontend/src/features/evolution/components/EvolutionChart.tsx
- frontend/src/features/evolution/components/EvolutionSummary.tsx
- frontend/src/features/evolution/components/CurrencyToggle.tsx

## Change Log

- **2026-01-12:** Implemented mobile-first responsive font sizes across 14 components. Changed text-sm/text-xs to text-base md:text-sm and text-sm md:text-xs patterns. All form inputs now use text-base (16px) to prevent iOS Safari auto-zoom. 470 tests pass with no regressions.

