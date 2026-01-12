import { z } from 'zod'

export const transactionTypeSchema = z.enum(['buy', 'sell'])

export const createTransactionFormSchema = z.object({
  type: transactionTypeSchema,
  assetId: z.string().min(1, 'Asset is required'),
  // Date accepts YYYY-MM-DD from HTML date input; conversion to ISO 8601
  // happens in TransactionForm.handleFormSubmit before API submission
  date: z.string().min(1, 'Date is required'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  price: z.number().positive('Price must be greater than 0'),
  commission: z.number().min(0, 'Commission cannot be negative'),
})

export type CreateTransactionFormData = z.infer<typeof createTransactionFormSchema>
