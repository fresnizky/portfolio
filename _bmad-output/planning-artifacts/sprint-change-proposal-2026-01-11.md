# Sprint Change Proposal - Multi-Currency & Bugfixes

**Date:** 2026-01-11
**Author:** John (PM Agent)
**Status:** Pending Approval
**Requested by:** Fede

---

## Section 1: Issue Summary

### Problem Statement

Durante el uso de Portfolio Tracker se identificaron las siguientes necesidades:

1. **Multi-Currency Support:** Los activos del portfolio están en diferentes monedas (USD para ETFs internacionales, ARS para FCIs locales como Adcap Acciones). Actualmente no hay forma de trackear esto correctamente ni ver el valor total en ambas monedas.

2. **Bugs Críticos:** Se detectaron varios bugs que afectan la usabilidad:
   - Login desde mobile falla con "Failed to fetch"
   - Onboarding se muestra incluso cuando ya hay assets configurados
   - Formato de fecha en transacciones genera errores
   - Precisión decimal insuficiente para BTC (necesita 8 decimales)
   - Font sizes en mobile son pequeños

### Context

- El soporte multi-moneda estaba planificado como "Growth Feature (Post-MVP)" pero es necesidad real del día a día
- Los bugs fueron descubiertos durante testing de regresión manual
- El bug de mobile login es bloqueante para uso desde teléfono

### Evidence

- Usuario tiene activo "Adcap Acciones" en ARS mientras el resto está en USD
- Error "Failed to fetch" reproducido en Chrome Mobile
- Onboarding wizard aparece después de tener 5+ assets configurados

---

## Section 2: Impact Analysis

### Epic Impact

| Epic | Estado Actual | Impacto |
|------|---------------|---------|
| Epic 1-6 | Done/Review | Sin cambios |
| **Epic 7** | **NUEVO** | Multi-Currency Support |
| **Epic 8** | **NUEVO** | Bugfixes & Improvements |

### Story Impact

**Nuevas Stories:**

| Epic | Story | Descripción | Prioridad |
|------|-------|-------------|-----------|
| 7 | 7.1 | Currency field on Asset model | Alta |
| 7 | 7.2 | Exchange Rate API Integration (dolarapi.com) | Alta |
| 7 | 7.3 | Dashboard multi-currency display | Alta |
| 7 | 7.4 | Evolution chart currency toggle | Media |
| 7 | 7.5 | Exchange rate settings & preferences | Media |
| 8 | 8.1 | Fix mobile login "Failed to fetch" | **CRÍTICA** |
| 8 | 8.2 | Fix onboarding detection | Alta |
| 8 | 8.3 | Fix transaction date format | Alta |
| 8 | 8.4 | Fix BTC decimal precision | Media |
| 8 | 8.5 | Improve mobile font size | Baja |

### Artifact Conflicts

| Artifact | Cambios Requeridos |
|----------|-------------------|
| **PRD** | Mover multi-moneda de Growth a MVP, agregar FR34-FR39 |
| **Architecture** | Agregar Currency enum, ExchangeRate model, API integration |
| **Epics** | Agregar Epic 7 y Epic 8 con 10 stories totales |
| **Sprint Status** | Agregar nuevos epics y stories al tracking |

### Technical Impact

**Database Changes:**
- Nueva tabla `ExchangeRate`
- Nuevo campo `currency` en `Asset`
- Cambio de precisión decimal en `Holding.quantity` y `Transaction.quantity`

**New Dependencies:**
- API externa: dolarapi.com (tipo de cambio oficial)

**Code Changes:**
- Backend: Nuevos services (exchangeRateService), nuevas rutas (/api/exchange-rates)
- Frontend: Currency toggle en dashboard y evolution, settings de moneda
- Infra: Posible fix de CORS/HTTPS para mobile

---

## Section 3: Recommended Approach

### Chosen Path: Direct Adjustment

Agregar Epic 7 y Epic 8 al backlog sin modificar trabajo existente.

### Rationale

1. **No hay rollback necesario** - Los epics 1-6 están completos y funcionando
2. **Scope claro** - Los nuevos requisitos están bien definidos
3. **Priorización clara** - Bugs críticos primero, luego features

### Implementation Order Recommended

```
Phase 1: Critical Bugfixes (Epic 8.1)
├── 8.1 Mobile login fix (CRÍTICA - desbloquea mobile)

Phase 2: High Priority Bugfixes (Epic 8.2-8.3)
├── 8.2 Onboarding detection fix
└── 8.3 Transaction date format fix

Phase 3: Multi-Currency Core (Epic 7.1-7.3)
├── 7.1 Currency field on Asset
├── 7.2 Exchange Rate API
└── 7.3 Dashboard multi-currency

Phase 4: Multi-Currency Polish (Epic 7.4-7.5)
├── 7.4 Evolution chart toggle
└── 7.5 Settings & preferences

Phase 5: Remaining Fixes (Epic 8.4-8.5)
├── 8.4 BTC decimal precision
└── 8.5 Mobile font size
```

### Effort Estimate

| Epic | Stories | Effort |
|------|---------|--------|
| Epic 7 | 5 | Medium-Large |
| Epic 8 | 5 | Small-Medium |

### Risk Assessment

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| dolarapi.com downtime | Baja | Medio | Fallback a rate manual |
| Mobile bug complejo | Media | Alto | Investigar CORS/HTTPS primero |
| Migración de datos | Baja | Medio | Default USD para assets existentes |

---

## Section 4: Detailed Change Proposals

### 4.1 PRD Changes

**File:** `_bmad-output/planning-artifacts/prd.md`

#### Change 4.1.1: Remove from Growth Features

```markdown
OLD (line ~183):
- Multi-moneda con conversión automática (USD/ARS)

NEW:
[REMOVE LINE - moved to MVP]
```

#### Change 4.1.2: Add New Functional Requirements

```markdown
ADD after FR33:

### Multi-Currency Support

- FR34: Usuario puede asignar una moneda (USD/ARS) a cada activo
- FR35: Sistema obtiene tipo de cambio USD/ARS automáticamente via API externa (1x/hora durante horario de mercado)
- FR36: Usuario puede forzar actualización manual del tipo de cambio en cualquier momento
- FR37: Dashboard muestra valor total del portfolio en ambas monedas (USD y ARS)
- FR38: Gráfico de evolución puede mostrarse en USD o ARS mediante toggle
- FR39: Snapshots guardan valores en ambas monedas para histórico preciso
```

---

### 4.2 Architecture Changes

**File:** `_bmad-output/planning-artifacts/architecture.md`

#### Change 4.2.1: Add Currency Enum and ExchangeRate Model

```prisma
// ADD to Prisma schema examples

enum Currency {
  USD
  ARS
}

model Asset {
  // ... existing fields
  currency Currency @default(USD)  // NEW FIELD
}

model ExchangeRate {
  id           String   @id @default(cuid())
  fromCurrency Currency
  toCurrency   Currency
  rate         Decimal  @db.Decimal(18, 6)
  source       String   // "dolarapi", "manual"
  fetchedAt    DateTime @default(now())
  createdAt    DateTime @default(now())

  @@unique([fromCurrency, toCurrency])
}
```

#### Change 4.2.2: Add Exchange Rate API Endpoint

```markdown
ADD to API Structure:

/api/exchange-rates/* - Tipos de cambio (NEW)
```

#### Change 4.2.3: Add External API Integration Section

```markdown
ADD new section "External API Integrations":

| API | Uso | Endpoint | Rate Limit |
|-----|-----|----------|------------|
| dolarapi.com | Tipo de cambio USD/ARS oficial | https://dolarapi.com/v1/dolares/oficial | 1x/hora |

Usar campo `venta` para conversión.
```

---

### 4.3 Epics Changes

**File:** `_bmad-output/planning-artifacts/epics.md`

#### Change 4.3.1: Add Epic 7 - Multi-Currency Support

[Full epic content as approved in Proposal 3]

- Story 7.1: Currency Field on Asset Model
- Story 7.2: Exchange Rate API Integration
- Story 7.3: Dashboard Multi-Currency Display
- Story 7.4: Evolution Chart Currency Toggle
- Story 7.5: Exchange Rate Settings & Preferences

#### Change 4.3.2: Add Epic 8 - Bugfixes & Improvements

[Full epic content as approved in Proposal 4]

- Story 8.1: Fix Mobile Login "Failed to Fetch" Error (CRÍTICA)
- Story 8.2: Fix Onboarding Detection for Existing Assets
- Story 8.3: Fix Transaction Date Format Validation
- Story 8.4: Fix BTC Decimal Precision
- Story 8.5: Improve Mobile Font Size

#### Change 4.3.3: Update FR Coverage Map

```markdown
ADD to FR Coverage Map:

| FR | Epic | Descripción |
|----|------|-------------|
| FR34 | Epic 7 | Asignar moneda a activo |
| FR35 | Epic 7 | Obtener tipo de cambio via API |
| FR36 | Epic 7 | Actualización manual tipo de cambio |
| FR37 | Epic 7 | Dashboard en ambas monedas |
| FR38 | Epic 7 | Gráfico evolución con toggle moneda |
| FR39 | Epic 7 | Snapshots en ambas monedas |
| BUG-1 | Epic 8 | Fix mobile login |
| BUG-2 | Epic 8 | Fix onboarding detection |
| BUG-3 | Epic 8 | Fix transaction date format |
| BUG-4 | Epic 8 | Fix BTC decimal precision |
| IMP-1 | Epic 8 | Mobile font size improvement |
```

---

## Section 5: Implementation Handoff

### Change Scope Classification

**Scope: MODERATE**

Requires backlog reorganization and sprint planning updates.

### Handoff Recipients

| Recipient | Responsibility |
|-----------|---------------|
| **SM (Scrum Master)** | Update sprint-status.yaml, create story files |
| **Dev Agent** | Implement stories following priority order |
| **TEA (Test Architect)** | Update test scenarios for new features |

### Deliverables

1. ✅ Sprint Change Proposal document (this file)
2. ⏳ Updated PRD with FR34-FR39
3. ⏳ Updated Architecture with Currency support
4. ⏳ Updated Epics with Epic 7 and Epic 8
5. ⏳ Updated sprint-status.yaml with new entries

### Success Criteria

- [ ] All PRD, Architecture, Epics files updated
- [ ] sprint-status.yaml includes Epic 7 and Epic 8
- [ ] Story files created for all 10 new stories
- [ ] Bug 8.1 (mobile login) resolved and verified on mobile device
- [ ] Multi-currency displaying correctly on dashboard
- [ ] Exchange rate fetching from dolarapi.com working

### Next Steps

1. **User Approval** of this Sprint Change Proposal
2. **SM Agent** updates sprint-status.yaml
3. **SM Agent** creates individual story files
4. **Dev Agent** implements starting with 8.1 (critical bug)

---

## Approval

**Status:** ✅ APPROVED

**Approved by:** Fede

**Date:** 2026-01-11
