'use server'

import { createClient } from '@/lib/supabase/server'

export type MonthlyBudgetData = {
  category: {
    id: string
    name: string
    icon: string | null
    parent_id: string | null
  } | null
  budgetByMonth: { [month: number]: number } // Budget amount
  spentByMonth: { [month: number]: number } // Actual spending
  totalBudget: number
  totalSpent: number
}

/**
 * Get budget vs actual spending breakdown by month for the entire year
 */
export async function getYearlyBudgetOverview(year: number): Promise<MonthlyBudgetData[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Get all budgets for this year (all 12 months)
  const { data: budgets, error: budgetError } = await supabase
    .from('budgets')
    .select('*, category:categories(id, name, icon, color, parent_id)')
    .eq('user_id', user.id)
    .eq('year', year)

  if (budgetError) {
    console.error('Error fetching budgets:', budgetError)
    throw new Error('Failed to fetch budgets')
  }

  // Get all spending for this year
  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31`

  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select('amount, category_id, transaction_date, categories(id, parent_id)')
    .eq('user_id', user.id)
    .eq('is_transfer', false)
    .eq('is_income', false)
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)

  if (txError) {
    console.error('Error fetching transactions:', txError)
    throw new Error('Failed to fetch transactions')
  }

  // Build spending by category by month
  // NOTE: Do NOT roll up to parents - show exact spending per category
  const spendingMap = new Map<string, { [month: number]: number }>()

  for (const tx of transactions || []) {
    const txDate = new Date(tx.transaction_date)
    const month = txDate.getMonth() + 1 // 1-12
    const categoryId = tx.category_id || 'uncategorized'
    // Use actual amount: negative for expenses, positive for reimbursements
    // This allows reimbursements to offset expenses
    const amount = tx.amount

    if (!spendingMap.has(categoryId)) {
      spendingMap.set(categoryId, {})
    }
    const categorySpending = spendingMap.get(categoryId)!
    categorySpending[month] = (categorySpending[month] || 0) + amount

    // DON'T roll up to parent for budget table - we want exact amounts per category
  }

  // Build budget data by category
  const categoryMap = new Map<string, MonthlyBudgetData>()

  // First pass: collect budgets and determine if we should fill all 12 months
  const categoryBudgetAmounts = new Map<string, number>() // Track the budget amount per category

  for (const budget of budgets || []) {
    const categoryKey = budget.category_id || 'uncategorized'
    
    // IMPORTANT: Only use spending for THIS specific category, not parent rollup
    // Get spending ONLY for this exact category ID
    const categorySpecificSpending = spendingMap.get(categoryKey) || {}
    
    if (!categoryMap.has(categoryKey)) {
      categoryMap.set(categoryKey, {
        category: budget.category,
        budgetByMonth: {},
        spentByMonth: categorySpecificSpending,
        totalBudget: 0,
        totalSpent: 0,
      })
    }

    const data = categoryMap.get(categoryKey)!
    data.budgetByMonth[budget.month] = budget.amount
    
    // Store the budget amount (assume same amount for all months)
    if (!categoryBudgetAmounts.has(categoryKey)) {
      categoryBudgetAmounts.set(categoryKey, budget.amount)
    }
  }

  // Second pass: Fill in all 12 months with the budget amount
  for (const [categoryKey, data] of categoryMap.entries()) {
    const budgetAmount = categoryBudgetAmounts.get(categoryKey) || 0
    
    // Fill all 12 months with this budget
    for (let month = 1; month <= 12; month++) {
      if (!data.budgetByMonth[month]) {
        data.budgetByMonth[month] = budgetAmount
      }
    }
    
    // Calculate total budget by summing all actual month values (not just amount * 12)
    // This ensures edited months are included in the total
    data.totalBudget = Object.values(data.budgetByMonth).reduce((sum, amount) => sum + amount, 0)
  }

  // Calculate total spent for each category (all 12 months)
  for (const [categoryId, data] of categoryMap.entries()) {
    const spending = spendingMap.get(categoryId) || {}
    // Sum can be negative (expenses) or include positive (reimbursements)
    // Take absolute value for display (net spending)
    const netSpending = Object.values(spending).reduce((sum, amount) => sum + amount, 0)
    data.totalSpent = Math.abs(netSpending)
  }

  // Convert to array and sort by total budget (descending)
  const result = Array.from(categoryMap.values()).sort((a, b) => b.totalBudget - a.totalBudget)

  return result
}

