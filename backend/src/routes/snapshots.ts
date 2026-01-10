import { Router, Request, Response, NextFunction } from 'express'
import { snapshotService } from '@/services/snapshotService'
import { validateParams } from '@/middleware/validate'
import { snapshotQuerySchema, snapshotIdParamSchema } from '@/validations/snapshot'

const router: Router = Router()

/**
 * POST /api/snapshots
 * Create a snapshot of current portfolio state
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const snapshot = await snapshotService.create(req.user!.id)
    res.status(201).json({
      data: snapshot,
      message: 'Snapshot created',
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/snapshots
 * List snapshots with optional date filtering
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Parse and validate query parameters
    const queryResult = snapshotQuerySchema.safeParse(req.query)
    const query = queryResult.success ? queryResult.data : undefined

    const { snapshots, total } = await snapshotService.list(req.user!.id, query)
    res.json({
      data: snapshots,
      meta: { total },
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/snapshots/:id
 * Get a single snapshot by ID
 */
router.get(
  '/:id',
  validateParams(snapshotIdParamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const snapshot = await snapshotService.getById(req.user!.id, req.params.id)
      res.json({ data: snapshot })
    } catch (error) {
      next(error)
    }
  }
)

export default router
