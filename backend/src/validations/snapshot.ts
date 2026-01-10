import { z } from 'zod'

// Date string that accepts both ISO 8601 datetime and date-only formats
const dateStringSchema = z
  .string()
  .refine(
    val => {
      // Accept ISO 8601 datetime format or YYYY-MM-DD date format
      const isoDateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
      const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/
      return isoDateTimeRegex.test(val) || dateOnlyRegex.test(val)
    },
    { message: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ) or date only (YYYY-MM-DD).' }
  )

// Snapshot list query schema with optional date range filters
export const snapshotQuerySchema = z.object({
  from: dateStringSchema.optional(),
  to: dateStringSchema.optional(),
})

// Route params for single snapshot
export const snapshotIdParamSchema = z.object({
  id: z.string().min(1, 'Snapshot ID is required'),
})

export type SnapshotQuery = z.infer<typeof snapshotQuerySchema>
export type SnapshotIdParams = z.infer<typeof snapshotIdParamSchema>
