import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserPreferences } from './actions'
import { SettingsForm } from './settings-form'

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const preferences = await getUserPreferences()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <span className="text-4xl">⚙️</span>
                Settings
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Manage your app preferences
              </p>
            </div>
            <a
              href="/dashboard"
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SettingsForm preferences={preferences} />
      </main>
    </div>
  )
}
