import { SettingsForm } from './components/SettingsForm'
import { ExportSection } from './components/ExportSection'
import { AccountSection } from './components/AccountSection'

export function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-8">Configuracion</h1>

      <div className="space-y-8">
        {/* Alert Settings Section */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Preferencias de alertas</h2>
          <SettingsForm />
        </section>

        {/* Data Export Section */}
        <section className="bg-white rounded-lg shadow p-6">
          <ExportSection />
        </section>

        {/* Account Section */}
        <section className="bg-white rounded-lg shadow p-6">
          <AccountSection />
        </section>
      </div>
    </div>
  )
}
