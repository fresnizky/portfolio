# E2E Tests - Portfolio Tracker

Tests end-to-end con Playwright para validar flujos completos de usuario.

## Quick Start

```bash
# 1. Instalar dependencias
pnpm install

# 2. Instalar browsers de Playwright
pnpm exec playwright install --with-deps

# 3. Levantar DB de tests (separada de desarrollo)
pnpm test:e2e:setup

# 4. Levantar frontend y backend
# Terminal 1:
cd frontend && pnpm dev
# Terminal 2:
cd backend && pnpm dev

# 5. Ejecutar tests
pnpm test:e2e
```

## Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `pnpm test:e2e` | Ejecutar todos los tests E2E |
| `pnpm test:e2e:ui` | Abrir Playwright UI mode (interactivo) |
| `pnpm test:e2e:headed` | Ejecutar con browser visible |
| `pnpm test:e2e:debug` | Modo debug con inspector |
| `pnpm test:e2e:smoke` | Solo smoke tests (health check) |
| `pnpm test:e2e:chromium` | Solo ejecutar en Chromium |
| `pnpm test:e2e:setup` | Levantar DB de tests + migrar |
| `pnpm test:e2e:cleanup` | Destruir DB de tests |
| `pnpm test:e2e:report` | Ver reporte HTML de última ejecución |

## Arquitectura

```
tests/
├── e2e/                    # Archivos de test
│   ├── smoke.spec.ts       # Health checks
│   └── example.spec.ts     # Tests de ejemplo
├── support/
│   ├── fixtures/           # Playwright fixtures (mergeTests pattern)
│   │   └── index.ts        # Exporta: test, expect, TestUser
│   ├── helpers/            # Funciones puras de API
│   │   └── api-helpers.ts  # seedUser, loginUser, etc.
│   └── factories/          # Data factories (faker pattern)
│       └── index.ts        # createUser, createAsset, etc.
└── README.md
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

Los tests usan una **DB PostgreSQL separada** (`portfolio_test`) para no afectar datos de desarrollo.

```bash
# Levantar DB de tests
docker compose -f docker-compose.test.yml up -d

# DB disponible en: localhost:10013
# Credenciales: portfolio_user / portfolio_pass
# Database: portfolio_test

# Limpiar todo
docker compose -f docker-compose.test.yml down -v
```

## Configuración

### Variables de Entorno

```bash
# .env (o exportar antes de correr tests)
BASE_URL=http://localhost:10001      # Frontend
API_URL=http://localhost:10002       # Backend API
PORT_DB_TEST=10013                   # DB de tests
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
docker ps | grep portfolio_db_test

# Ver logs
docker logs portfolio_db_test

# Reiniciar
pnpm test:e2e:cleanup && pnpm test:e2e:setup
```

### Browser no se instala

```bash
# Reinstalar browsers
pnpm exec playwright install --with-deps
```
