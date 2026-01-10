import { prisma } from '@/config/database'

export interface OnboardingStatus {
  completed: boolean
  skipped: boolean
}

export const onboardingService = {
  /**
   * Get onboarding status for a user
   * @param userId - The user's ID
   * @returns OnboardingStatus with completed and skipped flags
   */
  async getStatus(userId: string): Promise<OnboardingStatus> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        onboardingCompleted: true,
        onboardingSkipped: true,
      },
    })

    if (!user) {
      return { completed: false, skipped: false }
    }

    return {
      completed: user.onboardingCompleted,
      skipped: user.onboardingSkipped,
    }
  },

  /**
   * Mark onboarding as completed for a user
   * @param userId - The user's ID
   * @returns Updated status
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
      },
    })

    return {
      completed: user.onboardingCompleted,
      skipped: user.onboardingSkipped,
    }
  },

  /**
   * Mark onboarding as skipped for a user
   * @param userId - The user's ID
   * @returns Updated status
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
      },
    })

    return {
      completed: user.onboardingCompleted,
      skipped: user.onboardingSkipped,
    }
  },
}
