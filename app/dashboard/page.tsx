import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logout } from './actions'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Finance Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {user.email}
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors text-sm font-medium"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Actions */}
          <a
            href="/dashboard/categories"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="text-4xl">📁</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Categories
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage your categories
                </p>
              </div>
            </div>
          </a>

          <a
            href="/dashboard/import"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="text-4xl">📤</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Import
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Upload CSV or XLSX files
                </p>
              </div>
            </div>
          </a>

          <a
            href="/dashboard/transactions"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="text-4xl">📊</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Transactions
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  View all transactions
                </p>
              </div>
            </div>
          </a>

          <a
            href="/dashboard/budget"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="text-4xl">💰</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Budget
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Set spending limits
                </p>
              </div>
            </div>
          </a>

          <a
            href="/dashboard/savings"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="text-4xl">🏦</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Savings
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Toegankelijk spaargeld
                </p>
              </div>
            </div>
          </a>

          <a
            href="/dashboard/pension"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="text-4xl">💼</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Pensioen
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pensioenspaarrekeningen
                </p>
              </div>
            </div>
          </a>

          <a
            href="/dashboard/stocks"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="text-4xl">📈</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Stocks
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Track your DeGiro portfolio
                </p>
              </div>
            </div>
          </a>

          <a
            href="/dashboard/analytics"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="text-4xl">📉</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Analytics
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Charts & insights
                </p>
              </div>
            </div>
          </a>

          <a
            href="/dashboard/rules"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="text-4xl">📚</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Rules
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  View learning rules
                </p>
              </div>
            </div>
          </a>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Welcome to your Finance App! 🎉
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Your account is set up and ready. Here's our progress:
          </p>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400">
            <li>✅ Authentication</li>
            <li>✅ Database schema</li>
            <li>✅ Category management</li>
            <li>✅ CSV/XLSX import functionality</li>
            <li>✅ Smart categorization with learning</li>
            <li>✅ Monthly expense dashboards</li>
            <li>✅ Budget planning & tracking</li>
          </ul>
        </div>
      </main>
    </div>
  )
}

