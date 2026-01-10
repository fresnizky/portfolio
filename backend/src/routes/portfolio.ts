import { Router, Request, Response, NextFunction } from 'express'
import { portfolioService } from '@/services/portfolioService'

const router: Router = Router()

/**
 * GET /api/portfolio/summary
 * Get portfolio valuation with all position details
 */
router.get(
  '/summary',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await portfolioService.getSummary(req.user!.id)
      res.json({ data: summary })
    } catch (error) {
      next(error)
    }
  }
)

export default router
