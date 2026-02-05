'use client'

import { useState } from 'react'
import type { Category } from '@/lib/types/database'

type FilterProps = {
  categories: Category[]
  availableMonths?: { value: string; label: string }[]
  onFilterChange: (filters: AnalyticsFilters) => void
}

export type AnalyticsFilters = {
  dateRange: '3' | '6' | '12' | 'all' | 'custom'
  specificMonth?: string | null // YYYY-MM format
}

export function AnalyticsFilters({ categories, availableMonths = [], onFilterChange }: FilterProps) {
  const [dateRange, setDateRange] = useState<'3' | '6' | '12' | 'all' | 'custom'>('12') // Default to current year
  const [specificMonth, setSpecificMonth] = useState<string | null>(null)

  function handleDateRangeChange(range: '3' | '6' | '12' | 'all' | 'custom') {
    setDateRange(range)
    if (range !== 'custom') {
      setSpecificMonth(null)
      onFilterChange({ dateRange: range, specificMonth: null })
    } else {
      onFilterChange({ dateRange: range, specificMonth })
    }
  }

  function handleMonthChange(month: string) {
    const newMonth = month === '' ? null : month
    setSpecificMonth(newMonth)
    setDateRange('custom')
    onFilterChange({ dateRange: 'custom', specificMonth: newMonth })
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
      {/* Compact Single-Row Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Time Period Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            📅 Period:
          </label>
          <select
            value={dateRange}
            onChange={(e) => handleDateRangeChange(e.target.value as any)}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
          >
            <option value="3">Last 3 months</option>
            <option value="6">Last 6 months</option>
            <option value="12">Current year (YTD)</option>
            <option value="all">All time</option>
          </select>
        </div>

        {/* Specific Month Picker */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            or Month:
          </label>
          <select
            value={specificMonth || ''}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
          >
            <option value="">Select month...</option>
            {availableMonths.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>

        {/* Active Filter Tags */}
        {specificMonth && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium">
              {availableMonths.find(m => m.value === specificMonth)?.label}
              <button
                onClick={() => handleMonthChange('')}
                className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full w-4 h-4 flex items-center justify-center transition-colors"
              >
                ×
              </button>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

