import { getMonthlyTrends, getCategorySpending, getCurrentMonthSummary } from './data-actions'
import { getCategories } from '../categories/actions'
import { AnalyticsClient } from './analytics-client'
import { RecurringExpenses } from './recurring-expenses'
import { CategoryMonthTable } from './category-month-table'

export default async function AnalyticsPage() {
  const [monthlyTrends, categorySpending, currentMonth, categories] = await Promise.all([
    getMonthlyTrends(12), // Last 12 months (client will filter)
    getCategorySpending(), // All time
    getCurrentMonthSummary(),
    getCategories(),
  ])

  const currentMonthSpending = await getCategorySpending(currentMonth.month)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Analytics Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Visualize your spending patterns and trends
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

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <AnalyticsClient
          initialMonthlyTrends={monthlyTrends}
          initialCategorySpending={categorySpending}
          initialCurrentMonthSpending={currentMonthSpending}
          categories={categories}
          currentMonth={currentMonth}
        />
        
        <CategoryMonthTable />

        <RecurringExpenses />
      </main>
    </div>
  )
}

