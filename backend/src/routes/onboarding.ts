import { Router, Request, Response, NextFunction } from 'express'
import { onboardingService } from '@/services/onboardingService'

const router: Router = Router()

/**
 * GET /api/onboarding/status
 * Get onboarding status for the authenticated user
 */
router.get(
  '/status',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = await onboardingService.getStatus(req.user!.id)
      res.json({ data: status })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * POST /api/onboarding/complete
 * Mark onboarding as completed
 */
router.post(
  '/complete',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = await onboardingService.markCompleted(req.user!.id)
      res.json({ data: status, message: 'Onboarding completed' })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * POST /api/onboarding/skip
 * Mark onboarding as skipped
 */
router.post(
  '/skip',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = await onboardingService.markSkipped(req.user!.id)
      res.json({ data: status, message: 'Onboarding skipped' })
    } catch (error) {
      next(error)
    }
  }
)

export default router
