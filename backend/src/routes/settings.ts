import { Router, Request, Response, NextFunction } from 'express'
import { settingsService } from '@/services/settingsService'
import { exportService } from '@/services/exportService'
import { validate } from '@/middleware/validate'
import { updateSettingsSchema } from '@/validations/settings'

const router: Router = Router()

/**
 * GET /api/settings
 * Get settings for the authenticated user
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await settingsService.getSettings(req.user!.id)
    res.json({ data: settings })
  } catch (error) {
    next(error)
  }
})

/**
 * PUT /api/settings
 * Update settings for the authenticated user
 */
router.put(
  '/',
  validate(updateSettingsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const settings = await settingsService.updateSettings(req.user!.id, req.body)
      res.json({ data: settings, message: 'Settings updated' })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * GET /api/settings/export/json
 * Export all user data as JSON
 */
router.get(
  '/export/json',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await exportService.exportJson(req.user!.id)
      res.json({ data })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * GET /api/settings/export/csv
 * Export all user data as a ZIP file containing CSVs
 */
router.get(
  '/export/csv',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const buffer = await exportService.exportCsv(req.user!.id)
      res.set({
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="portfolio-backup.zip"',
        'Content-Length': buffer.length,
      })
      res.send(buffer)
    } catch (error) {
      next(error)
    }
  }
)

export default router
