import { useNavigate } from 'react-router'
import { useOnboarding } from './hooks/useOnboarding'
import { OnboardingLayout } from './components/OnboardingLayout'
import { Step1AssetSetup } from './components/Step1AssetSetup'
import { Step2TargetSetup } from './components/Step2TargetSetup'
import { Step3HoldingsSetup } from './components/Step3HoldingsSetup'

const stepConfig = [
  {
    title: 'Configura tus activos',
    description: 'Agrega los activos que deseas trackear en tu portfolio.',
  },
  {
    title: 'Define tus targets',
    description: 'Asigna el porcentaje objetivo para cada activo. Deben sumar 100%.',
  },
  {
    title: 'Carga tus posiciones',
    description: 'Ingresa las cantidades actuales de cada activo (opcional).',
  },
]

export function OnboardingPage() {
  const navigate = useNavigate()
  const {
    step,
    setStep,
    data,
    addAsset,
    removeAsset,
    setTarget,
    setHolding,
    targetSum,
    isTargetValid,
    canProceed,
    complete,
    skip,
    isCompleting,
    isSkipping,
    error,
  } = useOnboarding()

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1)
    } else {
      try {
        await complete()
        navigate('/dashboard')
      } catch (err) {
        console.error('Error completing onboarding:', err)
      }
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSkip = async () => {
    try {
      await skip()
      navigate('/dashboard')
    } catch (err) {
      console.error('Error skipping onboarding:', err)
    }
  }

  const currentStepConfig = stepConfig[step - 1]

  return (
    <OnboardingLayout
      step={step}
      title={currentStepConfig.title}
      description={currentStepConfig.description}
      canProceed={canProceed(step)}
      onBack={handleBack}
      onNext={handleNext}
      onSkip={handleSkip}
      isLastStep={step === 3}
      isSubmitting={isCompleting || isSkipping}
    >
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error instanceof Error ? error.message : 'Ocurrio un error'}
        </div>
      )}

      {step === 1 && (
        <Step1AssetSetup
          assets={data.assets}
          onAdd={addAsset}
          onRemove={removeAsset}
        />
      )}

      {step === 2 && (
        <Step2TargetSetup
          assets={data.assets}
          targets={data.targets}
          onSetTarget={setTarget}
          targetSum={targetSum}
          isValid={isTargetValid}
        />
      )}

      {step === 3 && (
        <Step3HoldingsSetup
          assets={data.assets}
          holdings={data.holdings}
          onSetHolding={setHolding}
        />
      )}
    </OnboardingLayout>
  )
}
