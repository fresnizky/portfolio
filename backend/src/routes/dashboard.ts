import { Router, Request, Response, NextFunction } from 'express'
import { dashboardService } from '@/services/dashboardService'
import { dashboardQuerySchema } from '@/validations/dashboard'
import { Errors } from '@/lib/errors'

const router: Router = Router()

/**
 * GET /api/dashboard
 * Get complete dashboard data including positions, calculated percentages, and alerts
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate query params
    const parseResult = dashboardQuerySchema.safeParse(req.query)
    if (!parseResult.success) {
      throw Errors.validation('Invalid query parameters', {
        errors: parseResult.error.flatten().fieldErrors,
      })
    }

    const { deviationThreshold, staleDays } = parseResult.data

    const dashboard = await dashboardService.getDashboard(req.user!.id, {
      deviationPct: deviationThreshold ?? 5,
      staleDays: staleDays ?? 7,
    })

    res.json({ data: dashboard })
  } catch (error) {
    next(error)
  }
})

export default router
