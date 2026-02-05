'use client'

import { useState } from 'react'
import type { CategoryMonthData, MonthlyTotal } from './category-month-table-actions'

type Props = {
  categoryData: CategoryMonthData[]
  monthlyTotals: MonthlyTotal[]
  months: string[]
}

export function CategoryMonthTableClient({ categoryData, monthlyTotals, months }: Props) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // Separate parent categories and subcategories
  const subcategories = categoryData.filter(cat => cat.parentCategoryName !== null)
  const categoriesWithoutParent = categoryData.filter(cat => cat.parentCategoryName === null)
  
  // Find all unique parent names from subcategories
  const parentNames = new Set(subcategories.map(cat => cat.parentCategoryName))
  
  // Build parent category data by aggregating subcategories
  const parentCategoriesMap = new Map<string, CategoryMonthData>()
  
  for (const parentName of parentNames) {
    if (!parentName) continue
    
    const children = subcategories.filter(cat => cat.parentCategoryName === parentName)
    
    // Check if parent category has direct transactions
    const parentDirectData = categoriesWithoutParent.find(cat => cat.categoryName === parentName)
    
    if (parentDirectData) {
      // Parent has direct transactions, use that data
      parentCategoriesMap.set(parentName, parentDirectData)
    } else {
      // Parent has no direct transactions, aggregate from children
      const aggregatedMonthlyAmounts: Record<string, number> = {}
      let aggregatedTotal = 0
      
      for (const child of children) {
        aggregatedTotal += child.total
        for (const [month, amount] of Object.entries(child.monthlyAmounts)) {
          aggregatedMonthlyAmounts[month] = (aggregatedMonthlyAmounts[month] || 0) + amount
        }
      }
      
      parentCategoriesMap.set(parentName, {
        categoryId: `parent-${parentName}`,
        categoryName: parentName,
        categoryIcon: children[0]?.categoryIcon || null,
        categoryColor: children[0]?.categoryColor || null,
        parentCategoryName: null,
        monthlyAmounts: aggregatedMonthlyAmounts,
        total: aggregatedTotal,
      })
    }
  }
  
  // Standalone categories (no parent, no children)
  const standaloneCategories = categoriesWithoutParent.filter(
    cat => !parentNames.has(cat.categoryName)
  )
  
  // All parent categories (including standalone)
  const allParentCategories = [
    ...Array.from(parentCategoriesMap.values()),
    ...standaloneCategories,
  ]
  
  // Group subcategories by parent name
  const subcategoriesByParent = new Map<string, CategoryMonthData[]>()
  for (const cat of subcategories) {
    if (cat.parentCategoryName) {
      const existing = subcategoriesByParent.get(cat.parentCategoryName) || []
      existing.push(cat)
      subcategoriesByParent.set(cat.parentCategoryName, existing)
    }
  }

  const toggleCategory = (parentName: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(parentName)) {
      newExpanded.delete(parentName)
    } else {
      newExpanded.add(parentName)
    }
    setExpandedCategories(newExpanded)
  }

  // Calculate grand total
  const grandTotal = categoryData.reduce((sum, cat) => sum + cat.total, 0)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          📋 Category × Month Breakdown
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Detailed spending by category for each month (last 12 months)
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-blue-600 text-white sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left font-semibold border-r border-blue-700">
                Category
              </th>
              {months.map((month) => (
                <th
                  key={month}
                  className="px-3 py-3 text-right font-semibold border-r border-blue-700"
                >
                  {new Date(month + '-01').toLocaleDateString('en-US', {
                    month: 'short',
                    year: '2-digit',
                  })}
                </th>
              ))}
              <th className="px-4 py-3 text-right font-semibold bg-blue-700">Total</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {/* Monthly Totals Row */}
            <tr className="bg-blue-50 dark:bg-blue-900/20 font-semibold">
              <td className="px-4 py-3 border-r border-gray-300 dark:border-gray-600">
                <strong>TOTAL EXPENSES</strong>
              </td>
              {months.map((month) => {
                const monthTotal = monthlyTotals.find((mt) => mt.month === month)
                return (
                  <td
                    key={month}
                    className="px-3 py-3 text-right border-r border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  >
                    €{monthTotal ? monthTotal.total.toFixed(0) : '0'}
                  </td>
                )
              })}
              <td className="px-4 py-3 text-right bg-blue-100 dark:bg-blue-900/30 text-lg font-bold text-gray-900 dark:text-white">
                €{grandTotal.toFixed(0)}
              </td>
            </tr>

            {/* Parent Categories (with subcategories) */}
            {allParentCategories.map((parent, idx) => {
              const children = subcategoriesByParent.get(parent.categoryName) || []
              const hasSubcategories = children.length > 0
              const isExpanded = expandedCategories.has(parent.categoryName)

              return (
                <>
                  {/* Parent Row */}
                  <tr
                    key={parent.categoryId}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                      idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/70'
                    }`}
                  >
                    <td className="px-4 py-3 border-r border-gray-300 dark:border-gray-600">
                      <div className="flex items-center gap-2">
                        {hasSubcategories && (
                          <button
                            onClick={() => toggleCategory(parent.categoryName)}
                            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                          >
                            {isExpanded ? '▼' : '▶'}
                          </button>
                        )}
                        {!hasSubcategories && <span className="w-4" />}
                        {parent.categoryIcon && <span>{parent.categoryIcon}</span>}
                        <span className="font-medium text-gray-900 dark:text-white">
                          {parent.categoryName}
                        </span>
                      </div>
                    </td>
                    {months.map((month) => {
                      const amount = parent.monthlyAmounts[month] || 0
                      return (
                        <td
                          key={month}
                          className={`px-3 py-3 text-right border-r border-gray-300 dark:border-gray-600 ${
                            amount > 0
                              ? 'text-gray-900 dark:text-white'
                              : 'text-gray-400 dark:text-gray-600'
                          }`}
                        >
                          {amount > 0 ? `€${amount.toFixed(0)}` : '-'}
                        </td>
                      )
                    })}
                    <td className="px-4 py-3 text-right font-semibold bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white">
                      €{parent.total.toFixed(0)}
                    </td>
                  </tr>

                  {/* Subcategory Rows (only if expanded) */}
                  {isExpanded && children.map((sub) => (
                    <tr
                      key={sub.categoryId}
                      className="bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-700/30"
                    >
                      <td className="px-4 py-3 border-r border-gray-300 dark:border-gray-600">
                        <div className="flex items-center gap-2 ml-6">
                          <span className="text-gray-400 dark:text-gray-500 text-xs">└</span>
                          {sub.categoryIcon && <span className="text-sm">{sub.categoryIcon}</span>}
                          <span className="text-gray-700 dark:text-gray-300 text-sm">
                            {sub.categoryName}
                          </span>
                        </div>
                      </td>
                      {months.map((month) => {
                        const amount = sub.monthlyAmounts[month] || 0
                        return (
                          <td
                            key={month}
                            className={`px-3 py-3 text-right border-r border-gray-300 dark:border-gray-600 text-sm ${
                              amount > 0
                                ? 'text-gray-900 dark:text-white'
                                : 'text-gray-400 dark:text-gray-600'
                            }`}
                          >
                            {amount > 0 ? `€${amount.toFixed(0)}` : '-'}
                          </td>
                        )
                      })}
                      <td className="px-4 py-3 text-right bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm">
                        €{sub.total.toFixed(0)}
                      </td>
                    </tr>
                  ))}
                </>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Export hint */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          💡 Tip: Click ▶ to expand parent categories and see subcategories
        </p>
      </div>
    </div>
  )
}
