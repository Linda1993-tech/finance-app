'use client'

import { useState } from 'react'
import type { BudgetStatus } from './budget-actions'
import { deleteBudget } from './budget-actions'

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

  // Build display list maintaining hierarchy
  const displayItems: { status: BudgetStatus; isSubcategory: boolean }[] = []

  // Add overall budget first if exists
  if (overallBudget) {
    displayItems.push({ status: overallBudget, isSubcategory: false })
  }

  // Add each parent with its subcategories
  for (const parent of parentBudgets) {
    displayItems.push({ status: parent, isSubcategory: false })
    
    // Add subcategories belonging to this parent
    const subs = subcategoryBudgets.filter(
      (sub) => sub.budget.category?.parent_id === parent.budget.category?.id
    )
    for (const sub of subs) {
      displayItems.push({ status: sub, isSubcategory: true })
    }
  }

  // Add orphan subcategories (whose parent has no budget set)
  const parentIdsWithBudgets = new Set(parentBudgets.map((p) => p.budget.category?.id))
  const orphanSubs = subcategoryBudgets.filter(
    (sub) => !parentIdsWithBudgets.has(sub.budget.category?.parent_id || '')
  )
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
          {status.budget.category?.icon && (
            <span className="text-2xl">{status.budget.category.icon}</span>
          )}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {status.budget.category?.name || 'Overall Budget'}
              {!isSubcategory && status.budget.category && (
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">(Total)</span>
              )}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              €{status.spent.toFixed(2)} of €{status.budget.amount.toFixed(2)}
              {viewMode === 'yearly' && (
                <span className="text-xs ml-1">(€{(status.budget.amount / 12).toFixed(2)}/mo)</span>
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
              €{Math.abs(status.remaining).toFixed(2)}{' '}
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
          ⚠️ Over budget by €{(status.spent - status.budget.amount).toFixed(2)}
        </p>
      )}
    </div>
  )
}

