import { useAuthStore } from '@/stores/authStore'

export function DashboardPage() {
  const user = useAuthStore((state) => state.user)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome to Portfolio Tracker
        </h1>
        {user && (
          <p className="mt-1 text-gray-600">
            Logged in as {user.email}
          </p>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-500">Dashboard coming soon...</p>
      </div>
    </div>
  )
}
