/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'AppError'
  }
}

/**
 * Error factory for common HTTP errors
 */
export const Errors = {
  validation(message: string, details?: Record<string, unknown>): AppError {
    return new AppError(400, 'VALIDATION_ERROR', message, details)
  },

  unauthorized(message = 'Authentication required'): AppError {
    return new AppError(401, 'UNAUTHORIZED', message)
  },

  forbidden(message = 'Access denied'): AppError {
    return new AppError(403, 'FORBIDDEN', message)
  },

  notFound(resource: string): AppError {
    return new AppError(404, 'NOT_FOUND', `${resource} not found`)
  },

  conflict(message: string): AppError {
    return new AppError(409, 'CONFLICT', message)
  },

  tooManyRequests(message = 'Too many requests', retryAfter?: number): AppError {
    return new AppError(429, 'TOO_MANY_REQUESTS', message, retryAfter ? { retryAfter } : undefined)
  },

  internal(message = 'Internal server error'): AppError {
    return new AppError(500, 'INTERNAL_ERROR', message)
  },
}
