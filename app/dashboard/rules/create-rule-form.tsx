'use client'

import { useState } from 'react'
import { createPatternRule } from './rule-actions'
import type { Category } from '@/lib/types/database'

type Props = {
  categories: Category[]
}

type MatchType = 'contains' | 'starts_with' | 'exact'

export function CreateRuleForm({ categories }: Props) {
  const [pattern, setPattern] = useState('')
  const [matchType, setMatchType] = useState<MatchType>('contains')
  const [categoryId, setCategoryId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Group categories
  const parentCategories = categories.filter((c) => !c.parent_id)
  const getSubcategories = (parentId: string) =>
    categories.filter((c) => c.parent_id === parentId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pattern || !categoryId) return

    setIsSubmitting(true)
    setError('')

    try {
      await createPatternRule(pattern.toUpperCase(), matchType, categoryId)
      setPattern('')
      setCategoryId('')
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create rule')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Create Pattern Rule
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Create a flexible rule that matches transactions by pattern
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Pattern Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Pattern *
          </label>
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="e.g., GLOVO, ALBERT, NETFLIX"
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Enter the text to match (case insensitive)
          </p>
        </div>

        {/* Match Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Match Type
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="matchType"
                value="contains"
                checked={matchType === 'contains'}
                onChange={(e) => setMatchType(e.target.value as MatchType)}
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Contains (Recommended)
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Matches if description contains the pattern anywhere
                </div>
              </div>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="matchType"
                value="starts_with"
                checked={matchType === 'starts_with'}
                onChange={(e) => setMatchType(e.target.value as MatchType)}
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Starts With</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Matches only if description starts with the pattern
                </div>
              </div>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="matchType"
                value="exact"
                checked={matchType === 'exact'}
                onChange={(e) => setMatchType(e.target.value as MatchType)}
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Exact Match</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Matches only if learning key exactly equals the pattern
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Category Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category *
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">-- Choose a category --</option>
            {parentCategories.map((parent) => {
              const subcats = getSubcategories(parent.id)
              return (
                <optgroup key={parent.id} label={`${parent.icon || ''} ${parent.name}`}>
                  <option value={parent.id}>
                    {parent.icon} {parent.name}
                  </option>
                  {subcats.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      &nbsp;&nbsp;└ {sub.icon} {sub.name}
                    </option>
                  ))}
                </optgroup>
              )
            })}
          </select>
        </div>

        {/* Example */}
        {pattern && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Example:</strong> Will match transactions where normalized description{' '}
              {matchType === 'contains' && `contains "${pattern.toUpperCase()}"`}
              {matchType === 'starts_with' && `starts with "${pattern.toUpperCase()}"`}
              {matchType === 'exact' && `exactly equals "${pattern.toUpperCase()}"`}
            </p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || !pattern || !categoryId}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
        >
          {isSubmitting ? 'Creating...' : 'Create Rule'}
        </button>
      </form>
    </div>
  )
}

