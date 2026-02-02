'use client'

import { useState } from 'react'
import type { BudgetStatus } from './budget-actions'
import { deleteBudget } from './budget-actions'
import { formatEuro } from '@/lib/utils/currency-format'

type Props = {
  budgetStatuses: BudgetStatus[]
  viewMode?: 'monthly' | 'yearly'
}

export function BudgetList({ budgetStatuses, viewMode = 'monthly' }: Props) {
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(budgetId: string) {
    if (!confirm('Are you sure you want to delete this budget?')) return

    setDeleting(budgetId)
    const result = await deleteBudget(budgetId)

    if (result.success) {
      window.location.reload()
    } else {
      alert(`Error: ${result.error}`)
      setDeleting(null)
    }
  }

  if (budgetStatuses.length === 0) {
    return (
      <p className="text-gray-600 dark:text-gray-400 text-center py-8">
        No budgets set for this month. Create one above!
      </p>
    )
  }

  // Separate parent and subcategory budgets
  const parentBudgets = budgetStatuses.filter((s) => s.budget.category && !s.budget.category.parent_id)
  const subcategoryBudgets = budgetStatuses.filter((s) => s.budget.category?.parent_id)
  const overallBudget = budgetStatuses.find((s) => !s.budget.category)

  // Sort function: prioritize critical budgets
  const sortByUrgency = (a: BudgetStatus, b: BudgetStatus) => {
    // Over budget (>100%) - most urgent, sort by how much over (descending)
    if (a.percentage > 100 && b.percentage > 100) {
      return b.percentage - a.percentage
    }
    if (a.percentage > 100) return -1
    if (b.percentage > 100) return 1
    
    // Warning (80-100%) - moderately urgent, sort by percentage (descending)
    if (a.percentage > 80 && b.percentage > 80) {
      return b.percentage - a.percentage
    }
    if (a.percentage > 80) return -1
    if (b.percentage > 80) return 1
    
    // Safe (<80%) - least urgent, sort by percentage (descending - highest usage first)
    return b.percentage - a.percentage
  }

  // Sort parent budgets by urgency
  const sortedParentBudgets = [...parentBudgets].sort(sortByUrgency)

  // Build display list maintaining hierarchy
  const displayItems: { status: BudgetStatus; isSubcategory: boolean }[] = []

  // Add overall budget first if exists
  if (overallBudget) {
    displayItems.push({ status: overallBudget, isSubcategory: false })
  }

  // Add each parent with its subcategories (subcategories also sorted by urgency)
  for (const parent of sortedParentBudgets) {
    displayItems.push({ status: parent, isSubcategory: false })
    
    // Add subcategories belonging to this parent, sorted by urgency
    const subs = subcategoryBudgets
      .filter((sub) => sub.budget.category?.parent_id === parent.budget.category?.id)
      .sort(sortByUrgency)
    for (const sub of subs) {
      displayItems.push({ status: sub, isSubcategory: true })
    }
  }

  // Add orphan subcategories (whose parent has no budget set), sorted by urgency
  const parentIdsWithBudgets = new Set(sortedParentBudgets.map((p) => p.budget.category?.id))
  const orphanSubs = subcategoryBudgets
    .filter((sub) => !parentIdsWithBudgets.has(sub.budget.category?.parent_id || ''))
    .sort(sortByUrgency)
  for (const sub of orphanSubs) {
    displayItems.push({ status: sub, isSubcategory: false })
  }

  return (
    <div className="space-y-3">
      {displayItems.map((item, idx) =>
        renderBudgetItem(item.status, deleting, handleDelete, item.isSubcategory, idx, viewMode)
      )}
    </div>
  )
}

function renderBudgetItem(
  status: BudgetStatus,
  deleting: string | null,
  handleDelete: (id: string) => void,
  isSubcategory: boolean,
  idx: number,
  viewMode: 'monthly' | 'yearly'
) {
  const isOverBudget = status.percentage > 100
  const isWarning = status.percentage > 80 && !isOverBudget

  return (
    <div
      key={`${status.budget.id}-${idx}`}
      className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${
        isSubcategory ? 'ml-8 bg-gray-50 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-800'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isSubcategory && <span className="text-gray-400">↳</span>}
          {/* Urgency indicator */}
          {isOverBudget && <span className="text-2xl">🚨</span>}
          {isWarning && !isOverBudget && <span className="text-2xl">⚠️</span>}
          {status.budget.category?.icon && (
            <span className="text-2xl">{status.budget.category.icon}</span>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {status.budget.category?.name || 'Overall Budget'}
                {!isSubcategory && status.budget.category && (
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">(Total)</span>
                )}
              </h3>
              {isOverBudget && (
                <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-full font-medium">
                  OVER BUDGET
                </span>
              )}
              {isWarning && !isOverBudget && (
                <span className="text-xs px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 rounded-full font-medium">
                  NEEDS ATTENTION
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {formatEuro(status.spent)} of {formatEuro(status.budget.amount)}
              {viewMode === 'yearly' && (
                <span className="text-xs ml-1">({formatEuro(status.budget.amount / 12)}/mo)</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p
              className={`text-lg font-bold ${
                isOverBudget
                  ? 'text-red-600 dark:text-red-400'
                  : isWarning
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-green-600 dark:text-green-400'
              }`}
            >
              {status.percentage.toFixed(0)}%
            </p>
            <p
              className={`text-sm ${
                status.remaining >= 0
                  ? 'text-gray-600 dark:text-gray-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {formatEuro(Math.abs(status.remaining))}{' '}
              {status.remaining >= 0 ? 'left' : 'over'}
            </p>
          </div>

          <button
            onClick={() => handleDelete(status.budget.id)}
            disabled={deleting === status.budget.id}
            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
            title="Delete budget"
          >
            {deleting === status.budget.id ? '...' : '🗑️'}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isOverBudget
              ? 'bg-red-600 dark:bg-red-500'
              : isWarning
              ? 'bg-orange-500 dark:bg-orange-400'
              : 'bg-green-600 dark:bg-green-500'
          }`}
          style={{ width: `${Math.min(status.percentage, 100)}%` }}
        />
      </div>

      {/* Over budget indicator */}
      {isOverBudget && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">
          ⚠️ Over budget by {formatEuro(status.spent - status.budget.amount)}
        </p>
      )}
    </div>
  )
}

