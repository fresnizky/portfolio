import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSettings } from '../hooks/useSettings'
import { useEffect, useState } from 'react'

const settingsSchema = z.object({
  rebalanceThreshold: z
    .number()
    .min(1, 'Minimum is 1%')
    .max(50, 'Maximum is 50%'),
  priceAlertDays: z
    .number()
    .int('Must be a whole number')
    .min(1, 'Minimum is 1 day')
    .max(30, 'Maximum is 30 days'),
})

type SettingsFormData = z.infer<typeof settingsSchema>

export function SettingsForm() {
  const { settings, isLoading, updateSettings, isUpdating } = useSettings()
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
  })

  // Reset form when settings load
  useEffect(() => {
    if (settings) {
      reset({
        rebalanceThreshold: parseFloat(settings.rebalanceThreshold),
        priceAlertDays: settings.priceAlertDays,
      })
    }
  }, [settings, reset])

  const onSubmit = async (data: SettingsFormData) => {
    setSaveStatus('idle')
    try {
      await updateSettings(data)
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-16 bg-gray-200 rounded" />
        <div className="h-16 bg-gray-200 rounded" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="rebalanceThreshold" className="block text-sm font-medium mb-1">
            Umbral de rebalanceo
          </label>
          <p className="text-sm text-gray-500 mb-2">
            Porcentaje de desviacion para mostrar alertas de rebalanceo
          </p>
          <div className="flex items-center gap-2">
            <input
              id="rebalanceThreshold"
              type="number"
              step="0.5"
              min="1"
              max="50"
              {...register('rebalanceThreshold', { valueAsNumber: true })}
              className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="text-gray-500">%</span>
          </div>
          {errors.rebalanceThreshold && (
            <p className="text-sm text-red-600 mt-1">{errors.rebalanceThreshold.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="priceAlertDays" className="block text-sm font-medium mb-1">
            Dias para alerta de precios
          </label>
          <p className="text-sm text-gray-500 mb-2">
            Numero de dias sin actualizar precios para mostrar alerta
          </p>
          <div className="flex items-center gap-2">
            <input
              id="priceAlertDays"
              type="number"
              min="1"
              max="30"
              {...register('priceAlertDays', { valueAsNumber: true })}
              className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="text-gray-500">dias</span>
          </div>
          {errors.priceAlertDays && (
            <p className="text-sm text-red-600 mt-1">{errors.priceAlertDays.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={!isDirty || isUpdating}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isUpdating ? 'Guardando...' : 'Guardar cambios'}
        </button>

        {saveStatus === 'success' && (
          <span className="text-sm text-green-600">Guardado correctamente</span>
        )}
        {saveStatus === 'error' && (
          <span className="text-sm text-red-600">Error al guardar</span>
        )}
      </div>
    </form>
  )
}
