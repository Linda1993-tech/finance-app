'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Budget } from '@/lib/types/database'

export type BudgetWithCategory = Budget & {
  category: {
    id: string
    name: string
    icon: string | null
    color: string | null
    parent_id: string | null
  } | null
}

export type BudgetStatus = {
  budget: BudgetWithCategory
  spent: number
  remaining: number
  percentage: number
}

/**
 * Get budgets for a specific month/year
 */
export async function getBudgets(month: number, year: number): Promise<BudgetWithCategory[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('budgets')
    .select('*, category:categories(id, name, icon, color, parent_id)')
    .eq('user_id', user.id)
    .eq('month', month)
    .eq('year', year)

  if (error) {
    console.error('Error fetching budgets:', error)
    throw new Error('Failed to fetch budgets')
  }

  return data as BudgetWithCategory[]
}

/**
 * Get budget status (budget vs actual spending) for a month or year
 */
export async function getBudgetStatus(month: number, year: number, viewMode: 'monthly' | 'yearly' = 'monthly'): Promise<BudgetStatus[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Get budgets for this month
  const budgets = await getBudgets(month, year)

  // Calculate date range based on view mode
  let startDate: string
  let endDate: string
  let budgetMultiplier = 1

  if (viewMode === 'yearly') {
    // For yearly view: Jan 1 to Dec 31 of the year
    startDate = `${year}-01-01`
    endDate = `${year}-12-31`
    budgetMultiplier = 12 // Multiply monthly budget by 12
  } else {
    // For monthly view: first to last day of the month
    startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  }

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('amount, category_id, categories(id, parent_id)')
    .eq('user_id', user.id)
    .eq('is_transfer', false)
    .eq('is_income', false)
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)

  if (error) {
    console.error('Error fetching transactions:', error)
    throw new Error('Failed to fetch transactions')
  }

  type TransactionWithCategory = {
    amount: number
    category_id: string | null
    categories: {
      id: string
      parent_id: string | null
    } | null
  }

  const typedTransactions = (transactions || []) as unknown as TransactionWithCategory[]

  // Calculate spending per category (including parent categories)
  const spendingByCategory = new Map<string, number>()
  let totalSpending = 0

  for (const t of typedTransactions) {
    const netAmount = t.amount // Can be negative (expense) or positive (reimbursement)
    
    // Add to specific category
    if (t.category_id) {
      const current = spendingByCategory.get(t.category_id) || 0
      spendingByCategory.set(t.category_id, current + netAmount)
      
      // Also add to parent category if this is a subcategory
      const category = t.categories
      if (category?.parent_id) {
        const parentCurrent = spendingByCategory.get(category.parent_id) || 0
        spendingByCategory.set(category.parent_id, parentCurrent + netAmount)
      }
    } else {
      const current = spendingByCategory.get('uncategorized') || 0
      spendingByCategory.set('uncategorized', current + netAmount)
    }
    
    totalSpending += netAmount
  }

  // Build budget status for each budget
  const statuses: BudgetStatus[] = budgets.map((budget) => {
    const categoryKey = budget.category_id || 'uncategorized'
    const spent = Math.abs(spendingByCategory.get(categoryKey) || 0)
    const targetAmount = budget.amount * budgetMultiplier // Apply multiplier for yearly view
    const remaining = targetAmount - spent
    const percentage = targetAmount > 0 ? (spent / targetAmount) * 100 : 0

    return {
      budget: {
        ...budget,
        amount: targetAmount, // Return adjusted amount for display
      },
      spent,
      remaining,
      percentage,
    }
  })

  return statuses
}

/**
 * Create or update a budget
 */
export async function upsertBudget(
  categoryId: string | null,
  amount: number,
  month: number,
  year: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  if (amount <= 0) {
    return { success: false, error: 'Budget amount must be greater than 0' }
  }

  const { error } = await supabase.from('budgets').upsert(
    {
      user_id: user.id,
      category_id: categoryId,
      amount,
      month,
      year,
    },
    {
      onConflict: 'user_id,category_id,month,year',
    }
  )

  if (error) {
    console.error('Error upserting budget:', error)
    return { success: false, error: 'Failed to save budget' }
  }

  revalidatePath('/dashboard/budget')
  revalidatePath('/dashboard/analytics')
  return { success: true }
}

/**
 * Delete a budget
 */
export async function deleteBudget(budgetId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', budgetId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting budget:', error)
    return { success: false, error: 'Failed to delete budget' }
  }

  revalidatePath('/dashboard/budget')
  revalidatePath('/dashboard/analytics')
  return { success: true }
}

