import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '@/lib/jwt'
import { Errors } from '@/lib/errors'

/**
 * Middleware to verify JWT token and attach user to request
 */
export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(Errors.unauthorized('Authentication required'))
    }

    const token = authHeader.slice(7) // Remove 'Bearer ' prefix

    if (!token) {
      return next(Errors.unauthorized('Authentication required'))
    }

    const payload = verifyToken(token)
    req.user = {
      id: payload.id,
      email: payload.email,
    }

    next()
  } catch {
    next(Errors.unauthorized('Invalid or expired token'))
  }
}
