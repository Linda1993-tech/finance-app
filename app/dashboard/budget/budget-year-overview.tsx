import { getYearlyBudgetOverview } from './budget-year-overview-actions'
import { EditableBudgetCell } from './editable-budget-cell'

type Props = {
  year: number
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

export async function BudgetYearOverview({ year }: Props) {
  const data = await getYearlyBudgetOverview(year)

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600 dark:text-gray-400">
        No budgets set for {year}. Set monthly budgets above!
      </div>
    )
  }

  // Count ALL categories for totals since we're not rolling up to parents anymore
  // Each category shows only its own spending
  const categoriesToCount = data

  // Calculate column totals (total budget per month, total spent per month)
  const monthlyTotals: { budget: number; spent: number }[] = []
  for (let month = 1; month <= 12; month++) {
    const budget = categoriesToCount.reduce((sum, cat) => sum + (cat.budgetByMonth[month] || 0), 0)
    // Sum spending (can be negative with reimbursements), then take absolute for display
    const spentNet = categoriesToCount.reduce((sum, cat) => sum + (cat.spentByMonth[month] || 0), 0)
    monthlyTotals.push({ budget, spent: Math.abs(spentNet) })
  }

  // Grand totals (from counted categories to avoid double-counting)
  const grandTotalBudget = categoriesToCount.reduce((sum, cat) => sum + cat.totalBudget, 0)
  const grandTotalSpent = categoriesToCount.reduce((sum, cat) => sum + cat.totalSpent, 0)

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700/50">
          <tr>
            <th className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-700/50 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Category
            </th>
            {MONTHS.map((month, idx) => (
              <th
                key={month}
                className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {month}
              </th>
            ))}
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((category, idx) => {
            const isSubcategory = category.category?.parent_id !== null
            return (
              <tr
                key={idx}
                className={isSubcategory ? 'bg-gray-50 dark:bg-gray-800/50' : ''}
              >
                <td
                  className={`sticky left-0 z-10 ${
                    isSubcategory ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-800'
                  } px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white`}
                >
                  {isSubcategory && <span className="text-gray-400 mr-1">↳</span>}
                  {category.category?.icon && (
                    <span className="mr-1">{category.category.icon}</span>
                  )}
                  {category.category?.name || 'Uncategorized'}
                </td>
                {MONTHS.map((month, monthIdx) => {
                  const monthNum = monthIdx + 1
                  const budget = category.budgetByMonth[monthNum] || 0
                  const spentNet = category.spentByMonth[monthNum] || 0
                  // Display absolute value (net spending after reimbursements)
                  const spent = Math.abs(spentNet)

                  return (
                    <EditableBudgetCell
                      key={month}
                      categoryId={category.category_id}
                      categoryName={category.category_name}
                      month={monthNum}
                      year={year}
                      currentBudget={budget}
                      spent={spent}
                    />
                  )
                })}
                <td className="px-4 py-3 text-right text-sm font-semibold">
                  <div className="text-gray-900 dark:text-gray-100">
                    €{category.totalSpent.toFixed(0)}
                  </div>
                  {category.totalBudget > 0 && (
                    <>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        / €{category.totalBudget.toFixed(0)}
                      </div>
                      <div
                        className={`text-xs font-semibold ${
                          (category.totalSpent / category.totalBudget) * 100 > 100
                            ? 'text-red-600 dark:text-red-400'
                            : (category.totalSpent / category.totalBudget) * 100 > 80
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}
                      >
                        {((category.totalSpent / category.totalBudget) * 100).toFixed(0)}%
                      </div>
                    </>
                  )}
                </td>
              </tr>
            )
          })}

          {/* Monthly Totals Row */}
          <tr className="bg-gray-100 dark:bg-gray-700 font-semibold">
            <td className="sticky left-0 z-10 bg-gray-100 dark:bg-gray-700 px-4 py-3 text-sm text-gray-900 dark:text-white">
              <div>Monthly Total</div>
              <div className="text-xs font-normal text-gray-600 dark:text-gray-400">(all budgeted categories)</div>
            </td>
            {monthlyTotals.map((total, idx) => {
              const percentage = total.budget > 0 ? (total.spent / total.budget) * 100 : 0
              return (
                <td key={idx} className="px-3 py-3 text-center text-sm">
                  <div className="text-gray-900 dark:text-gray-100">
                    €{total.spent.toFixed(0)}
                  </div>
                  {total.budget > 0 && (
                    <>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        / €{total.budget.toFixed(0)}
                      </div>
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
                    </>
                  )}
                </td>
              )
            })}
            <td className="px-4 py-3 text-right text-sm">
              <div className="text-gray-900 dark:text-gray-100">
                €{grandTotalSpent.toFixed(0)}
              </div>
              {grandTotalBudget > 0 && (
                <>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    / €{grandTotalBudget.toFixed(0)}
                  </div>
                  <div
                    className={`text-xs font-semibold ${
                      (grandTotalSpent / grandTotalBudget) * 100 > 100
                        ? 'text-red-600 dark:text-red-400'
                        : (grandTotalSpent / grandTotalBudget) * 100 > 80
                        ? 'text-orange-600 dark:text-orange-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}
                  >
                    {((grandTotalSpent / grandTotalBudget) * 100).toFixed(0)}%
                  </div>
                </>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

