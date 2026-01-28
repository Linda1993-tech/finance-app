'use client'

import { useState } from 'react'
import type { Category } from '@/lib/types/database'

type FilterProps = {
  categories: Category[]
  onFilterChange: (filters: AnalyticsFilters) => void
}

export type AnalyticsFilters = {
  dateRange: '3' | '6' | '12' | 'all' | 'custom'
  categoryId: string | null
  specificMonth?: string | null // YYYY-MM format
}

export function AnalyticsFilters({ categories, onFilterChange }: FilterProps) {
  const [dateRange, setDateRange] = useState<'3' | '6' | '12' | 'all' | 'custom'>('6')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [specificMonth, setSpecificMonth] = useState<string | null>(null)

  function handleDateRangeChange(range: '3' | '6' | '12' | 'all' | 'custom') {
    setDateRange(range)
    if (range !== 'custom') {
      setSpecificMonth(null)
      onFilterChange({ dateRange: range, categoryId, specificMonth: null })
    } else {
      onFilterChange({ dateRange: range, categoryId, specificMonth })
    }
  }

  function handleCategoryChange(catId: string) {
    const newCategoryId = catId === '' ? null : catId
    setCategoryId(newCategoryId)
    onFilterChange({ dateRange, categoryId: newCategoryId, specificMonth })
  }

  function handleMonthChange(month: string) {
    const newMonth = month === '' ? null : month
    setSpecificMonth(newMonth)
    setDateRange('custom')
    onFilterChange({ dateRange: 'custom', categoryId, specificMonth: newMonth })
  }

  // Generate last 12 months for dropdown
  const availableMonths = Array.from({ length: 12 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    return {
      value: date.toISOString().substring(0, 7),
      label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }
  })

  // Group categories
  const parentCategories = categories.filter((c) => !c.parent_id)
  const getSubcategories = (parentId: string) =>
    categories.filter((c) => c.parent_id === parentId)

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">🔍</span>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Filters</h3>
      </div>
      
      <div className="space-y-6">
        {/* Date Range Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            📅 Time Period
          </label>
          <div className="grid grid-cols-4 gap-2 mb-3">
            <button
              onClick={() => handleDateRangeChange('3')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                dateRange === '3'
                  ? 'bg-blue-600 text-white shadow-lg scale-105'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              3 months
            </button>
            <button
              onClick={() => handleDateRangeChange('6')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                dateRange === '6'
                  ? 'bg-blue-600 text-white shadow-lg scale-105'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              6 months
            </button>
            <button
              onClick={() => handleDateRangeChange('12')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                dateRange === '12'
                  ? 'bg-blue-600 text-white shadow-lg scale-105'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              12 months
            </button>
            <button
              onClick={() => handleDateRangeChange('all')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                dateRange === 'all'
                  ? 'bg-blue-600 text-white shadow-lg scale-105'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All time
            </button>
          </div>
          
          {/* Specific Month Selector */}
          <div className="mt-3">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Or select a specific month:
            </label>
            <select
              value={specificMonth || ''}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="">Choose a month...</option>
              {availableMonths.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            🏷️ Filter by Category
          </label>
          <select
            value={categoryId || ''}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
          >
            <option value="">✨ All Categories</option>
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
        {(dateRange !== '6' || categoryId || specificMonth) && (
          <div className="pt-4 border-t-2 border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                ✓ Active Filters:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {specificMonth && (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-xs font-medium shadow-md">
                  📅 {availableMonths.find(m => m.value === specificMonth)?.label || specificMonth}
                  <button
                    onClick={() => handleMonthChange('')}
                    className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                  >
                    ×
                  </button>
                </span>
              )}
              {!specificMonth && dateRange !== '6' && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium">
                  {dateRange === 'all' ? '♾️ All time' : `📊 ${dateRange} months`}
                </span>
              )}
              {categoryId && (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full text-xs font-medium">
                  🏷️ {categories.find((c) => c.id === categoryId)?.name}
                  <button
                    onClick={() => handleCategoryChange('')}
                    className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5 transition-colors"
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

