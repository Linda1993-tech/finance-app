'use client'

import { useState } from 'react'
import { createCategory } from './actions'
import type { Category } from '@/lib/types/database'

type Props = {
  parentCategories: Category[]
}

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Orange
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6B7280', // Gray
  '#059669', // Emerald
]

const PRESET_ICONS = ['🏠', '🍔', '🚗', '⚕️', '🎬', '💰', '💡', '🛍️', '✈️', '📱', '🎓', '💳']

export function CreateCategoryForm({ parentCategories }: Props) {
  const [name, setName] = useState('')
  const [parentId, setParentId] = useState<string>('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [icon, setIcon] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      await createCategory({
        name,
        parent_id: parentId || null,
        color,
        icon: icon || null,
      })

      // Reset form
      setName('')
      setParentId('')
      setColor(PRESET_COLORS[0])
      setIcon('')
    } catch (err) {
      setError('Failed to create category. Make sure the name is unique.')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Category Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Category Name *
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          placeholder="e.g., Groceries"
        />
      </div>

      {/* Parent Category (optional) */}
      <div>
        <label
          htmlFor="parent"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Parent Category (optional)
        </label>
        <select
          id="parent"
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        >
          <option value="">None (top-level category)</option>
          {parentCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Create subcategories by selecting a parent
        </p>
      </div>

      {/* Icon */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Icon (optional)
        </label>
        <div className="grid grid-cols-6 gap-2">
          {PRESET_ICONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setIcon(emoji)}
              className={`p-2 text-2xl rounded-lg border-2 transition-all ${
                icon === emoji
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
        {icon && (
          <button
            type="button"
            onClick={() => setIcon('')}
            className="mt-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            Clear icon
          </button>
        )}
      </div>

      {/* Color */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Color
        </label>
        <div className="grid grid-cols-4 gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`h-10 rounded-lg border-2 transition-all ${
                color === c
                  ? 'border-gray-900 dark:border-white scale-110'
                  : 'border-gray-200 dark:border-gray-600 hover:scale-105'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting || !name.trim()}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
      >
        {isSubmitting ? 'Creating...' : 'Create Category'}
      </button>
    </form>
  )
}

