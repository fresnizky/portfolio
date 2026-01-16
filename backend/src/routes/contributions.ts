import { Router, Request, Response, NextFunction } from 'express'
import { contributionService } from '@/services/contributionService'
import { contributionSuggestSchema } from '@/validations/contribution'
import { validate } from '@/middleware/validate'

const router: Router = Router()

/**
 * POST /api/contributions/suggest
 * Get contribution allocation suggestion based on targets and current deviations
 */
router.post(
  '/suggest',
  validate(contributionSuggestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { amount } = req.body
      const suggestion = await contributionService.getSuggestion(req.user!.id, amount)
      res.json({ data: suggestion })
    } catch (error) {
      next(error)
    }
  }
)

export default router
