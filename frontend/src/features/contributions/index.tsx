import { useState } from 'react'
import { useContributionSuggestion } from './hooks/useContributionSuggestion'
import { ContributionAmountInput } from './components/ContributionAmountInput'
import { AllocationTable } from './components/AllocationTable'
import { SuggestionActions } from './components/SuggestionActions'
import { EmptyState } from './components/EmptyState'
import type { ContributionSuggestion, ContributionAllocation } from '@/types/api'
import { ApiError } from '@/lib/api'

export function ContributionsPage() {
  const [amount, setAmount] = useState<number | null>(null)
  const [suggestion, setSuggestion] = useState<ContributionSuggestion | null>(null)
  const [adjustedAllocations, setAdjustedAllocations] = useState<ContributionAllocation[] | null>(null)

  const { mutate, isPending, isError, error, reset } = useContributionSuggestion()

  const handleCalculate = (inputAmount: number) => {
    setAmount(inputAmount)
    mutate(inputAmount, {
      onSuccess: (data) => {
        setSuggestion(data)
        setAdjustedAllocations(data.allocations)
      },
    })
  }

  const handleAllocationChange = (assetId: string, newAmount: string) => {
    if (!adjustedAllocations) return
    setAdjustedAllocations(prev =>
      prev!.map(a => a.assetId === assetId
        ? { ...a, adjustedAllocation: newAmount }
        : a
      )
    )
  }

  const handleReset = () => {
    if (suggestion) {
      setAdjustedAllocations(suggestion.allocations)
    }
  }

  // Check for specific error types
  const apiError = error instanceof ApiError ? error : null
  const isNoAssetsError = apiError?.error === 'NO_ASSETS'
  const isTargetsError = apiError?.error === 'INVALID_TARGETS'

  if (isNoAssetsError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Aportes</h1>
        <EmptyState type="no-assets" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Aportes</h1>

      <ContributionAmountInput
        onCalculate={handleCalculate}
        isLoading={isPending}
      />

      {isError && !isNoAssetsError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">
            {isTargetsError
              ? 'Los targets deben sumar 100% para calcular la sugerencia de aporte.'
              : apiError?.message ?? error?.message ?? 'Error calculando sugerencia'}
          </p>
          <button
            onClick={() => reset()}
            className="mt-2 text-sm font-medium text-red-700 underline hover:text-red-800"
          >
            Reintentar
          </button>
        </div>
      )}

      {suggestion && adjustedAllocations && (
        <>
          <AllocationTable
            allocations={adjustedAllocations}
            originalAllocations={suggestion.allocations}
            summary={suggestion.summary}
            displayCurrency={suggestion.displayCurrency}
            onAllocationChange={handleAllocationChange}
            onReset={handleReset}
          />

          <SuggestionActions
            allocations={adjustedAllocations}
            amount={amount!}
            displayCurrency={suggestion.displayCurrency}
          />
        </>
      )}
    </div>
  )
}
