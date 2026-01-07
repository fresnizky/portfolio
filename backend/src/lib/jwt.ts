import jwt from 'jsonwebtoken'
import type { StringValue } from 'ms'

const DEFAULT_EXPIRES_IN: StringValue = '1h'

export interface JwtPayload {
  id: string
  email: string
  iat?: number
  exp?: number
}

/**
 * Get JWT secret from environment, throwing if not set
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required')
  }
  return secret
}

/**
 * Get token expiration from environment or use default
 */
function getExpiresIn(): StringValue | number {
  const envValue = process.env.JWT_EXPIRES_IN
  if (!envValue) {
    return DEFAULT_EXPIRES_IN
  }
  // If it's a pure number string, convert to number (seconds)
  const numValue = Number(envValue)
  if (!isNaN(numValue)) {
    return numValue
  }
  // Otherwise treat as StringValue (e.g., "1h", "30m")
  return envValue as StringValue
}

/**
 * Generate a JWT token for a user
 * @param payload - The payload to encode (id and email)
 * @param expiresIn - Token expiration time (default: 1h)
 * @returns The signed JWT token
 */
export function generateToken(
  payload: Pick<JwtPayload, 'id' | 'email'>,
  expiresIn?: StringValue | number
): string {
  const secret = getJwtSecret()
  return jwt.sign(payload, secret, { expiresIn: expiresIn ?? getExpiresIn() })
}

/**
 * Verify and decode a JWT token
 * @param token - The JWT token to verify
 * @returns The decoded payload
 * @throws Error if token is invalid or expired
 */
export function verifyToken(token: string): JwtPayload {
  const secret = getJwtSecret()
  return jwt.verify(token, secret) as JwtPayload
}
