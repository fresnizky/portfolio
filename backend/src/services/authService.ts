import { prisma } from '@/config/database'
import { hashPassword, verifyPassword } from '@/lib/password'
import { generateToken } from '@/lib/jwt'
import { Errors } from '@/lib/errors'

export interface AuthResult {
  user: {
    id: string
    email: string
  }
  token: string
}

export const authService = {
  /**
   * Register a new user
   * @param email - User email
   * @param password - User password (plaintext)
   * @returns User data and JWT token
   * @throws AppError with code CONFLICT if email already exists
   */
  async register(email: string, password: string): Promise<AuthResult> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw Errors.conflict('Email already registered')
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
    })

    // Generate JWT token
    const token = generateToken({ id: user.id, email: user.email })

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      token,
    }
  },

  /**
   * Authenticate a user
   * @param email - User email
   * @param password - User password (plaintext)
   * @returns User data and JWT token
   * @throws AppError with code UNAUTHORIZED if credentials are invalid
   */
  async login(email: string, password: string): Promise<AuthResult> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    })

    // Use generic error message to not reveal if email exists
    if (!user) {
      throw Errors.unauthorized('Invalid email or password')
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash)
    if (!isValidPassword) {
      throw Errors.unauthorized('Invalid email or password')
    }

    // Generate JWT token
    const token = generateToken({ id: user.id, email: user.email })

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      token,
    }
  },

  /**
   * Change user password
   * @param userId - User ID
   * @param currentPassword - Current password (plaintext)
   * @param newPassword - New password (plaintext)
   * @returns Success indicator
   * @throws AppError with code UNAUTHORIZED if current password is incorrect
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean }> {
    // Find user
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
    })

    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, user.passwordHash)
    if (!isValidPassword) {
      throw Errors.unauthorized('Current password is incorrect')
    }

    // Hash new password and update
    const newPasswordHash = await hashPassword(newPassword)
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    })

    return { success: true }
  },
}
