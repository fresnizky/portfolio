import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Request, Response, NextFunction } from 'express'
import { authMiddleware } from './auth'

// Mock JWT utilities
vi.mock('@/lib/jwt', () => ({
  verifyToken: vi.fn(),
}))

import { verifyToken } from '@/lib/jwt'

describe('authMiddleware', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockNext: NextFunction

  const callMiddleware = () =>
    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext)

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.JWT_SECRET = 'test-secret'

    mockRequest = {
      headers: {},
    }
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    }
    mockNext = vi.fn()
  })

  afterEach(() => {
    delete process.env.JWT_SECRET
  })

  it('should call next() and attach user for valid token', async () => {
    const mockPayload = { id: 'user-123', email: 'test@example.com' }
    mockRequest.headers = { authorization: 'Bearer valid-token' }
    vi.mocked(verifyToken).mockReturnValue(mockPayload)

    await callMiddleware()

    expect(verifyToken).toHaveBeenCalledWith('valid-token')
    expect(mockRequest.user).toEqual(mockPayload)
    expect(mockNext).toHaveBeenCalledWith()
  })

  it('should throw unauthorized error when no authorization header', async () => {
    mockRequest.headers = {}

    await callMiddleware()

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        code: 'UNAUTHORIZED',
      })
    )
  })

  it('should throw unauthorized error when authorization header has wrong format', async () => {
    mockRequest.headers = { authorization: 'InvalidFormat token' }

    await callMiddleware()

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        code: 'UNAUTHORIZED',
      })
    )
  })

  it('should throw unauthorized error when token is empty', async () => {
    mockRequest.headers = { authorization: 'Bearer ' }

    await callMiddleware()

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        code: 'UNAUTHORIZED',
      })
    )
  })

  it('should throw unauthorized error when token is invalid', async () => {
    mockRequest.headers = { authorization: 'Bearer invalid-token' }
    vi.mocked(verifyToken).mockImplementation(() => {
      throw new Error('Invalid token')
    })

    await callMiddleware()

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      })
    )
  })
})
