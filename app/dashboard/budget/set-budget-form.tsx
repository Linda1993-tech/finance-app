'use client'

import { useState } from 'react'
import type { Category } from '@/lib/types/database'
import { upsertBudget } from './budget-actions'

type Props = {
  categories: Category[]
  currentMonth: number
  currentYear: number
}

export function SetBudgetForm({ categories, currentMonth, currentYear }: Props) {
  const [categoryId, setCategoryId] = useState<string>('')
  const [amount, setAmount] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const budgetAmount = parseFloat(amount)
    if (isNaN(budgetAmount) || budgetAmount <= 0) {
      setResult({ type: 'error', message: 'Please enter a valid amount greater than 0' })
      return
    }

    setIsSubmitting(true)
    setResult(null)

    const response = await upsertBudget(
      categoryId || null,
      budgetAmount,
      currentMonth,
      currentYear
    )

    if (response.success) {
      setResult({ type: 'success', message: '✅ Budget saved successfully!' })
      setCategoryId('')
      setAmount('')
      // Refresh the page to show updated budget
      setTimeout(() => window.location.reload(), 1000)
    } else {
      setResult({ type: 'error', message: `❌ ${response.error}` })
    }

    setIsSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select a category</option>
            {categories
              .filter((c) => !c.parent_id) // Top-level categories
              .flatMap((category) => {
                const subcategories = categories.filter((sub) => sub.parent_id === category.id)
                const items = [
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name} {subcategories.length > 0 ? '(Total)' : ''}
                  </option>,
                ]
                
                // Add subcategories
                subcategories.forEach((sub) => {
                  items.push(
                    <option key={sub.id} value={sub.id}>
                      &nbsp;&nbsp;↳ {sub.icon} {sub.name}
                    </option>
                  )
                })
                
                return items
              })}
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Leave blank for overall monthly budget
          </p>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Budget Amount (€)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="500.00"
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Result Message */}
      {result && (
        <div
          className={`p-3 rounded-lg text-sm ${
            result.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
          }`}
        >
          {result.message}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || !amount}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
      >
        {isSubmitting ? 'Saving...' : 'Set Budget'}
      </button>
    </form>
  )
}

