'use client'

import { useState } from 'react'
import type { BudgetStatus } from './budget-actions'
import type { Category } from '@/lib/types/database'
import { BudgetList } from './budget-list'
import { SetBudgetForm } from './set-budget-form'
import { formatEuro } from '@/lib/utils/currency-format'

type Props = {
  initialBudgetStatuses: BudgetStatus[]
  categories: Category[]
  currentMonth: number
  currentYear: number
}

export function BudgetClient({ initialBudgetStatuses, categories, currentMonth, currentYear }: Props) {
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly')
  const [budgetStatuses, setBudgetStatuses] = useState<BudgetStatus[]>(initialBudgetStatuses)
  const [isLoading, setIsLoading] = useState(false)

  async function handleViewModeChange(mode: 'monthly' | 'yearly') {
    setViewMode(mode)
    setIsLoading(true)

    try {
      const response = await fetch(
        `/api/budget/status?month=${currentMonth}&year=${currentYear}&viewMode=${mode}`
      )
      const data = await response.json()
      setBudgetStatuses(data)
    } catch (error) {
      console.error('Error fetching budget status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate totals
  const totalBudget = budgetStatuses.reduce((sum, status) => sum + status.budget.amount, 0)
  const totalSpent = budgetStatuses.reduce((sum, status) => sum + status.spent, 0)
  const totalRemaining = totalBudget - totalSpent
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  const monthName = new Date(currentYear, currentMonth - 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <>
      {/* View Mode Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-1">
          <button
            onClick={() => handleViewModeChange('monthly')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              viewMode === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => handleViewModeChange('yearly')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              viewMode === 'yearly'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Yearly
          </button>
        </div>
      </div>

      {/* Overall Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Total Budget {viewMode === 'yearly' && '(Year)'}
          </h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {formatEuro(totalBudget)}
          </p>
          {viewMode === 'yearly' && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {formatEuro(totalBudget / 12)}/month
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Total Spent {viewMode === 'yearly' && '(YTD)'}
          </h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {formatEuro(totalSpent)}
          </p>
          {viewMode === 'yearly' && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {formatEuro(totalSpent / currentMonth)}/month avg
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Remaining</h3>
          <p
            className={`mt-2 text-3xl font-bold ${
              totalRemaining >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {formatEuro(totalRemaining)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Used</h3>
          <p
            className={`mt-2 text-3xl font-bold ${
              overallPercentage > 100
                ? 'text-red-600 dark:text-red-400'
                : overallPercentage > 80
                ? 'text-orange-600 dark:text-orange-400'
                : 'text-green-600 dark:text-green-400'
            }`}
          >
            {overallPercentage.toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Set Budget Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Set Budget for {monthName}
        </h2>
        <SetBudgetForm categories={categories} currentMonth={currentMonth} currentYear={currentYear} />
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          💡 Tip: Set monthly budgets here. Switch to "Yearly" view to see how you're tracking against
          your annual targets (monthly budget × 12).
        </p>
      </div>

      {/* Budget List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {viewMode === 'monthly' ? 'Current Month' : `${currentYear} Year-to-Date`} Budget Status
        </h2>
        {isLoading ? (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading...</div>
        ) : (
          <BudgetList budgetStatuses={budgetStatuses} viewMode={viewMode} />
        )}
      </div>
    </>
  )
}

