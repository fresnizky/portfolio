import { Router, Request, Response, NextFunction } from 'express'
import { priceService } from '@/services/priceService'
import {
  updatePriceSchema,
  batchUpdatePricesSchema,
  priceParamsSchema,
} from '@/validations/price'
import { validate, validateParams } from '@/middleware/validate'

const router: Router = Router()

/**
 * PUT /api/prices/batch
 * Update multiple asset prices atomically
 * IMPORTANT: This route must be defined BEFORE /:assetId to avoid route conflicts
 */
router.put(
  '/batch',
  validate(batchUpdatePricesSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await priceService.batchUpdatePrices(req.user!.id, req.body)
      res.json({
        data: result,
        message: `${result.updated} prices updated`,
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * PUT /api/prices/:assetId
 * Update single asset price
 */
router.put(
  '/:assetId',
  validateParams(priceParamsSchema),
  validate(updatePriceSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { assetId } = req.params
      const asset = await priceService.updatePrice(req.user!.id, assetId, req.body)
      res.json({
        data: asset,
        message: 'Price updated',
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router
