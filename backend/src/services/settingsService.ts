import { prisma } from '@/config/database'

export interface UserSettings {
  rebalanceThreshold: string // Decimal returned as string
  priceAlertDays: number
}

export interface UpdateSettingsInput {
  rebalanceThreshold?: number
  priceAlertDays?: number
}

export const settingsService = {
  /**
   * Get settings for a user
   * @param userId - The user's ID
   * @returns UserSettings with threshold and alert days
   */
  async getSettings(userId: string): Promise<UserSettings> {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        rebalanceThreshold: true,
        priceAlertDays: true,
      },
    })

    return {
      rebalanceThreshold: user.rebalanceThreshold.toString(),
      priceAlertDays: user.priceAlertDays,
    }
  },

  /**
   * Update settings for a user
   * @param userId - The user's ID
   * @param input - Fields to update
   * @returns Updated UserSettings
   */
  async updateSettings(
    userId: string,
    input: UpdateSettingsInput
  ): Promise<UserSettings> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.rebalanceThreshold !== undefined && {
          rebalanceThreshold: input.rebalanceThreshold,
        }),
        ...(input.priceAlertDays !== undefined && {
          priceAlertDays: input.priceAlertDays,
        }),
      },
      select: {
        rebalanceThreshold: true,
        priceAlertDays: true,
      },
    })

    return {
      rebalanceThreshold: user.rebalanceThreshold.toString(),
      priceAlertDays: user.priceAlertDays,
    }
  },
}
