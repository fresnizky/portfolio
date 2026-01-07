import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { Errors } from '@/lib/errors'

/**
 * Middleware factory for Zod validation
 * @param schema - Zod schema to validate request body against
 */
export function validate<T extends z.ZodSchema>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      const details = result.error.issues.reduce(
        (acc, issue) => {
          const path = issue.path.join('.')
          acc[path] = issue.message
          return acc
        },
        {} as Record<string, string>
      )

      return next(Errors.validation('Invalid request body', details))
    }

    req.body = result.data
    next()
  }
}
