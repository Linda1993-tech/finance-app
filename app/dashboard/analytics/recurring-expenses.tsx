import { createClient } from '@/lib/supabase/server'

type RecurringExpense = {
  learning_key: string
  description: string
  avgAmount: number
  count: number
  frequency: string
  categoryName: string | null
  categoryIcon: string | null
}

async function detectRecurring(): Promise<RecurringExpense[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  // Get all transactions from last 3 months
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const startDate = threeMonthsAgo.toISOString().split('T')[0]

  const { data: transactions } = await supabase
    .from('transactions')
    .select('learning_key, description, amount, transaction_date, categories(name, icon)')
    .eq('user_id', user.id)
    .eq('is_transfer', false)
    .lt('amount', 0) // Only expenses
    .gte('transaction_date', startDate)
    .order('transaction_date')

  if (!transactions || transactions.length === 0) return []

  // Group by learning key
  const grouped = new Map<
    string,
    { amounts: number[]; dates: string[]; description: string; category: any }
  >()

  for (const t of transactions) {
    if (!t.learning_key) continue

    const existing = grouped.get(t.learning_key) || {
      amounts: [] as number[],
      dates: [] as string[],
      description: t.description,
      category: t.categories,
    }

    existing.amounts.push(Math.abs(t.amount))
    existing.dates.push(t.transaction_date)

    grouped.set(t.learning_key, existing)
  }

  // Detect recurring patterns (at least 2 occurrences)
  const recurring: RecurringExpense[] = []

  for (const [key, data] of grouped.entries()) {
    if (data.amounts.length < 2) continue

    const avgAmount = data.amounts.reduce((a, b) => a + b, 0) / data.amounts.length

    // Calculate frequency
    let frequency = 'Multiple times'
    if (data.amounts.length >= 3) {
      // Calculate average days between transactions
      const dates = data.dates.sort()
      const intervals: number[] = []
      for (let i = 1; i < dates.length; i++) {
        const days =
          (new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / (1000 * 60 * 60 * 24)
        intervals.push(days)
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length

      if (avgInterval <= 1) frequency = 'Daily'
      else if (avgInterval <= 7) frequency = 'Weekly'
      else if (avgInterval <= 14) frequency = 'Bi-weekly'
      else if (avgInterval <= 31) frequency = 'Monthly'
      else frequency = `Every ${Math.round(avgInterval)} days`
    }

    recurring.push({
      learning_key: key,
      description: data.description,
      avgAmount: Math.round(avgAmount * 100) / 100,
      count: data.amounts.length,
      frequency,
      categoryName: data.category?.name || null,
      categoryIcon: data.category?.icon || null,
    })
  }

  // Sort by average amount (highest first)
  return recurring.sort((a, b) => b.avgAmount - a.avgAmount)
}

export async function RecurringExpenses() {
  const recurring = await detectRecurring()

  if (recurring.length === 0) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          🔄 Recurring Expenses Detected
        </h2>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Last 3 months • {recurring.length} subscriptions
        </span>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        These expenses appear regularly. Consider them when planning your budget.
      </p>

      <div className="space-y-3">
        {recurring.map((expense) => (
          <div
            key={expense.learning_key}
            className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/10 dark:to-red-900/10 border border-orange-200 dark:border-orange-800 rounded-lg"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {expense.categoryIcon && <span>{expense.categoryIcon}</span>}
                <div className="font-medium text-gray-900 dark:text-white">
                  {expense.description}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  📅 {expense.frequency}
                </span>
                <span className="flex items-center gap-1">
                  🔢 {expense.count}x in last 3 months
                </span>
                {expense.categoryName && (
                  <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                    {expense.categoryName}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-red-600 dark:text-red-400">
                €{expense.avgAmount.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">avg per charge</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="text-sm text-blue-800 dark:text-blue-200">
          <strong>💡 Tip:</strong> Total recurring expenses: €
          {recurring.reduce((sum, e) => sum + e.avgAmount, 0).toFixed(2)} per cycle. Make sure to
          budget for these!
        </div>
      </div>
    </div>
  )
}

