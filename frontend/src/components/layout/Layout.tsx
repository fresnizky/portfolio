import { Outlet, NavLink, Link } from 'react-router'
import { useLogout } from '@/features/auth/hooks/useLogout'
import { useAuth } from '@/features/auth/hooks/useAuth'

const navLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/holdings', label: 'Holdings & Prices' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/evolution', label: 'Evolucion' },
  { to: '/settings', label: 'Configuracion' },
]

export function Layout() {
  const logout = useLogout()
  const { onboardingStatus } = useAuth()

  const showSkippedBanner = onboardingStatus?.skipped && !onboardingStatus?.completed

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skipped Onboarding Banner */}
      {showSkippedBanner && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
          <div className="mx-auto max-w-7xl flex items-center justify-between">
            <p className="text-sm text-amber-800">
              Completa la configuración inicial para aprovechar todas las funciones.
            </p>
            <Link
              to="/onboarding"
              className="text-sm font-medium text-amber-700 hover:text-amber-900"
            >
              Completar setup
            </Link>
          </div>
        </div>
      )}

      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-semibold text-gray-900">
              Portfolio Tracker
            </h1>
            <nav className="flex gap-4">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <button
            onClick={logout}
            className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}
