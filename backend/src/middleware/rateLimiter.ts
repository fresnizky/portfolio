import rateLimit from 'express-rate-limit'

// Disable rate limiting in test environment
const isTestEnv = process.env.NODE_ENV === 'test'

/**
 * Rate limiter for auth endpoints (login, register)
 * 5 attempts per minute per IP (disabled in test env)
 */
export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isTestEnv ? 0 : 5, // 0 = disabled, 5 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTestEnv, // Skip rate limiting in test environment
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many attempts. Try again later.',
    details: { retryAfter: 60 },
  },
})

/**
 * Rate limiter for general API requests
 * 100 requests per minute per IP (disabled in test env)
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isTestEnv ? 0 : 100, // 0 = disabled, 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTestEnv, // Skip rate limiting in test environment
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many requests. Try again later.',
    details: { retryAfter: 60 },
  },
})
