'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { MonthlyBudgetData } from './budget-year-overview-actions'
import { updateBudgetForMonth } from './budget-actions'

type Props = {
  data: MonthlyBudgetData[]
  year: number
}

type BudgetEdit = {
  categoryId: string
  month: number
  budget: number
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

export function BudgetYearOverviewClient({ data, year }: Props) {
  const router = useRouter()
  const [edits, setEdits] = useState<Map<string, BudgetEdit>>(new Map())
  const [isSaving, setIsSaving] = useState(false)

  function handleEdit(categoryId: string, month: number, budget: number) {
    const key = `${categoryId}-${month}`
    setEdits((prev) => {
      const newEdits = new Map(prev)
      newEdits.set(key, { categoryId, month, budget })
      return newEdits
    })
  }

  function cancelEdit(categoryId: string, month: number) {
    const key = `${categoryId}-${month}`
    setEdits((prev) => {
      const newEdits = new Map(prev)
      newEdits.delete(key)
      return newEdits
    })
  }

  function getEditedBudget(categoryId: string, month: number): number | null {
    const key = `${categoryId}-${month}`
    return edits.get(key)?.budget ?? null
  }

  async function handleSaveAll() {
    if (edits.size === 0) return

    setIsSaving(true)
    try {
      // Save all edits in parallel
      await Promise.all(
        Array.from(edits.values()).map((edit) =>
          updateBudgetForMonth({
            category_id: edit.categoryId,
            month: edit.month,
            budget: edit.budget,
          })
        )
      )

      // Clear edits and refresh
      setEdits(new Map())
      window.location.href = window.location.href
    } catch (error) {
      alert('Failed to save budgets')
      setIsSaving(false)
    }
  }

  function handleCancelAll() {
    setEdits(new Map())
  }

  // Calculate totals with edits applied
  const dataWithEdits = data.map((category) => {
    const budgetByMonth = { ...category.budgetByMonth }
    
    // Apply edits
    for (let month = 1; month <= 12; month++) {
      const edited = getEditedBudget(category.category?.id || '', month)
      if (edited !== null) {
        budgetByMonth[month] = edited
      }
    }

    // Recalculate total
    const totalBudget = Object.values(budgetByMonth).reduce((sum, amount) => sum + amount, 0)

    return {
      ...category,
      budgetByMonth,
      totalBudget,
    }
  })

  // Calculate monthly totals with edits
  const monthlyTotals: { budget: number; spent: number }[] = []
  for (let month = 1; month <= 12; month++) {
    const budget = dataWithEdits.reduce((sum, cat) => sum + (cat.budgetByMonth[month] || 0), 0)
    const spentNet = dataWithEdits.reduce((sum, cat) => sum + (cat.spentByMonth[month] || 0), 0)
    monthlyTotals.push({ budget, spent: Math.abs(spentNet) })
  }

  const grandTotalBudget = dataWithEdits.reduce((sum, cat) => sum + cat.totalBudget, 0)
  const grandTotalSpent = dataWithEdits.reduce((sum, cat) => sum + cat.totalSpent, 0)

  return (
    <div className="space-y-4">
      {/* Save/Cancel Buttons (sticky) */}
      {edits.size > 0 && (
        <div className="sticky top-0 z-10 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💾</span>
            <div>
              <p className="font-semibold text-blue-900 dark:text-blue-100">
                {edits.size} unsaved change{edits.size > 1 ? 's' : ''}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Click "Save All" to apply changes
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCancelAll}
              disabled={isSaving}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  💾 Save All Changes
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider sticky left-0 bg-gray-50 dark:bg-gray-700">
                Category
              </th>
              {MONTHS.map((month) => (
                <th
                  key={month}
                  className="px-3 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                >
                  {month}
                </th>
              ))}
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {dataWithEdits.map((category) => (
              <tr key={category.category?.id || 'uncategorized'} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3 whitespace-nowrap sticky left-0 bg-white dark:bg-gray-800">
                  <div className="flex items-center gap-2">
                    <span>{category.category?.icon}</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {category.category?.name || 'Uncategorized'}
                    </span>
                  </div>
                </td>

                {MONTHS.map((month, monthIdx) => {
                  const monthNum = monthIdx + 1
                  const budget = category.budgetByMonth[monthNum] || 0
                  const spentNet = category.spentByMonth[monthNum] || 0
                  const spent = Math.abs(spentNet)
                  const percentage = budget > 0 ? (spent / budget) * 100 : 0
                  const hasData = budget > 0 || spent > 0
                  const isEdited = getEditedBudget(category.category?.id || '', monthNum) !== null

                  let bgColor = ''
                  if (hasData) {
                    if (percentage > 100) {
                      bgColor = 'bg-red-100 dark:bg-red-900/20'
                    } else if (percentage > 80) {
                      bgColor = 'bg-orange-100 dark:bg-orange-900/20'
                    } else if (budget > 0) {
                      bgColor = 'bg-green-100 dark:bg-green-900/20'
                    }
                  }

                  if (isEdited) {
                    bgColor += ' ring-2 ring-blue-500'
                  }

                  return (
                    <td
                      key={month}
                      className={`px-3 py-3 text-center text-sm cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all ${bgColor}`}
                      onClick={() => {
                        const newBudget = prompt(
                          `Budget for ${category.category?.name || 'category'} in ${month}:`,
                          budget.toString()
                        )
                        if (newBudget !== null && newBudget !== '') {
                          handleEdit(category.category?.id || '', monthNum, parseFloat(newBudget) || 0)
                        }
                      }}
                      title="Click to edit budget"
                    >
                      {hasData ? (
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            €{spent.toFixed(0)}
                          </div>
                          {budget > 0 && (
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              / €{budget.toFixed(0)}
                            </div>
                          )}
                          {budget > 0 && (
                            <div
                              className={`text-xs font-semibold ${
                                percentage > 100
                                  ? 'text-red-600 dark:text-red-400'
                                  : percentage > 80
                                  ? 'text-orange-600 dark:text-orange-400'
                                  : 'text-green-600 dark:text-green-400'
                              }`}
                            >
                              {percentage.toFixed(0)}%
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-600 hover:text-blue-500">
                          -
                        </span>
                      )}
                    </td>
                  )
                })}

                {/* Total Column */}
                <td className="px-4 py-3 text-right text-sm font-semibold">
                  <div className="text-gray-900 dark:text-gray-100">
                    €{category.totalSpent.toFixed(0)}
                  </div>
                  {category.totalBudget > 0 && (
                    <>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        / €{category.totalBudget.toFixed(0)}
                      </div>
                      <div
                        className={`text-xs font-semibold ${
                          (category.totalSpent / category.totalBudget) * 100 > 100
                            ? 'text-red-600 dark:text-red-400'
                            : (category.totalSpent / category.totalBudget) * 100 > 80
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}
                      >
                        {((category.totalSpent / category.totalBudget) * 100).toFixed(0)}%
                      </div>
                    </>
                  )}
                </td>
              </tr>
            ))}

            {/* Monthly Totals Row */}
            <tr className="bg-gray-100 dark:bg-gray-700 font-semibold">
              <td className="px-4 py-3 text-left sticky left-0 bg-gray-100 dark:bg-gray-700">
                Monthly Total
              </td>
              {monthlyTotals.map((total, idx) => {
                const percentage = total.budget > 0 ? (total.spent / total.budget) * 100 : 0
                return (
                  <td key={MONTHS[idx]} className="px-3 py-3 text-center text-sm">
                    <div className="text-gray-900 dark:text-gray-100">€{total.spent.toFixed(0)}</div>
                    {total.budget > 0 && (
                      <>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          / €{total.budget.toFixed(0)}
                        </div>
                        <div
                          className={`text-xs font-semibold ${
                            percentage > 100
                              ? 'text-red-600 dark:text-red-400'
                              : percentage > 80
                              ? 'text-orange-600 dark:text-orange-400'
                              : 'text-green-600 dark:text-green-400'
                          }`}
                        >
                          {percentage.toFixed(0)}%
                        </div>
                      </>
                    )}
                  </td>
                )
              })}
              <td className="px-4 py-3 text-right text-sm">
                <div className="text-gray-900 dark:text-gray-100">€{grandTotalSpent.toFixed(0)}</div>
                {grandTotalBudget > 0 && (
                  <>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      / €{grandTotalBudget.toFixed(0)}
                    </div>
                    <div
                      className={`text-xs font-semibold ${
                        (grandTotalSpent / grandTotalBudget) * 100 > 100
                          ? 'text-red-600 dark:text-red-400'
                          : (grandTotalSpent / grandTotalBudget) * 100 > 80
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}
                    >
                      {((grandTotalSpent / grandTotalBudget) * 100).toFixed(0)}%
                    </div>
                  </>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
