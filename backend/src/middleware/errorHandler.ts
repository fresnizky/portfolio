import { Request, Response, NextFunction } from 'express'
import { AppError } from '@/lib/errors'

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Handle our custom AppError
  if (err instanceof AppError) {
    console.error(`[Error] ${err.code}: ${err.message}`)

    res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
      ...(err.details && { details: err.details }),
    })
    return
  }

  // Handle unknown errors
  console.error(`[Error] INTERNAL_ERROR: ${err.message}`)

  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  })
}
