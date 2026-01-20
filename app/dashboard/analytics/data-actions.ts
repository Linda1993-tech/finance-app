'use server'

import { createClient } from '@/lib/supabase/server'

export type MonthlyData = {
  month: string // YYYY-MM
  income: number
  expenses: number
  net: number
}

export type CategorySpending = {
  category: string
  amount: number
  color: string | null
  icon: string | null
  count: number
}

/**
 * Get monthly income/expense data for the last N months
 */
export async function getMonthlyTrends(months: number = 6) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Get transactions from last N months
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)
  const startDateStr = startDate.toISOString().split('T')[0]

  const { data: transactions } = await supabase
    .from('transactions')
    .select('transaction_date, amount, is_transfer, is_income')
    .eq('user_id', user.id)
    .gte('transaction_date', startDateStr)
    .order('transaction_date')

  if (!transactions) return []

  // Group by month
  const monthlyMap = new Map<string, { income: number; expenses: number }>()

  for (const t of transactions) {
    if (t.is_transfer) continue // Exclude transfers

    const month = t.transaction_date.substring(0, 7) // YYYY-MM
    const existing = monthlyMap.get(month) || { income: 0, expenses: 0 }

    if (t.is_income) {
      // Only count if explicitly marked as income
      existing.income += t.amount
    } else {
      // All non-income: negative (expenses) + positive (reimbursements)
      // Reimbursements offset expenses
      existing.expenses += t.amount
    }

    monthlyMap.set(month, existing)
  }

  // Convert to array and sort
  const result: MonthlyData[] = Array.from(monthlyMap.entries())
    .map(([month, data]) => ({
      month,
      income: Math.round(data.income * 100) / 100,
      expenses: Math.round(Math.abs(data.expenses) * 100) / 100, // Display as positive (net spending)
      net: Math.round((data.income - data.expenses) * 100) / 100,
    }))
    .sort((a, b) => a.month.localeCompare(b.month))

  return result
}

/**
 * Get spending by category for a specific month (or all time if no month specified)
 */
export async function getCategorySpending(month?: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  let query = supabase
    .from('transactions')
    .select('amount, category_id, is_transfer, is_income, categories(name, color, icon)')
    .eq('user_id', user.id)
    .eq('is_transfer', false)
    .eq('is_income', false) // Exclude marked income, include all else (expenses + reimbursements)

  if (month) {
    // Filter by specific month (YYYY-MM format)
    const startDate = `${month}-01`
    const endDate = new Date(month + '-01')
    endDate.setMonth(endDate.getMonth() + 1)
    const endDateStr = endDate.toISOString().split('T')[0]

    query = query.gte('transaction_date', startDate).lt('transaction_date', endDateStr)
  }

  const { data: transactions } = await query

  if (!transactions) return []

  type TransactionWithCategory = {
    amount: number
    category_id: string | null
    is_transfer: boolean
    is_income: boolean
    categories: {
      name: string
      color: string | null
      icon: string | null
    } | null
  }

  const typedTransactions = transactions as unknown as TransactionWithCategory[]

  // Group by category
  const categoryMap = new Map<
    string,
    { amount: number; color: string | null; icon: string | null; count: number }
  >()

  for (const t of typedTransactions) {
    const categoryName = t.categories?.name || 'Uncategorized'
    const existing = categoryMap.get(categoryName) || {
      amount: 0,
      color: t.categories?.color || null,
      icon: t.categories?.icon || null,
      count: 0,
    }

    // Add the amount as-is (negative for expenses, positive for reimbursements)
    // This allows reimbursements to offset expenses in the same category
    existing.amount += t.amount // Note: NOT using Math.abs() anymore
    existing.count += 1

    categoryMap.set(categoryName, existing)
  }

  // Convert to array and sort by amount (absolute value for sorting, but keep sign)
  const result: CategorySpending[] = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      amount: Math.round(Math.abs(data.amount) * 100) / 100, // Show as positive, but it's net
      color: data.color,
      icon: data.icon,
      count: data.count,
    }))
    .filter((c) => c.amount > 0) // Remove categories with net zero or negative (fully reimbursed)
    .sort((a, b) => b.amount - a.amount)

  return result
}

/**
 * Get current month summary
 */
export async function getCurrentMonthSummary() {
  const now = new Date()
  const month = now.toISOString().substring(0, 7) // YYYY-MM

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const startDate = `${month}-01`
  const endDate = new Date(month + '-01')
  endDate.setMonth(endDate.getMonth() + 1)
  const endDateStr = endDate.toISOString().split('T')[0]

  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount, is_transfer, is_income')
    .eq('user_id', user.id)
    .eq('is_transfer', false)
    .gte('transaction_date', startDate)
    .lt('transaction_date', endDateStr)

  if (!transactions) {
    return { month, income: 0, expenses: 0, net: 0, transactionCount: 0 }
  }

  const income = transactions.filter((t) => t.is_income).reduce((sum, t) => sum + t.amount, 0)

  // Calculate net expenses (includes negative expenses and positive reimbursements)
  const expensesNet = transactions
    .filter((t) => !t.is_income) // All non-income (expenses + reimbursements)
    .reduce((sum, t) => sum + t.amount, 0)
  
  const expenses = Math.abs(expensesNet) // Display as positive

  return {
    month,
    income: Math.round(income * 100) / 100,
    expenses: Math.round(expenses * 100) / 100,
    net: Math.round((income - expenses) * 100) / 100,
    transactionCount: transactions.length,
  }
}

