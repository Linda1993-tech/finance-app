'use client'

import { useState } from 'react'
import { deleteCategory } from './actions'
import type { Category } from '@/lib/types/database'

type Props = {
  categories: Category[]
  parentCategories: Category[]
  subcategories: Category[]
}

export function CategoryList({ categories, parentCategories, subcategories }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this category?')) {
      return
    }

    setDeletingId(id)
    try {
      await deleteCategory(id)
    } catch (err) {
      alert('Failed to delete category. It may be in use by transactions.')
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  if (categories.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="text-6xl mb-4">📁</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No categories yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Create your first category to get started
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {parentCategories.map((category) => {
        const children = subcategories.filter((s) => s.parent_id === category.id)

        return (
          <div key={category.id}>
            {/* Parent Category */}
            <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Color Badge */}
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color || '#6B7280' }}
                  />
                  {/* Icon & Name */}
                  <div className="flex items-center gap-2">
                    {category.icon && <span className="text-2xl">{category.icon}</span>}
                    <span className="text-lg font-medium text-gray-900 dark:text-white">
                      {category.name}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <button
                  onClick={() => handleDelete(category.id)}
                  disabled={deletingId === category.id}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                >
                  {deletingId === category.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>

            {/* Subcategories */}
            {children.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-700/30">
                {children.map((sub) => (
                  <div
                    key={sub.id}
                    className="pl-12 pr-4 py-3 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: sub.color || '#6B7280' }}
                      />
                      <div className="flex items-center gap-2">
                        {sub.icon && <span className="text-xl">{sub.icon}</span>}
                        <span className="text-gray-700 dark:text-gray-300">{sub.name}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(sub.id)}
                      disabled={deletingId === sub.id}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                    >
                      {deletingId === sub.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

