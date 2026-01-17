import { useState } from 'react'

interface ContributionAmountInputProps {
  onCalculate: (amount: number) => void
  isLoading: boolean
}

export function ContributionAmountInput({ onCalculate, isLoading }: ContributionAmountInputProps) {
  const [amount, setAmount] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Ingresá un monto mayor a 0')
      return
    }

    onCalculate(numericAmount)
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        Calcular Distribución de Aporte
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="contribution-amount"
            className="block text-base md:text-sm font-medium text-gray-700"
          >
            Monto del Aporte ($)
          </label>
          <input
            id="contribution-amount"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value)
              setError(null)
            }}
            disabled={isLoading}
            placeholder="1000.00"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-base placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          {error && (
            <p className="mt-1 text-base md:text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-end">
          <button
            type="submit"
            disabled={isLoading || !amount}
            className="inline-flex w-full sm:w-auto items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading && (
              <svg
                className="-ml-1 mr-2 h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {isLoading ? 'Calculando...' : 'Calcular'}
          </button>
        </div>
      </form>
    </div>
  )
}
