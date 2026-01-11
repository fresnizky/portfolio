import { prisma } from '@/config/database'
import { Currency } from '@prisma/client'
import { Errors } from '@/lib/errors'

const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour
const BLUELYTICS_API = 'https://api.bluelytics.com.ar/v2/latest'

interface BluelyticsResponse {
  oficial: { value_avg: number; value_sell: number; value_buy: number }
  blue: { value_avg: number; value_sell: number; value_buy: number }
  last_update: string
}

export interface ExchangeRateResult {
  rate: number
  fetchedAt: Date
  isStale: boolean
  source: string
}

export interface ConversionResult {
  converted: number
  rate: number
  isStale: boolean
}

export const exchangeRateService = {
  /**
   * Get current exchange rate, fetching from API if cache is stale
   */
  async getRate(base: Currency, quote: Currency): Promise<ExchangeRateResult> {
    // Check cache first
    const cached = await prisma.exchangeRate.findUnique({
      where: {
        baseCurrency_quoteCurrency: { baseCurrency: base, quoteCurrency: quote },
      },
    })

    const now = new Date()
    const isStale =
      !cached || now.getTime() - cached.fetchedAt.getTime() > CACHE_TTL_MS

    if (isStale) {
      try {
        const freshRate = await this.fetchFromApi()
        await this.saveRate(base, quote, freshRate)
        return { rate: freshRate, fetchedAt: now, isStale: false, source: 'bluelytics' }
      } catch (error) {
        // API failed - use cached rate if available
        if (cached) {
          console.warn('Exchange rate API failed, using cached rate:', error)
          return {
            rate: Number(cached.rate),
            fetchedAt: cached.fetchedAt,
            isStale: true,
            source: cached.source,
          }
        }
        // No cache available - throw error
        console.error('Exchange rate API failed and no cache available:', error)
        throw Errors.internal('Exchange rate unavailable')
      }
    }

    return {
      rate: Number(cached.rate),
      fetchedAt: cached.fetchedAt,
      isStale: false,
      source: cached.source,
    }
  },

  /**
   * Fetch rate from Bluelytics API
   * Returns USD/ARS rate (how many ARS per 1 USD)
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
  async saveRate(
    base: Currency,
    quote: Currency,
    rate: number
  ): Promise<void> {
    await prisma.exchangeRate.upsert({
      where: {
        baseCurrency_quoteCurrency: { baseCurrency: base, quoteCurrency: quote },
      },
      update: {
        rate,
        fetchedAt: new Date(),
      },
      create: {
        baseCurrency: base,
        quoteCurrency: quote,
        rate,
        fetchedAt: new Date(),
      },
    })
  },

  /**
   * Convert amount between currencies
   */
  async convert(
    amount: number,
    from: Currency,
    to: Currency
  ): Promise<ConversionResult> {
    if (from === to) {
      return { converted: amount, rate: 1, isStale: false }
    }

    // Get USD/ARS rate
    const { rate, isStale } = await this.getRate('USD', 'ARS')

    // For USD -> ARS: multiply by rate
    // For ARS -> USD: divide by rate
    if (from === 'USD' && to === 'ARS') {
      return { converted: amount * rate, rate, isStale }
    } else if (from === 'ARS' && to === 'USD') {
      return { converted: amount / rate, rate: 1 / rate, isStale }
    }

    throw Errors.validation(`Unsupported currency conversion: ${from} -> ${to}`)
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
  },
}
