import { Router, Request, Response, NextFunction } from 'express'
import { assetService } from '@/services/assetService'
import { createAssetSchema, updateAssetSchema } from '@/validations/asset'
import { validate } from '@/middleware/validate'

const router: Router = Router()

/**
 * POST /api/assets
 * Create a new asset
 */
router.post(
  '/',
  validate(createAssetSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const asset = await assetService.create(req.user!.id, req.body)
      res.status(201).json({ data: asset })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * GET /api/assets
 * List all assets for the authenticated user
 */
router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const assets = await assetService.list(req.user!.id)
      res.json({ data: assets })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * GET /api/assets/:id
 * Get a single asset by ID
 */
router.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const asset = await assetService.getById(req.user!.id, req.params.id)
      res.json({ data: asset })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * PUT /api/assets/:id
 * Update an existing asset
 */
router.put(
  '/:id',
  validate(updateAssetSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const asset = await assetService.update(req.user!.id, req.params.id, req.body)
      res.json({ data: asset })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * DELETE /api/assets/:id
 * Delete an asset
 */
router.delete(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await assetService.delete(req.user!.id, req.params.id)
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }
)

export default router
