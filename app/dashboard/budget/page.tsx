import { getBudgetStatus, getAllCategoriesBudgetStatus } from './budget-actions'
import { getCategories } from '../categories/actions'
import { BudgetClient } from './budget-client'
import { BudgetYearOverview } from './budget-year-overview'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function BudgetPage() {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  // Fetch budget statuses for ALL categories in the yearly table
  const [categories, allCategoriesStatus] = await Promise.all([
    getCategories(),
    getAllCategoriesBudgetStatus(currentMonth, currentYear), // For EVERYTHING (cards + budget list)
  ])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Budget</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Track your spending with monthly and yearly budgets
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
        {/* Toggle, Cards, and Set Budget Form */}
        <BudgetClient
          initialBudgetStatuses={allCategoriesStatus}
          categories={categories}
          currentMonth={currentMonth}
          currentYear={currentYear}
          showBudgetList={false}
        />

        {/* Yearly Budget Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {currentYear} Budget × Month Breakdown
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Compare budgeted vs actual spending for each category across all months. 
            Monthly budgets automatically apply to all 12 months. Each category shows only its own spending 
            (subcategories do not roll up to parents).
          </p>
          <BudgetYearOverview year={currentYear} />
        </div>

        {/* Current Month Budget Status - Shows ALL categories from yearly table with current month data */}
        <BudgetClient
          initialBudgetStatuses={allCategoriesStatus}
          categories={categories}
          currentMonth={currentMonth}
          currentYear={currentYear}
          showBudgetList={true}
        />
      </main>
    </div>
  )
}

