import { Router, Request, Response, NextFunction } from 'express'
import { assetService } from '@/services/assetService'
import { createAssetSchema, updateAssetSchema, listAssetsQuerySchema, assetIdParamSchema, batchUpdateTargetsSchema, batchCreateAssetsSchema, type BatchUpdateTargetsInput, type BatchCreateAssetsInput } from '@/validations/asset'
import { validate, validateParams } from '@/middleware/validate'

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
 * POST /api/assets/batch
 * Create multiple assets at once (for onboarding)
 * NOTE: This route must be defined BEFORE /:id routes to avoid matching 'batch' as an ID
 */
router.post(
  '/batch',
  validate(batchCreateAssetsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { assets } = req.body as BatchCreateAssetsInput
      const createdAssets = await assetService.batchCreate(req.user!.id, assets)
      res.status(201).json({
        data: createdAssets,
        message: `${createdAssets.length} assets created`,
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * GET /api/assets
 * List all assets for the authenticated user
 * Query params: limit (1-100), offset (0+)
 */
router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryResult = listAssetsQuerySchema.safeParse(req.query)
      const query = queryResult.success ? queryResult.data : {}
      
      const { assets, total } = await assetService.list(req.user!.id, query)
      res.json({ data: assets, meta: { total } })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * PUT /api/assets/targets
 * Batch update target percentages for multiple assets
 * Targets must not exceed 100%
 * NOTE: This route must be defined BEFORE /:id routes to avoid matching 'targets' as an ID
 */
router.put(
  '/targets',
  validate(batchUpdateTargetsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { targets } = req.body as BatchUpdateTargetsInput
      const updatedAssets = await assetService.batchUpdateTargets(req.user!.id, targets)
      res.json({
        data: updatedAssets,
        message: 'Targets updated successfully',
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * PUT /api/assets/targets/batch
 * Batch update target percentages for multiple assets (strict mode)
 * Targets MUST sum to exactly 100% - used for onboarding
 */
router.put(
  '/targets/batch',
  validate(batchUpdateTargetsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { targets } = req.body as BatchUpdateTargetsInput
      const updatedAssets = await assetService.batchUpdateTargetsStrict(req.user!.id, targets)
      res.json({
        data: updatedAssets,
        message: `Targets updated (sum: 100%)`,
      })
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
  validateParams(assetIdParamSchema),
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
  validateParams(assetIdParamSchema),
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
  validateParams(assetIdParamSchema),
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
