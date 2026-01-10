import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Requerido'),
    newPassword: z.string().min(8, 'Minimo 8 caracteres'),
    confirmPassword: z.string().min(1, 'Requerido'),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Las contrasenas no coinciden',
    path: ['confirmPassword'],
  })

type ChangePasswordForm = z.infer<typeof changePasswordSchema>

export function AccountSection() {
  const { user, logout } = useAuthStore()
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
  })

  const onSubmit = async (data: ChangePasswordForm) => {
    setSaveStatus('idle')
    setErrorMessage(null)

    try {
      await api.auth.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      setSaveStatus('success')
      reset()
      setIsChangingPassword(false)
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      setSaveStatus('error')
      if (error instanceof Error) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('Error al cambiar la contrasena')
      }
    }
  }

  const handleCancel = () => {
    setIsChangingPassword(false)
    reset()
    setSaveStatus('idle')
    setErrorMessage(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Cuenta</h3>
        <p className="text-sm text-gray-500">
          Email: <span className="font-medium text-gray-700">{user?.email}</span>
        </p>
      </div>

      {!isChangingPassword ? (
        <div className="flex gap-3">
          <button
            onClick={() => setIsChangingPassword(true)}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cambiar contrasena
          </button>
          <button
            onClick={logout}
            className="px-4 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
          >
            Cerrar sesion
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium mb-1">
              Contrasena actual
            </label>
            <input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              {...register('currentPassword')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.currentPassword && (
              <p className="text-sm text-red-600 mt-1">{errors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium mb-1">
              Nueva contrasena
            </label>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              {...register('newPassword')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.newPassword && (
              <p className="text-sm text-red-600 mt-1">{errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
              Confirmar nueva contrasena
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register('confirmPassword')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-600 mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>

          {saveStatus === 'error' && errorMessage && (
            <p className="text-sm text-red-600">{errorMessage}</p>
          )}
        </form>
      )}

      {saveStatus === 'success' && (
        <p className="text-sm text-green-600">Contrasena actualizada correctamente</p>
      )}
    </div>
  )
}
