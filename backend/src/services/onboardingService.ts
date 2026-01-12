import { prisma } from '@/config/database'

export interface OnboardingStatus {
  completed: boolean
  skipped: boolean
  hasExistingData: boolean
}

export const onboardingService = {
  /**
   * Get onboarding status for a user
   * Checks if user has existing assets to determine if onboarding is needed
   * @param userId - The user's ID
   * @returns OnboardingStatus with completed, skipped, and hasExistingData flags
   */
  async getStatus(userId: string): Promise<OnboardingStatus> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        onboardingCompleted: true,
        onboardingSkipped: true,
        _count: {
          select: { assets: true },
        },
      },
    })

    if (!user) {
      return { completed: false, skipped: false, hasExistingData: false }
    }

    const hasExistingData = user._count.assets > 0

    return {
      completed: user.onboardingCompleted || hasExistingData,
      skipped: user.onboardingSkipped,
      hasExistingData,
    }
  },

  /**
   * Mark onboarding as completed for a user
   * @param userId - The user's ID
   * @returns Updated status with hasExistingData
   */
  async markCompleted(userId: string): Promise<OnboardingStatus> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        onboardingCompleted: true,
        onboardingSkipped: false,
      },
      select: {
        onboardingCompleted: true,
        onboardingSkipped: true,
        _count: {
          select: { assets: true },
        },
      },
    })

    const hasExistingData = user._count.assets > 0

    return {
      completed: user.onboardingCompleted,
      skipped: user.onboardingSkipped,
      hasExistingData,
    }
  },

  /**
   * Mark onboarding as skipped for a user
   * @param userId - The user's ID
   * @returns Updated status with hasExistingData
   */
  async markSkipped(userId: string): Promise<OnboardingStatus> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        onboardingSkipped: true,
      },
      select: {
        onboardingCompleted: true,
        onboardingSkipped: true,
        _count: {
          select: { assets: true },
        },
      },
    })

    const hasExistingData = user._count.assets > 0

    return {
      completed: user.onboardingCompleted,
      skipped: user.onboardingSkipped,
      hasExistingData,
    }
  },
}
