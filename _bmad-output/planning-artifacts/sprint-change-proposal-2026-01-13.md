# Sprint Change Proposal - Decimal Precision & Data Quality

**Fecha:** 2026-01-13
**Autor:** Fede + BMad Correct Course Workflow
**Status:** ✅ Approved (2026-01-13)

---

## 1. Issue Summary

### Problem Statement

La aplicación Portfolio Tracker tiene problemas críticos de precisión numérica y un bug en el dashboard que afectan la funcionalidad core:

1. **Datos corrompidos en transacciones**: Cantidades con alta precisión decimal (ej: 0.00000001 BTC) se truncan o guardan como 0
2. **Modelo de datos inadecuado**: El uso de `*Cents` (Int) asume 2 decimales para todos los activos, incompatible con crypto (8-18 decimales)
3. **Dashboard muestra $0.00**: Cuando un asset no tiene precio configurado, el dashboard muestra métricas engañosas (-100% deviation)
4. **UI de transacciones subóptima**: Vista en cards dificulta escanear múltiples transacciones

### Discovery Context

- **Trigger**: Testing de uso real post-implementación de Epic 8
- **Evidencia**: Datos en Prisma Studio mostrando `quantity: 0.00000000` y `totalCents: 0` para transacciones válidas
- **Impacto**: Integridad de datos comprometida (NFR1-NFR4)

---

## 2. Impact Analysis

### Epic Impact

| Epic | Impacto |
|------|---------|
| Epic 4 (Transactions) | Stories 4-1, 4-2, 4-3 requieren actualización |
| Epic 5 (Dashboard) | Story 5-1, 5-2 requieren fix |
| Epic 3 (Holdings) | Story 3-2, 3-3 afectadas por cambio de schema |
| **Nuevo Epic 9** | Requerido para implementar fixes |

### Story Impact

**Stories existentes afectadas:**
- 4-1-transaction-recording-api: Cambiar modelo de datos
- 4-3-transaction-history-ui: Cambiar de cards a tabla
- 5-1-dashboard-summary-api: Fix cálculo con price=null
- 5-2-dashboard-ui: Mostrar estado correcto para assets sin precio

### Artifact Conflicts

| Artifact | Cambio Necesario |
|----------|------------------|
| `schema.prisma` | Migrar `*Cents: Int` → `Decimal`, agregar `decimalPlaces` |
| Architecture.md | Actualizar patrones de response (eliminar *Cents) |
| Zod validations | Agregar validación de precisión por asset |
| Frontend types | Actualizar interfaces |
| API contracts | Breaking change: `priceCents` → `price` |

### Technical Impact

- **Database migration**: Requiere migración de schema y datos
- **Breaking changes**: API responses cambian estructura
- **Data cleanup**: Transacciones corruptas deben identificarse/eliminarse

---

## 3. Recommended Approach

### Selected Path: Direct Adjustment

Crear un nuevo **Epic 9: Decimal Precision & Data Quality** con stories específicas para cada fix.

### Rationale

- Cambios bien definidos y acotados
- No requiere revertir trabajo existente
- No cambia scope del MVP
- Mejora calidad del producto sin agregar features

### Effort & Risk Assessment

| Aspecto | Evaluación |
|---------|------------|
| **Effort** | Medium (3-5 stories) |
| **Risk** | Low - cambios bien definidos |
| **Timeline** | 1 sprint |
| **Dependencies** | Ninguna externa |

---

## 4. Detailed Change Proposals

### 4.1 Schema Migration

**Archivo:** `backend/prisma/schema.prisma`

```prisma
// ANTES
model Transaction {
  priceCents      Int
  quantity        Decimal
  totalCents      Int
  commissionCents Int
}

// DESPUÉS
model Asset {
  // ... campos existentes
  decimalPlaces    Int      @default(2)  // 2=USD, 8=BTC, 6=FCI
}

model Transaction {
  price       Decimal   // Precio por unidad
  quantity    Decimal   // Cantidad
  total       Decimal   // price × quantity
  commission  Decimal   @default(0)
}
```

### 4.2 Default decimalPlaces por Categoría

```typescript
const DEFAULT_DECIMAL_PLACES: Record<AssetCategory, number> = {
  CRYPTO: 8,      // BTC, ETH
  ETF: 4,         // Acciones fraccionarias
  FCI: 6,         // Cuotapartes argentinas
  CASH: 2,        // USD, ARS
  STOCK: 0,       // Acciones enteras
}
```

### 4.3 Validación de Precisión

```typescript
async function validateTransactionPrecision(
  assetId: string,
  quantity: number
): Promise<void> {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } })
  const decimalPlaces = countDecimals(quantity)

  if (decimalPlaces > asset.decimalPlaces) {
    throw Errors.validation(
      `${asset.ticker} only supports ${asset.decimalPlaces} decimal places`,
      { provided: decimalPlaces, max: asset.decimalPlaces }
    )
  }
}
```

### 4.4 Data Migration

```sql
-- Agregar decimalPlaces
ALTER TABLE "Asset" ADD COLUMN "decimalPlaces" INTEGER NOT NULL DEFAULT 2;

-- Migrar Transaction columns
ALTER TABLE "Transaction" RENAME COLUMN "priceCents" TO "price";
ALTER TABLE "Transaction" ALTER COLUMN "price" TYPE DECIMAL;
-- (similar para total, commission)

-- Convertir centavos a decimales
UPDATE "Transaction" SET price = price / 100, total = total / 100, commission = commission / 100;
```

### 4.5 Frontend Formatters

```typescript
function formatQuantity(value: number, decimalPlaces: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimalPlaces
  })
}
```

### 4.6 Transactions Table UI

Cambiar de grid de cards a tabla con columnas:
- Fecha | Tipo | Asset | Cantidad | Precio | Comisión | Total

### 4.7 Dashboard Fix

```typescript
// Manejar assets sin precio
const positions = holdings.map(h => ({
  ...h,
  value: h.asset.currentPrice ? h.quantity.mul(h.asset.currentPrice) : null,
  priceStatus: h.asset.currentPrice ? 'set' : 'missing'
}))

// UI muestra "Set price to calculate" en vez de "0.00%"
```

### 4.8 Backend API & Types Update

Actualizar toda la capa de backend para usar los nuevos nombres de campos:

**Archivos:**
- `backend/src/routes/transactions.ts`
- `backend/src/services/transactionService.ts`
- `backend/src/validations/transaction.ts`
- `shared/validations/*.ts` (si existe)

```typescript
// Zod schema ANTES
const createTransactionSchema = z.object({
  priceCents: z.number().int().positive(),
  commissionCents: z.number().int().min(0).default(0),
})

// Zod schema DESPUÉS
const createTransactionSchema = z.object({
  price: z.number().positive(),
  commission: z.number().min(0).default(0),
})

// Service: calcular total con Decimal
const total = new Decimal(data.price).mul(data.quantity)
```

### 4.9 Frontend Types & API Client Update

Actualizar toda la capa de frontend para consumir los nuevos campos:

**Archivos:**
- `frontend/src/types/models.ts` o `api.ts`
- `frontend/src/lib/api.ts`
- `frontend/src/features/transactions/**/*`
- Cualquier componente que use `priceCents`, `totalCents`, `commissionCents`

```typescript
// Types ANTES
interface Transaction {
  priceCents: number
  totalCents: number
  commissionCents: number
}

// Types DESPUÉS
interface Transaction {
  price: number
  total: number
  commission: number
}
```

**Buscar y reemplazar:**
```bash
grep -r "priceCents" frontend/src/
grep -r "totalCents" frontend/src/
grep -r "commissionCents" frontend/src/
```

---

## 5. Implementation Handoff

### Change Scope Classification

**Scope: Minor** - Implementación directa por development team

### Proposed Epic 9: Decimal Precision & Data Quality

| Story | Descripción | Prioridad |
|-------|-------------|-----------|
| 9-1 | Schema migration: Decimal + decimalPlaces | Alta |
| 9-2 | Data migration script + cleanup | Alta |
| 9-3 | Backend API & types update (price, total, commission) | Alta |
| 9-4 | Frontend types & API client update | Alta |
| 9-5 | Validación de precisión en transacciones | Alta |
| 9-6 | Dashboard fix: handle price=null | Alta |
| 9-7 | Transactions UI: cards → tabla | Media |
| 9-8 | Frontend formatters update | Media |

### Success Criteria

- [ ] Transacciones con 8+ decimales se guardan correctamente
- [ ] Transacciones con precisión inválida son rechazadas con error claro
- [ ] API usa campos `price`, `total`, `commission` (no `*Cents`)
- [ ] Frontend consume y envía datos en nuevo formato
- [ ] Dashboard muestra estado correcto para assets sin precio
- [ ] Datos existentes migrados sin pérdida
- [ ] Transacciones se muestran en tabla

### Handoff Recipients

| Rol | Responsabilidad |
|-----|-----------------|
| **Dev Team** | Implementar stories 9-1 a 9-6 |
| **QA** | Verificar migración de datos y nuevas validaciones |

---

## Appendix: Evidence

### Screenshots

1. **Prisma Studio**: Transacciones con `quantity: 0.00000000` y `totalCents: 0`
2. **Dashboard**: Muestra $0.00 y -100% deviation para BTC con holdings reales
3. **Holdings**: Muestra 1.1000001 BTC pero "No price set"

### Related Documentation

- PRD: `_bmad-output/planning-artifacts/prd.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- Epics: `_bmad-output/planning-artifacts/epics.md`
