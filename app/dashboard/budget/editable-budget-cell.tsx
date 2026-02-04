'use client'

import { useState } from 'react'
import { updateBudgetForMonth } from './budget-actions'

type Props = {
  categoryId: string
  categoryName: string
  month: number
  year: number
  currentBudget: number
  spent: number
}

export function EditableBudgetCell({
  categoryId,
  categoryName,
  month,
  year,
  currentBudget,
  spent,
}: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [budget, setBudget] = useState(currentBudget.toString())
  const [isSaving, setIsSaving] = useState(false)

  const percentage = currentBudget > 0 ? (spent / currentBudget) * 100 : 0
  const hasData = currentBudget > 0 || spent > 0

  let bgColor = ''
  if (hasData) {
    if (percentage > 100) {
      bgColor = 'bg-red-100 dark:bg-red-900/20'
    } else if (percentage > 80) {
      bgColor = 'bg-orange-100 dark:bg-orange-900/20'
    } else if (currentBudget > 0) {
      bgColor = 'bg-green-100 dark:bg-green-900/20'
    }
  }

  async function handleSave() {
    const budgetValue = parseFloat(budget) || 0
    if (budgetValue === currentBudget) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      await updateBudgetForMonth({
        category_id: categoryId,
        month,
        budget: budgetValue,
      })
      setIsEditing(false)
      window.location.reload() // Refresh to show updated data
    } catch (error) {
      alert('Failed to save budget')
    } finally {
      setIsSaving(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setBudget(currentBudget.toString())
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <td className={`px-3 py-3 text-center text-sm ${bgColor}`}>
        <div className="flex flex-col items-center gap-1">
          <div className="font-medium text-gray-900 dark:text-gray-100">
            €{spent.toFixed(0)}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">/ </div>
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            disabled={isSaving}
            autoFocus
            className="w-20 px-2 py-1 text-xs text-center border border-blue-500 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="0"
          />
        </div>
      </td>
    )
  }

  return (
    <td
      className={`px-3 py-3 text-center text-sm cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all ${bgColor}`}
      onClick={() => setIsEditing(true)}
      title="Click to edit budget"
    >
      {hasData ? (
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            €{spent.toFixed(0)}
          </div>
          {currentBudget > 0 && (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              / €{currentBudget.toFixed(0)}
            </div>
          )}
          {currentBudget > 0 && (
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
          Click to set budget
        </span>
      )}
    </td>
  )
}
