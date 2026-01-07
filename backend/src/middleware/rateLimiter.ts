import rateLimit from 'express-rate-limit'

/**
 * Rate limiter for login attempts
 * 5 attempts per minute per IP
 */
export const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many login attempts. Try again later.',
    details: { retryAfter: 60 },
  },
})

/**
 * Rate limiter for general API requests
 * 100 requests per minute per IP
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many requests. Try again later.',
    details: { retryAfter: 60 },
  },
})
