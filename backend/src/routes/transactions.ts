import { Router, Request, Response, NextFunction } from 'express'
import { transactionService } from '@/services/transactionService'
import {
  createTransactionSchema,
  transactionListQuerySchema,
  transactionParamsSchema,
} from '@/validations/transaction'
import { validate, validateParams } from '@/middleware/validate'

const router: Router = Router()

/**
 * POST /api/transactions
 * Create a new transaction (buy or sell)
 */
router.post(
  '/',
  validate(createTransactionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const transaction = await transactionService.create(req.user!.id, req.body)
      res.status(201).json({
        data: transaction,
        message: 'Transaction recorded',
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * GET /api/transactions
 * List transactions with optional filters
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Parse and validate query parameters
    const queryResult = transactionListQuerySchema.safeParse(req.query)
    if (!queryResult.success) {
      const { transactions, total } = await transactionService.list(req.user!.id)
      return res.json({ data: transactions, meta: { total } })
    }

    const { transactions, total } = await transactionService.list(
      req.user!.id,
      queryResult.data
    )
    res.json({ data: transactions, meta: { total } })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/transactions/:id
 * Get a single transaction by ID
 */
router.get(
  '/:id',
  validateParams(transactionParamsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const transaction = await transactionService.getById(req.user!.id, req.params.id)
      res.json({ data: transaction })
    } catch (error) {
      next(error)
    }
  }
)

export default router
