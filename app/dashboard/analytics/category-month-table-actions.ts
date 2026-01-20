'use server'

import { createClient } from '@/lib/supabase/server'

export type CategoryMonthData = {
  categoryId: string
  categoryName: string
  categoryIcon: string | null
  categoryColor: string | null
  parentCategoryName: string | null
  monthlyAmounts: Record<string, number> // key: YYYY-MM, value: amount
  total: number
}

export type MonthlyTotal = {
  month: string
  total: number
}

/**
 * Get expense breakdown by category per month
 */
export async function getCategoryMonthBreakdown(months: number = 12) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Get start date
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months + 1)
  startDate.setDate(1) // First day of the month
  const startDateStr = startDate.toISOString().split('T')[0]

  // Get all expense transactions with categories
  const { data: transactions } = await supabase
    .from('transactions')
    .select(`
      transaction_date,
      amount,
      category_id,
      categories (
        id,
        name,
        icon,
        color,
        parent_id,
        parent:parent_id (
          name
        )
      )
    `)
    .eq('user_id', user.id)
    .eq('is_transfer', false)
    .eq('is_income', false) // Exclude income, but include all expenses + reimbursements
    .gte('transaction_date', startDateStr)
    .order('transaction_date')

  if (!transactions || transactions.length === 0) {
    return { categoryData: [], monthlyTotals: [], months: [] }
  }

  // Get unique months in data
  const monthsSet = new Set<string>()
  transactions.forEach((t) => {
    const month = t.transaction_date.substring(0, 7) // YYYY-MM
    monthsSet.add(month)
  })
  const sortedMonths = Array.from(monthsSet).sort()

  // Group by category
  const categoryMap = new Map<
    string,
    {
      name: string
      icon: string | null
      color: string | null
      parentName: string | null
      monthlyAmounts: Map<string, number>
    }
  >()

  for (const t of transactions) {
    const category = t.categories
    const categoryId = category?.id || 'uncategorized'
    const categoryName = category?.name || 'Uncategorized'
    const parentName = category?.parent?.name || null
    const month = t.transaction_date.substring(0, 7)

    if (!categoryMap.has(categoryId)) {
      categoryMap.set(categoryId, {
        name: categoryName,
        icon: category?.icon || null,
        color: category?.color || null,
        parentName: parentName,
        monthlyAmounts: new Map(),
      })
    }

    const catData = categoryMap.get(categoryId)!
    const currentAmount = catData.monthlyAmounts.get(month) || 0
    // Use actual amount to allow reimbursements to offset expenses
    catData.monthlyAmounts.set(month, currentAmount + t.amount)
  }

  // Convert to array format
  const categoryData: CategoryMonthData[] = Array.from(categoryMap.entries())
    .map(([categoryId, data]) => {
      const monthlyAmounts: Record<string, number> = {}
      let total = 0

      sortedMonths.forEach((month) => {
        const amount = data.monthlyAmounts.get(month) || 0
        // Display absolute value (net spending after reimbursements)
        monthlyAmounts[month] = Math.round(Math.abs(amount) * 100) / 100
        total += Math.abs(amount)
      })

      return {
        categoryId,
        categoryName: data.name,
        categoryIcon: data.icon,
        categoryColor: data.color,
        parentCategoryName: data.parentName,
        monthlyAmounts,
        total: Math.round(total * 100) / 100,
      }
    })
    .sort((a, b) => b.total - a.total) // Sort by total (highest first)

  // Calculate monthly totals
  const monthlyTotals: MonthlyTotal[] = sortedMonths.map((month) => {
    let total = 0
    categoryData.forEach((cat) => {
      total += cat.monthlyAmounts[month] || 0
    })
    return {
      month,
      total: Math.round(total * 100) / 100,
    }
  })

  return {
    categoryData,
    monthlyTotals,
    months: sortedMonths,
  }
}

