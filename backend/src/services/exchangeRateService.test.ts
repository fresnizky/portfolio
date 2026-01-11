import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { exchangeRateService } from './exchangeRateService'
import { prisma } from '@/config/database'
import { AppError } from '@/lib/errors'
import type { ExchangeRate } from '@prisma/client'

// Mock the database
vi.mock('@/config/database', () => ({
  prisma: {
    exchangeRate: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}))

// Mock global fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Helper to create mock Prisma Decimal
const createMockDecimal = (value: number) =>
  ({
    toNumber: () => value,
    valueOf: () => value,
    toString: () => String(value),
  }) as unknown as ExchangeRate['rate']

// Mock exchange rate factory
const createMockExchangeRate = (
  overrides: Partial<ExchangeRate> = {}
): ExchangeRate => ({
  id: 'rate-123',
  baseCurrency: 'USD',
  quoteCurrency: 'ARS',
  rate: createMockDecimal(1050.5),
  source: 'bluelytics',
  fetchedAt: new Date(),
  createdAt: new Date(),
  ...overrides,
})

// Mock Bluelytics response
const mockBluelyticsResponse = {
  oficial: { value_avg: 1100.5, value_sell: 1105, value_buy: 1096 },
  blue: { value_avg: 1250, value_sell: 1260, value_buy: 1240 },
  last_update: '2026-01-11T15:30:00.000-03:00',
}

describe('exchangeRateService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('getRate', () => {
    it('should fetch rate from API when cache is empty', async () => {
      vi.mocked(prisma.exchangeRate.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.exchangeRate.upsert).mockResolvedValue(
        createMockExchangeRate()
      )
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBluelyticsResponse),
      })

      const result = await exchangeRateService.getRate('USD', 'ARS')

      expect(result.rate).toBe(1100.5)
      expect(result.isStale).toBe(false)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.bluelytics.com.ar/v2/latest'
      )
      expect(prisma.exchangeRate.upsert).toHaveBeenCalled()
    })

    it('should return cached rate when cache is fresh', async () => {
      const freshCachedRate = createMockExchangeRate({
        fetchedAt: new Date(), // Fresh (just now)
      })
      vi.mocked(prisma.exchangeRate.findUnique).mockResolvedValue(freshCachedRate)

      const result = await exchangeRateService.getRate('USD', 'ARS')

      expect(result.rate).toBe(1050.5)
      expect(result.isStale).toBe(false)
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should fetch fresh rate when cache is stale (older than 1 hour)', async () => {
      const staleDate = new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      const staleCachedRate = createMockExchangeRate({
        fetchedAt: staleDate,
      })
      vi.mocked(prisma.exchangeRate.findUnique).mockResolvedValue(staleCachedRate)
      vi.mocked(prisma.exchangeRate.upsert).mockResolvedValue(
        createMockExchangeRate()
      )
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBluelyticsResponse),
      })

      const result = await exchangeRateService.getRate('USD', 'ARS')

      expect(result.rate).toBe(1100.5)
      expect(result.isStale).toBe(false)
      expect(mockFetch).toHaveBeenCalled()
    })

    it('should return stale cache when API fails', async () => {
      const staleDate = new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      const staleCachedRate = createMockExchangeRate({
        fetchedAt: staleDate,
      })
      vi.mocked(prisma.exchangeRate.findUnique).mockResolvedValue(staleCachedRate)
      mockFetch.mockRejectedValue(new Error('Network error'))

      const result = await exchangeRateService.getRate('USD', 'ARS')

      expect(result.rate).toBe(1050.5)
      expect(result.isStale).toBe(true)
    })

    it('should throw when API fails and no cache exists', async () => {
      vi.mocked(prisma.exchangeRate.findUnique).mockResolvedValue(null)
      mockFetch.mockRejectedValue(new Error('Network error'))

      await expect(exchangeRateService.getRate('USD', 'ARS')).rejects.toThrow(
        AppError
      )
      await expect(exchangeRateService.getRate('USD', 'ARS')).rejects.toMatchObject(
        {
          statusCode: 500,
          message: 'Exchange rate unavailable',
        }
      )
    })

    it('should handle non-ok API responses', async () => {
      vi.mocked(prisma.exchangeRate.findUnique).mockResolvedValue(null)
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
      })

      await expect(exchangeRateService.getRate('USD', 'ARS')).rejects.toThrow(
        AppError
      )
    })
  })

  describe('fetchFromApi', () => {
    it('should return oficial value_avg from Bluelytics', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBluelyticsResponse),
      })

      const rate = await exchangeRateService.fetchFromApi()

      expect(rate).toBe(1100.5)
    })

    it('should throw on non-ok response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      })

      await expect(exchangeRateService.fetchFromApi()).rejects.toThrow(
        'Bluelytics API error: 500'
      )
    })
  })

  describe('saveRate', () => {
    it('should upsert rate to database', async () => {
      vi.mocked(prisma.exchangeRate.upsert).mockResolvedValue(
        createMockExchangeRate()
      )

      await exchangeRateService.saveRate('USD', 'ARS', 1100.5)

      expect(prisma.exchangeRate.upsert).toHaveBeenCalledWith({
        where: {
          baseCurrency_quoteCurrency: {
            baseCurrency: 'USD',
            quoteCurrency: 'ARS',
          },
        },
        update: {
          rate: 1100.5,
          fetchedAt: expect.any(Date),
        },
        create: {
          baseCurrency: 'USD',
          quoteCurrency: 'ARS',
          rate: 1100.5,
          fetchedAt: expect.any(Date),
        },
      })
    })
  })

  describe('convert', () => {
    beforeEach(() => {
      // Setup fresh cache for conversion tests
      const freshCachedRate = createMockExchangeRate({
        rate: createMockDecimal(1000), // 1 USD = 1000 ARS
        fetchedAt: new Date(),
      })
      vi.mocked(prisma.exchangeRate.findUnique).mockResolvedValue(freshCachedRate)
    })

    it('should convert USD to ARS correctly', async () => {
      const result = await exchangeRateService.convert(100, 'USD', 'ARS')

      expect(result.converted).toBe(100000) // 100 USD * 1000 = 100000 ARS
      expect(result.rate).toBe(1000)
      expect(result.isStale).toBe(false)
    })

    it('should convert ARS to USD correctly', async () => {
      const result = await exchangeRateService.convert(100000, 'ARS', 'USD')

      expect(result.converted).toBe(100) // 100000 ARS / 1000 = 100 USD
      expect(result.rate).toBeCloseTo(0.001) // 1/1000
      expect(result.isStale).toBe(false)
    })

    it('should return same amount when currencies match', async () => {
      const result = await exchangeRateService.convert(500, 'USD', 'USD')

      expect(result.converted).toBe(500)
      expect(result.rate).toBe(1)
      expect(result.isStale).toBe(false)
      expect(prisma.exchangeRate.findUnique).not.toHaveBeenCalled()
    })
  })

  describe('preloadRates', () => {
    it('should log success when rates preload successfully', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const freshCachedRate = createMockExchangeRate({ fetchedAt: new Date() })
      vi.mocked(prisma.exchangeRate.findUnique).mockResolvedValue(freshCachedRate)

      await exchangeRateService.preloadRates()

      expect(consoleSpy).toHaveBeenCalledWith(
        'Exchange rates preloaded successfully'
      )
      consoleSpy.mockRestore()
    })

    it('should log error when preload fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.mocked(prisma.exchangeRate.findUnique).mockResolvedValue(null)
      mockFetch.mockRejectedValue(new Error('Network error'))

      await exchangeRateService.preloadRates()

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to preload exchange rates:',
        expect.any(AppError)
      )
      consoleSpy.mockRestore()
    })
  })
})
