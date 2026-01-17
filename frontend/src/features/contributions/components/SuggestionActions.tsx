import { useNavigate } from 'react-router'
import type { ContributionAllocation } from '@/types/api'
import { formatCurrency } from '@/lib/formatters'

interface SuggestionActionsProps {
  allocations: ContributionAllocation[]
  amount: number
  displayCurrency: string
  onUseSuggestion?: () => void
}

interface ContributionPrefillData {
  amount: number
  allocations: ContributionAllocation[]
  timestamp: number
}

export function SuggestionActions({ allocations, amount, displayCurrency, onUseSuggestion }: SuggestionActionsProps) {
  const navigate = useNavigate()

  const savePrefillData = () => {
    const prefillData: ContributionPrefillData = {
      amount,
      allocations,
      timestamp: Date.now(),
    }
    sessionStorage.setItem('contribution-prefill', JSON.stringify(prefillData))
  }

  const handleRecordTransactions = () => {
    savePrefillData()
    navigate('/transactions')
  }

  const handleUseSuggestion = () => {
    savePrefillData()
    onUseSuggestion?.()
  }

  const total = allocations.reduce((sum, a) => sum + parseFloat(a.adjustedAllocation), 0)

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-medium text-gray-900">
            Acciones
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Total a invertir: {formatCurrency(total.toFixed(2), displayCurrency)}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {/* Use Suggestion button - opens inline transaction flow */}
          <button
            type="button"
            onClick={handleUseSuggestion}
            className="inline-flex w-full sm:w-auto items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Usar Sugerencia
          </button>

          {/* Record Transactions - navigates to transactions page */}
          <button
            type="button"
            onClick={handleRecordTransactions}
            className="inline-flex w-full sm:w-auto items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Registrar Transacciones
          </button>
        </div>
      </div>

      {/* Info message */}
      <div className="mt-4 rounded-md bg-blue-50 p-3">
        <p className="text-sm text-blue-700">
          <span className="font-medium">Nota:</span> Al hacer click en "Registrar Transacciones" serás redirigido a la página de transacciones donde podrás crear cada operación manualmente.
        </p>
      </div>
    </div>
  )
}
