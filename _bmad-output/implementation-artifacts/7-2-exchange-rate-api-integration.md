# Story 7.2: Exchange Rate API Integration

Status: ready-for-dev

## Story

As a **user**,
I want **the system to fetch current exchange rates automatically**,
So that **I can see my portfolio value in my preferred currency (USD or ARS)**.

## Acceptance Criteria

1. **Given** the system needs exchange rates, **When** rates are not cached or cache is stale (>1 hour), **Then** the system fetches USD/ARS rate from an external API

2. **Given** the exchange rate API is unavailable, **When** I request portfolio data, **Then** the system uses the last known rate and displays a warning about stale exchange rates

3. **Given** I have assets in both USD and ARS, **When** I view my portfolio summary, **Then** all values are converted to a single currency (USD by default)

4. **Given** the exchange rate is updated, **When** I view the dashboard, **Then** I see the current exchange rate and when it was last updated

5. **Given** the system is running, **When** the backend starts, **Then** exchange rates are preloaded into cache

## Tasks / Subtasks

- [ ] Task 1: Backend - Create ExchangeRate model in Prisma (AC: #1, #2)
  - [ ] Add ExchangeRate model to `backend/prisma/schema.prisma`
  - [ ] Fields: id, baseCurrency, quoteCurrency, rate, source, fetchedAt, createdAt
  - [ ] Run migration: `npx prisma migrate dev --name add_exchange_rate`
  - [ ] Run `npx prisma generate`

- [ ] Task 2: Backend - Create exchange rate service (AC: #1, #2, #5)
  - [ ] Create `backend/src/services/exchangeRateService.ts`
  - [ ] Implement `getRate(base: Currency, quote: Currency): Promise<ExchangeRate>`
  - [ ] Implement `fetchFromApi(): Promise<number>` - fetch from Bluelytics or similar
  - [ ] Implement `getCachedOrFetch()` with 1-hour TTL
  - [ ] Implement `preloadRates()` for startup
  - [ ] Handle API failures gracefully (use last known rate)
  - [ ] Write tests for service

- [ ] Task 3: Backend - Create exchange rate validation schemas (AC: #1)
  - [ ] Create `backend/src/validations/exchangeRate.ts`
  - [ ] Define `exchangeRateResponseSchema`
  - [ ] Export types

- [ ] Task 4: Backend - Create exchange rate route (AC: #4)
  - [ ] Create `backend/src/routes/exchangeRates.ts`
  - [ ] GET `/api/exchange-rates/current` - returns current USD/ARS rate
  - [ ] Register route in `backend/src/app.ts`
  - [ ] Write route tests

- [ ] Task 5: Backend - Update portfolio service for multi-currency (AC: #3)
  - [ ] Modify `portfolioService.getSummary()` to accept optional `displayCurrency`
  - [ ] Convert all position values to display currency using exchange rate
  - [ ] Return converted values alongside original values
  - [ ] Write tests

- [ ] Task 6: Backend - Update dashboard service for multi-currency (AC: #3)
  - [ ] Modify `dashboardService.getDashboard()` to use converted values
  - [ ] Include exchange rate info in response
  - [ ] Write tests

- [ ] Task 7: Backend - Preload rates on startup (AC: #5)
  - [ ] Add `exchangeRateService.preloadRates()` call in `backend/src/index.ts`
  - [ ] Log success/failure of rate preload

- [ ] Task 8: Frontend - Add ExchangeRate type (AC: #4)
  - [ ] Add `ExchangeRate` interface to `frontend/src/types/api.ts`
  - [ ] Add `getExchangeRate()` to API client

- [ ] Task 9: Frontend - Create exchange rate hook (AC: #4)
  - [ ] Create `frontend/src/hooks/useExchangeRate.ts`
  - [ ] Use TanStack Query with appropriate refetch interval
  - [ ] Handle loading/error states

- [ ] Task 10: Run all tests and ensure passing
  - [ ] Run `pnpm test` in backend
  - [ ] Run `pnpm test` in frontend
  - [ ] Fix any failing tests

## Dev Notes

### External API Choice: Bluelytics

**API Endpoint:** `https://api.bluelytics.com.ar/v2/latest`

**Rationale:**
- Free, no API key required
- Returns both official and "blue" dollar rates
- Reliable for Argentine market
- JSON response format

**Response Format:**
```json
{
  "oficial": {
    "value_avg": 1050.5,
    "value_sell": 1055.0,
    "value_buy": 1046.0
  },
  "blue": {
    "value_avg": 1200.0,
    "value_sell": 1210.0,
    "value_buy": 1190.0
  },
  "oficial_euro": {...},
  "blue_euro": {...},
  "last_update": "2026-01-11T15:30:00.000-03:00"
}
```

**Use `oficial.value_avg` for conversions** (official average rate).

### Prisma Schema Addition

```prisma
// backend/prisma/schema.prisma

model ExchangeRate {
  id            String   @id @default(cuid())
  baseCurrency  Currency
  quoteCurrency Currency
  rate          Decimal  @db.Decimal(18, 8) // High precision for exchange rates
  source        String   @default("bluelytics")
  fetchedAt     DateTime
  createdAt     DateTime @default(now())

  @@unique([baseCurrency, quoteCurrency])
  @@index([fetchedAt])
}
```

### Exchange Rate Service Implementation

```typescript
// backend/src/services/exchangeRateService.ts

import { prisma } from '@/config/database'
import { Currency } from '@prisma/client'

const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour
const BLUELYTICS_API = 'https://api.bluelytics.com.ar/v2/latest'

interface BluelyticsResponse {
  oficial: { value_avg: number }
  blue: { value_avg: number }
  last_update: string
}

export const exchangeRateService = {
  /**
   * Get current exchange rate, fetching from API if cache is stale
   */
  async getRate(base: Currency, quote: Currency): Promise<{
    rate: number
    fetchedAt: Date
    isStale: boolean
  }> {
    // Check cache first
    const cached = await prisma.exchangeRate.findUnique({
      where: {
        baseCurrency_quoteCurrency: { baseCurrency: base, quoteCurrency: quote }
      }
    })

    const now = new Date()
    const isStale = !cached || (now.getTime() - cached.fetchedAt.getTime()) > CACHE_TTL_MS

    if (isStale) {
      try {
        const freshRate = await this.fetchFromApi()
        await this.saveRate(base, quote, freshRate)
        return { rate: freshRate, fetchedAt: now, isStale: false }
      } catch (error) {
        // API failed - use cached rate if available
        if (cached) {
          console.warn('Exchange rate API failed, using cached rate')
          return {
            rate: Number(cached.rate),
            fetchedAt: cached.fetchedAt,
            isStale: true
          }
        }
        throw error
      }
    }

    return {
      rate: Number(cached.rate),
      fetchedAt: cached.fetchedAt,
      isStale: false
    }
  },

  /**
   * Fetch rate from Bluelytics API
   */
  async fetchFromApi(): Promise<number> {
    const response = await fetch(BLUELYTICS_API)
    if (!response.ok) {
      throw new Error(`Bluelytics API error: ${response.status}`)
    }
    const data: BluelyticsResponse = await response.json()
    return data.oficial.value_avg // USD to ARS rate
  },

  /**
   * Save rate to database cache
   */
  async saveRate(base: Currency, quote: Currency, rate: number): Promise<void> {
    await prisma.exchangeRate.upsert({
      where: {
        baseCurrency_quoteCurrency: { baseCurrency: base, quoteCurrency: quote }
      },
      update: {
        rate,
        fetchedAt: new Date()
      },
      create: {
        baseCurrency: base,
        quoteCurrency: quote,
        rate,
        fetchedAt: new Date()
      }
    })
  },

  /**
   * Convert amount between currencies
   */
  async convert(
    amount: number,
    from: Currency,
    to: Currency
  ): Promise<{ converted: number; rate: number; isStale: boolean }> {
    if (from === to) {
      return { converted: amount, rate: 1, isStale: false }
    }

    // For USD -> ARS: multiply by rate
    // For ARS -> USD: divide by rate
    const { rate, isStale } = await this.getRate('USD', 'ARS')

    if (from === 'USD' && to === 'ARS') {
      return { converted: amount * rate, rate, isStale }
    } else if (from === 'ARS' && to === 'USD') {
      return { converted: amount / rate, rate: 1 / rate, isStale }
    }

    throw new Error(`Unsupported currency conversion: ${from} -> ${to}`)
  },

  /**
   * Preload rates on startup
   */
  async preloadRates(): Promise<void> {
    try {
      await this.getRate('USD', 'ARS')
      console.log('Exchange rates preloaded successfully')
    } catch (error) {
      console.error('Failed to preload exchange rates:', error)
    }
  }
}
```

### Portfolio Service Update

```typescript
// backend/src/services/portfolioService.ts - Update getSummary

async getSummary(userId: string, displayCurrency: Currency = 'USD') {
  const assets = await prisma.asset.findMany({
    where: { userId },
    include: { holding: true }
  })

  let exchangeRateInfo: { rate: number; isStale: boolean } | null = null

  // Only fetch exchange rate if we have mixed currencies
  const hasMixedCurrencies = assets.some(a => a.currency !== displayCurrency)
  if (hasMixedCurrencies) {
    exchangeRateInfo = await exchangeRateService.getRate('USD', 'ARS')
  }

  const positions = await Promise.all(assets.map(async (asset) => {
    const value = calculatePositionValue(asset)
    let displayValue = value

    // Convert to display currency if needed
    if (asset.currency !== displayCurrency && exchangeRateInfo) {
      const { converted } = await exchangeRateService.convert(
        value,
        asset.currency,
        displayCurrency
      )
      displayValue = converted
    }

    return {
      // ... existing fields ...
      originalValue: value.toFixed(2),
      originalCurrency: asset.currency,
      displayValue: displayValue.toFixed(2),
      displayCurrency,
    }
  }))

  const totalValue = positions.reduce((sum, p) => sum + parseFloat(p.displayValue), 0)

  return {
    totalValue: totalValue.toFixed(2),
    displayCurrency,
    exchangeRate: exchangeRateInfo ? {
      usdToArs: exchangeRateInfo.rate,
      isStale: exchangeRateInfo.isStale
    } : null,
    positions
  }
}
```

### Exchange Rate Route

```typescript
// backend/src/routes/exchangeRates.ts

import { Router, Request, Response, NextFunction } from 'express'
import { exchangeRateService } from '@/services/exchangeRateService'

const router: Router = Router()

/**
 * GET /api/exchange-rates/current
 * Get current USD/ARS exchange rate
 */
router.get('/current', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rate, fetchedAt, isStale } = await exchangeRateService.getRate('USD', 'ARS')
    res.json({
      data: {
        baseCurrency: 'USD',
        quoteCurrency: 'ARS',
        rate,
        fetchedAt,
        isStale
      }
    })
  } catch (error) {
    next(error)
  }
})

export default router
```

### Frontend Types

```typescript
// frontend/src/types/api.ts - Add

export interface ExchangeRate {
  baseCurrency: Currency
  quoteCurrency: Currency
  rate: number
  fetchedAt: string
  isStale: boolean
}

export interface ExchangeRateInfo {
  usdToArs: number
  isStale: boolean
}

// Update PortfolioSummary
export interface PortfolioSummary {
  totalValue: string
  displayCurrency: Currency
  exchangeRate: ExchangeRateInfo | null
  positions: Position[]
}
```

### Frontend Hook

```typescript
// frontend/src/hooks/useExchangeRate.ts

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ExchangeRate } from '@/types/api'

export const exchangeRateKeys = {
  current: ['exchangeRate', 'current'] as const,
}

export function useExchangeRate() {
  return useQuery({
    queryKey: exchangeRateKeys.current,
    queryFn: () => api.exchangeRates.getCurrent(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 15 * 60 * 1000, // Refetch every 15 minutes
    retry: 2,
  })
}
```

### API Client Update

```typescript
// frontend/src/lib/api.ts - Add

exchangeRates: {
  getCurrent: async (): Promise<ExchangeRate> => {
    const response = await fetch(`${API_URL}/exchange-rates/current`, {
      headers: getAuthHeaders(),
    })
    return handleResponse<ExchangeRate>(response)
  },
},
```

### File Structure

```
backend/
├── prisma/
│   └── schema.prisma                    (MODIFY - add ExchangeRate model)
├── src/
│   ├── services/
│   │   ├── exchangeRateService.ts       (CREATE)
│   │   ├── exchangeRateService.test.ts  (CREATE)
│   │   ├── portfolioService.ts          (MODIFY - add currency conversion)
│   │   └── dashboardService.ts          (MODIFY - include exchange rate)
│   ├── routes/
│   │   ├── exchangeRates.ts             (CREATE)
│   │   ├── exchangeRates.test.ts        (CREATE)
│   │   └── index.ts                     (MODIFY - register new route)
│   ├── validations/
│   │   └── exchangeRate.ts              (CREATE)
│   ├── app.ts                           (MODIFY - register route)
│   └── index.ts                         (MODIFY - preload rates on startup)

frontend/src/
├── types/
│   └── api.ts                           (MODIFY - add ExchangeRate types)
├── hooks/
│   └── useExchangeRate.ts               (CREATE)
└── lib/
    └── api.ts                           (MODIFY - add exchangeRates methods)
```

### Error Handling Strategy

```typescript
// When API fails:
// 1. Log error to console
// 2. Return cached rate if available (with isStale: true)
// 3. If no cached rate exists, throw error
// 4. Frontend displays warning when isStale is true

// Example warning in dashboard:
// "Exchange rates may be outdated (last updated 2 hours ago)"
```

### Testing Strategy

```typescript
// Backend tests - exchangeRateService.test.ts
describe('ExchangeRateService', () => {
  describe('getRate', () => {
    it('should fetch rate from API when cache is empty')
    it('should return cached rate when cache is fresh')
    it('should fetch fresh rate when cache is stale')
    it('should return stale cache when API fails')
    it('should throw when API fails and no cache exists')
  })

  describe('convert', () => {
    it('should convert USD to ARS correctly')
    it('should convert ARS to USD correctly')
    it('should return same amount when currencies match')
  })
})

// Backend tests - exchangeRates.test.ts
describe('GET /api/exchange-rates/current', () => {
  it('should return current exchange rate')
  it('should include isStale flag')
  it('should handle API errors gracefully')
})

// Frontend tests - useExchangeRate.test.ts
describe('useExchangeRate', () => {
  it('should fetch exchange rate')
  it('should handle loading state')
  it('should handle error state')
})
```

### Anti-Patterns to Avoid

```typescript
// NEVER hardcode exchange rates
const rate = 1100 // WRONG

// NEVER fetch rates on every request
await fetchFromApi() // WRONG - always check cache first

// NEVER ignore API failures silently
try { fetchFromApi() } catch {} // WRONG - must handle and log

// NEVER mix currencies without explicit conversion
totalUSD + totalARS // WRONG

// ALWAYS use the service for conversions
const { converted } = await exchangeRateService.convert(amount, from, to) // CORRECT
```

### Key Technical Constraints

- **Cache TTL**: 1 hour for exchange rates (configurable via constant)
- **API fallback**: Always use cached rate if API fails
- **Startup preload**: Rates loaded on backend startup
- **Display currency**: Default to USD for portfolio totals
- **Precision**: Use `Decimal(18, 8)` for rate storage

### Previous Story Intelligence

**Patterns from Story 7-1 (Currency Field):**
- Currency enum already exists: `enum Currency { USD, ARS }`
- Asset model has `currency` field
- Validation pattern with Zod enums
- Frontend types follow `types/api.ts` pattern
- Service patterns established in `portfolioService.ts`

**Files modified in 7-1 that this story builds on:**
- `backend/prisma/schema.prisma` - Currency enum exists
- `frontend/src/types/api.ts` - Currency type exists
- `backend/src/services/portfolioService.ts` - Base to extend

### Project Context Reference

See `_bmad-output/project-context.md` for:
- TypeScript strict mode rules (no `any`)
- Path aliases (`@/services`, `@/lib`, `@/config`)
- Naming conventions (camelCase for services)
- API response format: `{ data: T, message?: string }`
- Error handling: Use `Errors.notFound()`, etc.
- Service pattern: Routes delegate to services

### References

- [Source: _bmad-output/implementation-artifacts/7-1-currency-field-on-asset-model.md - Previous story context]
- [Source: _bmad-output/planning-artifacts/architecture.md#API-Patterns]
- [Source: _bmad-output/planning-artifacts/prd.md - Multi-currency requirement]
- [Source: backend/src/services/portfolioService.ts - Service patterns]
- [Source: backend/src/services/priceService.ts - Similar caching pattern]
- [Source: backend/prisma/schema.prisma - Currency enum]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
