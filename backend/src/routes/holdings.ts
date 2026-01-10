import { Router, Request, Response, NextFunction } from 'express'
import { holdingService } from '@/services/holdingService'
import { createOrUpdateHoldingSchema, holdingParamsSchema, batchCreateHoldingsSchema, type BatchCreateHoldingsInput } from '@/validations/holding'
import { validate, validateParams } from '@/middleware/validate'

const router: Router = Router()

/**
 * GET /api/holdings
 * List all holdings for the authenticated user
 */
router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const holdings = await holdingService.getHoldings(req.user!.id)
      res.json({ data: holdings })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * POST /api/holdings/batch
 * Create or update multiple holdings at once (for onboarding)
 * Optionally updates asset prices
 * NOTE: This route must be defined BEFORE /:assetId to avoid matching 'batch' as an ID
 */
router.post(
  '/batch',
  validate(batchCreateHoldingsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { holdings } = req.body as BatchCreateHoldingsInput
      const createdHoldings = await holdingService.batchCreateOrUpdate(req.user!.id, holdings)
      res.status(201).json({
        data: createdHoldings,
        message: `${createdHoldings.length} holdings created`,
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * PUT /api/holdings/:assetId
 * Create or update holding for an asset
 */
router.put(
  '/:assetId',
  validateParams(holdingParamsSchema),
  validate(createOrUpdateHoldingSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { assetId } = req.params
      const { quantity } = req.body

      // Check if holding exists before upsert to determine message
      const existed = await holdingService.holdingExists(assetId)

      const holding = await holdingService.createOrUpdateHolding(
        req.user!.id,
        assetId,
        quantity
      )

      res.json({
        data: holding,
        message: existed ? 'Holding updated' : 'Holding created',
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router
