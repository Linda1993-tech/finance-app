import { getCategoryMonthBreakdown } from './category-month-table-actions'

export async function CategoryMonthTable() {
  const { categoryData, monthlyTotals, months } = await getCategoryMonthBreakdown(12)

  if (categoryData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
        <div className="text-4xl mb-4">📊</div>
        <p className="text-gray-600 dark:text-gray-400">
          No expense data to display
        </p>
      </div>
    )
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

            {/* Category Rows */}
            {categoryData.map((category, idx) => {
              const isSubcategory = category.parentCategoryName !== null

              return (
                <tr
                  key={category.categoryId}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                    isSubcategory ? 'bg-gray-50/50 dark:bg-gray-800/50' : ''
                  } ${idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/70'}`}
                >
                  <td className="px-4 py-3 border-r border-gray-300 dark:border-gray-600">
                    <div className="flex items-center gap-2">
                      {isSubcategory && (
                        <span className="text-gray-400 dark:text-gray-500 text-xs">└</span>
                      )}
                      {category.categoryIcon && <span>{category.categoryIcon}</span>}
                      <span
                        className={`${
                          isSubcategory
                            ? 'text-gray-700 dark:text-gray-300'
                            : 'font-medium text-gray-900 dark:text-white'
                        }`}
                      >
                        {category.categoryName}
                      </span>
                      {category.parentCategoryName && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({category.parentCategoryName})
                        </span>
                      )}
                    </div>
                  </td>
                  {months.map((month) => {
                    const amount = category.monthlyAmounts[month] || 0
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
                    €{category.total.toFixed(0)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Export hint */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          💡 Tip: You can copy this table to Excel/Sheets by selecting and copying the data
        </p>
      </div>
    </div>
  )
}

