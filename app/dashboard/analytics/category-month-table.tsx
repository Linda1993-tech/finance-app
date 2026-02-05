import { getCategoryMonthBreakdown } from './category-month-table-actions'
import { CategoryMonthTableClient } from './category-month-table-client'

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

  return (
    <CategoryMonthTableClient
      categoryData={categoryData}
      monthlyTotals={monthlyTotals}
      months={months}
    />
  )
}
