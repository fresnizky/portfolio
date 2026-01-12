import cors from 'cors'
import type { CorsOptions } from 'cors'

/**
 * Creates CORS middleware with proper configuration for mobile/desktop browsers.
 *
 * Supports:
 * - Multiple allowed origins (comma-separated CORS_ORIGIN env var)
 * - Credentials for cookie-based auth
 * - Preflight OPTIONS requests
 *
 * @returns Configured cors middleware
 */
export const corsMiddleware = () => {
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:10001')
    .split(',')
    .map(origin => origin.trim())

  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) {
        callback(null, true)
        return
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, origin)
      } else {
        callback(null, false)
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }

  return cors(corsOptions)
}
