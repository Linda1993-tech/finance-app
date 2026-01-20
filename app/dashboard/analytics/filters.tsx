'use client'

import { useState } from 'react'
import type { Category } from '@/lib/types/database'

type FilterProps = {
  categories: Category[]
  onFilterChange: (filters: AnalyticsFilters) => void
}

export type AnalyticsFilters = {
  dateRange: '3' | '6' | '12' | 'all'
  categoryId: string | null
}

export function AnalyticsFilters({ categories, onFilterChange }: FilterProps) {
  const [dateRange, setDateRange] = useState<'3' | '6' | '12' | 'all'>('6')
  const [categoryId, setCategoryId] = useState<string | null>(null)

  function handleDateRangeChange(range: '3' | '6' | '12' | 'all') {
    setDateRange(range)
    onFilterChange({ dateRange: range, categoryId })
  }

  function handleCategoryChange(catId: string) {
    const newCategoryId = catId === '' ? null : catId
    setCategoryId(newCategoryId)
    onFilterChange({ dateRange, categoryId: newCategoryId })
  }

  // Group categories
  const parentCategories = categories.filter((c) => !c.parent_id)
  const getSubcategories = (parentId: string) =>
    categories.filter((c) => c.parent_id === parentId)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filters</h3>
      
      <div className="space-y-4">
        {/* Date Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Time Period
          </label>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => handleDateRangeChange('3')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateRange === '3'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              3 months
            </button>
            <button
              onClick={() => handleDateRangeChange('6')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateRange === '6'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              6 months
            </button>
            <button
              onClick={() => handleDateRangeChange('12')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateRange === '12'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              12 months
            </button>
            <button
              onClick={() => handleDateRangeChange('all')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateRange === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All time
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Filter by Category
          </label>
          <select
            value={categoryId || ''}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Categories</option>
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

        {/* Active Filters Display */}
        {(dateRange !== '6' || categoryId) && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Active Filters:
            </div>
            <div className="flex flex-wrap gap-2">
              {dateRange !== '6' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded text-xs">
                  {dateRange === 'all' ? 'All time' : `${dateRange} months`}
                </span>
              )}
              {categoryId && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200 rounded text-xs">
                  {categories.find((c) => c.id === categoryId)?.name}
                  <button
                    onClick={() => handleCategoryChange('')}
                    className="hover:text-purple-900 dark:hover:text-purple-100"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

