import { Router, Request, Response, NextFunction } from 'express'
import { authService } from '@/services/authService'
import { registerSchema, loginSchema, changePasswordSchema } from '@/validations/auth'
import { validate } from '@/middleware/validate'
import { authRateLimiter } from '@/middleware/rateLimiter'
import { authMiddleware } from '@/middleware/auth'

const router: Router = Router()

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post(
  '/register',
  authRateLimiter,
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body
      const result = await authService.register(email, password)
      res.status(201).json({ data: result })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * POST /api/auth/login
 * Authenticate a user
 */
router.post(
  '/login',
  authRateLimiter,
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body
      const result = await authService.login(email, password)
      res.status(200).json({ data: result })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get(
  '/me',
  authMiddleware,
  (req: Request, res: Response) => {
    res.status(200).json({ data: req.user })
  }
)

/**
 * PUT /api/auth/password
 * Change user password
 */
router.put(
  '/password',
  authMiddleware,
  validate(changePasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { currentPassword, newPassword } = req.body
      const result = await authService.changePassword(
        req.user!.id,
        currentPassword,
        newPassword
      )
      res.json({ data: result, message: 'Password changed successfully' })
    } catch (error) {
      next(error)
    }
  }
)

export default router
