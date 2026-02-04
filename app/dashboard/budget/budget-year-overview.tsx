import { getYearlyBudgetOverview } from './budget-year-overview-actions'
import { BudgetYearOverviewClient } from './budget-year-overview-client'

type Props = {
  year: number
}

export async function BudgetYearOverview({ year }: Props) {
  const data = await getYearlyBudgetOverview(year)

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600 dark:text-gray-400">
        No budgets set for {year}. Set monthly budgets above!
      </div>
    )
  }

  return <BudgetYearOverviewClient data={data} year={year} />
}
