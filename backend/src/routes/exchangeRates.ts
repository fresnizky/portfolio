import { Router, Request, Response, NextFunction } from 'express'
import { exchangeRateService } from '@/services/exchangeRateService'

const router: Router = Router()

/**
 * GET /api/exchange-rates/current
 * Get current USD/ARS exchange rate
 */
router.get('/current', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rate, fetchedAt, isStale, source } = await exchangeRateService.getRate(
      'USD',
      'ARS'
    )
    res.json({
      data: {
        baseCurrency: 'USD',
        quoteCurrency: 'ARS',
        rate,
        fetchedAt: fetchedAt.toISOString(),
        isStale,
        source,
      },
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/exchange-rates/refresh
 * Force refresh the exchange rate from external API
 */
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const freshRate = await exchangeRateService.fetchFromApi()
    await exchangeRateService.saveRate('USD', 'ARS', freshRate)

    res.json({
      data: {
        baseCurrency: 'USD',
        quoteCurrency: 'ARS',
        rate: freshRate,
        fetchedAt: new Date().toISOString(),
        isStale: false,
        source: 'bluelytics',
      },
    })
  } catch (error) {
    next(error)
  }
})

export default router
