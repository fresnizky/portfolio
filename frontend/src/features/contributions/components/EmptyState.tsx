import { Link } from 'react-router'

interface EmptyStateProps {
  type: 'no-assets' | 'invalid-targets'
}

const emptyStateContent = {
  'no-assets': {
    icon: (
      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    title: 'Sin activos configurados',
    description: 'Para calcular la distribución de aportes, primero necesitás agregar activos a tu portfolio y establecer sus targets.',
    actionLabel: 'Ir a Portfolio',
    actionHref: '/portfolio',
  },
  'invalid-targets': {
    icon: (
      <svg className="mx-auto h-12 w-12 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    title: 'Targets no suman 100%',
    description: 'Los targets de tus activos deben sumar exactamente 100% para poder calcular la distribución óptima del aporte.',
    actionLabel: 'Ajustar Targets',
    actionHref: '/portfolio',
  },
}

export function EmptyState({ type }: EmptyStateProps) {
  const content = emptyStateContent[type]

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
      <div className="mb-4">{content.icon}</div>
      <h3 className="text-lg font-semibold text-gray-900">{content.title}</h3>
      <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">{content.description}</p>
      <div className="mt-6">
        <Link
          to={content.actionHref}
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {content.actionLabel}
        </Link>
      </div>
    </div>
  )
}
