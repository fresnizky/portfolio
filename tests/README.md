# E2E Tests - Portfolio Tracker

Tests end-to-end con Playwright para validar flujos completos de usuario.

## Quick Start

```bash
# 1. Instalar dependencias y browsers
pnpm install
pnpm exec playwright install --with-deps

# 2. Levantar stack E2E (completamente aislado de dev/prod)
pnpm test:e2e:up

# 3. Ejecutar tests
pnpm test:e2e

# 4. Limpiar cuando termines
pnpm test:e2e:clean
```

### Stack E2E

El comando `test:e2e:up` levanta un stack **completamente separado** que puede correr en paralelo con dev:

| Servicio | Container | Puerto | Descripcion |
|----------|-----------|--------|-------------|
| Frontend | `portfolio_frontend_e2e` | 10021 | Vite dev server |
| Backend | `portfolio_backend_e2e` | 10022 | Express con NODE_ENV=test |
| Database | `portfolio_db_e2e` | 10023 | PostgreSQL efimero (tmpfs) |

**Puertos E2E vs DEV:**
- E2E: 10021-10023 (offset +20)
- DEV: 10001-10003

**Ventajas:**
- No comparte nada con dev/prod
- DB limpia en cada ejecucion (tmpfs)
- Rate limiting desactivado automaticamente
- Reproducible en CI/CD

### Scripts utiles

```bash
pnpm test:e2e:logs          # Ver logs de todos los servicios
pnpm test:e2e:logs:backend  # Ver solo logs del backend
```

## Scripts Disponibles

| Script | Descripcion |
|--------|-------------|
| `pnpm test:e2e` | Ejecutar todos los tests E2E |
| `pnpm test:e2e:ui` | Abrir Playwright UI mode (interactivo) |
| `pnpm test:e2e:headed` | Ejecutar con browser visible |
| `pnpm test:e2e:debug` | Modo debug con inspector |
| `pnpm test:e2e:smoke` | Solo smoke tests (health check) |
| `pnpm test:e2e:p0` | Solo tests P0 (criticos) |
| `pnpm test:e2e:p1` | Tests P0 + P1 (alta prioridad) |
| `pnpm test:e2e:p2` | Tests P0 + P1 + P2 (incluye edge cases) |
| `pnpm test:e2e:chromium` | Solo ejecutar en Chromium |
| `pnpm test:e2e:up` | Levantar stack E2E + migrar DB |
| `pnpm test:e2e:down` | Detener stack E2E (mantiene datos) |
| `pnpm test:e2e:clean` | Destruir stack E2E + volúmenes |
| `pnpm test:e2e:report` | Ver reporte HTML de ultima ejecucion |

## Arquitectura

```
tests/
├── e2e/                         # Archivos de test E2E
│   ├── smoke.spec.ts            # Health checks (P0)
│   ├── example.spec.ts          # Tests de ejemplo - Auth, Homepage
│   ├── holdings.spec.ts         # Holdings & Prices (P0-P2)
│   ├── transactions.spec.ts     # Transactions CRUD & Filters (P0-P2)
│   ├── dashboard-alerts.spec.ts # Dashboard & Alerts (P0-P2)
│   ├── onboarding.spec.ts       # Onboarding flow (P0-P2)
│   ├── settings.spec.ts         # Settings & Export (P1-P3)
│   └── evolution.spec.ts        # Portfolio evolution charts (P1-P3)
├── support/
│   ├── fixtures/                # Playwright fixtures (mergeTests pattern)
│   │   └── index.ts             # Exporta: test, expect, TestUser
│   ├── helpers/                 # Funciones puras de API
│   │   └── api-helpers.ts       # seedUser, loginUser, etc.
│   └── factories/               # Data factories (faker pattern)
│       └── index.ts             # createUser, createAsset, etc.
└── README.md
```

## Test Priority System

Los tests usan tags de prioridad en el nombre para facilitar ejecucion selectiva:

| Prioridad | Tag | Cuando ejecutar | Descripcion |
|-----------|-----|-----------------|-------------|
| **P0** | `[P0]` | Cada commit | Paths criticos que deben funcionar siempre |
| **P1** | `[P1]` | PRs a main | Features importantes, alta cobertura |
| **P2** | `[P2]` | Nightly | Edge cases, features secundarias |
| **P3** | `[P3]` | On-demand | Features nice-to-have, exploratorios |

### Ejecutar por Prioridad

```bash
# Solo tests criticos (P0)
pnpm test:e2e:p0

# Tests criticos + alta prioridad (P0 + P1)
pnpm test:e2e:p1

# Todos los tests hasta P2
pnpm test:e2e:p2

# Suite completa
pnpm test:e2e
```

## Patrones Clave

### 1. Fixture Composition (mergeTests)

```typescript
// tests/support/fixtures/index.ts
export const test = mergeTests(base, apiFixture, authFixture, cleanupFixture);

// En tests:
import { test, expect } from '../support/fixtures';

test('user flow', async ({ page, authenticatedUser, api }) => {
  // authenticatedUser ya está logueado
  // api permite hacer requests
});
```

### 2. Data Factories

```typescript
import { createUser, createAsset, createDiversifiedPortfolio } from '../support/factories';

// Datos únicos para cada test (parallel-safe)
const user = createUser();
const asset = createAsset({ ticker: 'VOO', category: 'ETF' });

// Portfolio completo
const { user, assets } = createDiversifiedPortfolio();
```

### 3. API Seeding (Fast Setup)

```typescript
test('portfolio display', async ({ page, authenticatedUser, api }) => {
  // Setup via API (rápido, no UI)
  await api.post('/api/assets', { ticker: 'VOO', name: 'Vanguard' });

  // Validar UI
  await page.goto('/dashboard');
  await expect(page.getByText('VOO')).toBeVisible();
});
```

## Base de Datos de Tests

Los tests usan una **DB PostgreSQL separada** (`portfolio_e2e`) para no afectar datos de desarrollo.

```bash
# Levantar stack E2E (incluye DB)
pnpm test:e2e:up

# DB disponible en: localhost:10023
# Credenciales: test_user / test_pass
# Database: portfolio_e2e

# Limpiar todo
pnpm test:e2e:clean
```

## Configuración

### Variables de Entorno

```bash
# Por defecto, Playwright usa los puertos E2E (no necesitan exportarse)
# BASE_URL=http://localhost:10021    # Frontend E2E (default)
# API_URL=http://localhost:10022     # Backend API E2E (default)

# Para apuntar a DEV (si fuera necesario):
BASE_URL=http://localhost:10001 API_URL=http://localhost:10002 pnpm test:e2e
```

### Timeouts (TEA Standards)

| Tipo | Timeout | Uso |
|------|---------|-----|
| Action | 15s | click, fill, etc. |
| Navigation | 30s | page.goto, reload |
| Expect | 10s | Assertions |
| Test | 60s | Test completo |

### Artifacts

Solo se guardan en caso de falla:
- Screenshots: `test-results/`
- Videos: `test-results/`
- Traces: `test-results/`
- HTML Report: `playwright-report/`

## Best Practices

### Selectores

```typescript
// ✅ Usar data-testid
page.getByTestId('submit-button')
page.locator('[data-testid="user-menu"]')

// ✅ Usar roles semánticos
page.getByRole('button', { name: /submit/i })
page.getByLabel('Email')

// ❌ Evitar selectores frágiles
page.locator('.btn-primary')
page.locator('#app > div > button')
```

### Aislamiento de Tests

```typescript
// ✅ Cada test crea sus datos
test('test 1', async ({ authenticatedUser }) => {
  // authenticatedUser es único para este test
});

test('test 2', async ({ authenticatedUser }) => {
  // authenticatedUser diferente
});
```

### Waits

```typescript
// ✅ Usar auto-waiting de Playwright
await expect(page.getByText('Success')).toBeVisible();

// ❌ Evitar waits explícitos
await page.waitForTimeout(3000); // NO
```

## Debugging

```bash
# UI Mode (mejor para desarrollo)
pnpm test:e2e:ui

# Debug Mode (con DevTools)
pnpm test:e2e:debug

# Ver trace de test fallido
pnpm test:e2e:report
```

### Trace Viewer

Cuando un test falla, Playwright guarda un trace completo. Para verlo:

```bash
pnpm exec playwright show-trace test-results/test-name/trace.zip
```

## CI/CD

Los tests están configurados para CI:
- Retries: 2 en CI, 0 local
- Workers: 1 en CI (estabilidad), parallel local
- Artifacts: upload en failure

```yaml
# .github/workflows/e2e.yml
- name: Run E2E Tests
  run: pnpm test:e2e
  env:
    CI: true
    BASE_URL: http://localhost:10001
    API_URL: http://localhost:10002
```

## Troubleshooting

### Tests fallan por timeout

1. Verificar que frontend y backend están corriendo
2. Verificar URLs en variables de entorno
3. Aumentar timeout si es operación lenta:
   ```typescript
   await expect(page.getByText('Done')).toBeVisible({ timeout: 30000 });
   ```

### DB de tests no conecta

```bash
# Verificar que está corriendo
docker ps | grep portfolio_db_e2e

# Ver logs
docker logs portfolio_db_e2e

# Reiniciar
pnpm test:e2e:clean && pnpm test:e2e:up
```

### Browser no se instala

```bash
# Reinstalar browsers
pnpm exec playwright install --with-deps
```
