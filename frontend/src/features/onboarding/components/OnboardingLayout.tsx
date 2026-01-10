interface OnboardingLayoutProps {
  step: number
  title: string
  description: string
  canProceed: boolean
  onBack: () => void
  onNext: () => void
  onSkip: () => void
  isLastStep: boolean
  isSubmitting: boolean
  children: React.ReactNode
}

const steps = [
  { number: 1, title: 'Activos' },
  { number: 2, title: 'Targets' },
  { number: 3, title: 'Holdings' },
]

export function OnboardingLayout({
  step,
  title,
  description,
  canProceed,
  onBack,
  onNext,
  onSkip,
  isLastStep,
  isSubmitting,
  children,
}: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Progress Bar */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-2xl py-6 px-4">
          <div className="flex justify-between items-center">
            {steps.map((s, i) => (
              <div key={s.number} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= s.number
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {s.number}
                </div>
                <span
                  className={`ml-2 text-sm ${
                    step >= s.number ? 'text-gray-900' : 'text-gray-500'
                  }`}
                >
                  {s.title}
                </span>
                {i < steps.length - 1 && (
                  <div
                    className={`w-12 h-0.5 mx-4 ${
                      step > s.number ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 mx-auto max-w-2xl py-8 px-4 w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600 mt-1">{description}</p>
        </div>

        {children}
      </div>

      {/* Navigation */}
      <div className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-2xl py-4 px-4 flex justify-between">
          <div>
            {step > 1 && (
              <button
                onClick={onBack}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
              >
                Volver
              </button>
            )}
          </div>

          <div className="flex gap-4">
            <button
              onClick={onSkip}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              Saltar por ahora
            </button>
            <button
              onClick={onNext}
              disabled={!canProceed || isSubmitting}
              className={`px-6 py-2 rounded-lg font-medium ${
                canProceed && !isSubmitting
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? 'Procesando...' : isLastStep ? 'Finalizar Setup' : 'Continuar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
