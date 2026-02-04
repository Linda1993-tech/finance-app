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

  // Calculate date range based on view mode
  let startDate: string
  let endDate: string
  let budgets: any[]

  if (viewMode === 'yearly') {
    // For yearly view: Jan 1 to Dec 31 of the year
    startDate = `${year}-01-01`
    endDate = `${year}-12-31`
    
    // Get ALL budgets for the entire year (all 12 months)
    const { data: yearlyBudgets, error: budgetError } = await supabase
      .from('budgets')
      .select('*, category:categories(id, name, icon, color, parent_id)')
      .eq('user_id', user.id)
      .eq('year', year)
    
    if (budgetError) {
      console.error('Error fetching yearly budgets:', budgetError)
      throw new Error('Failed to fetch budgets')
    }
    
    budgets = yearlyBudgets || []
  } else {
    // For monthly view: first to last day of the month
    startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    
    // Get budgets for this specific month
    budgets = await getBudgets(month, year)
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
  let statuses: BudgetStatus[]
  
  if (viewMode === 'yearly') {
    // For yearly view: group by category and calculate yearly budget (monthly budget × 12)
    const categoryBudgets = new Map<string, { 
      monthlyBudget: number, // Representative monthly budget
      category: any,
      budgetIds: string[],
      monthsCount: number
    }>()
    
    for (const budget of budgets) {
      const categoryKey = budget.category_id || 'uncategorized'
      const existing = categoryBudgets.get(categoryKey)
      
      if (existing) {
        // Take the most recent/highest budget as representative
        existing.monthlyBudget = Math.max(existing.monthlyBudget, budget.amount)
        existing.budgetIds.push(budget.id)
        existing.monthsCount++
      } else {
        categoryBudgets.set(categoryKey, {
          monthlyBudget: budget.amount,
          category: budget.category,
          budgetIds: [budget.id],
          monthsCount: 1
        })
      }
    }
    
    // Now build statuses from the grouped data
    statuses = Array.from(categoryBudgets.entries()).map(([categoryKey, data]) => {
      const spent = Math.abs(spendingByCategory.get(categoryKey) || 0)
      const yearlyBudget = data.monthlyBudget * 12 // Multiply monthly budget by 12
      const remaining = yearlyBudget - spent
      const percentage = yearlyBudget > 0 ? (spent / yearlyBudget) * 100 : 0
      
      return {
        budget: {
          id: data.budgetIds[0], // Use first budget ID
          user_id: user.id,
          category_id: categoryKey === 'uncategorized' ? null : categoryKey,
          amount: yearlyBudget, // Show yearly total
          month,
          year,
          created_at: '',
          updated_at: '',
          category: data.category,
        },
        spent,
        remaining,
        percentage,
      }
    })
  } else {
    // For monthly view: use budgets as-is
    statuses = budgets.map((budget) => {
      const categoryKey = budget.category_id || 'uncategorized'
      const spent = Math.abs(spendingByCategory.get(categoryKey) || 0)
      const targetAmount = budget.amount
      const remaining = targetAmount - spent
      const percentage = targetAmount > 0 ? (spent / targetAmount) * 100 : 0

      return {
        budget,
        spent,
        remaining,
        percentage,
      }
    })
  }

  return statuses
}

/**
 * Get budget status for ALL categories that have budgets set anywhere in the year
 * Shows current month budget and spending for each category
 */
export async function getAllCategoriesBudgetStatus(month: number, year: number): Promise<BudgetStatus[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Get ALL budgets for this year to find unique categories
  const { data: allYearBudgets, error: budgetError } = await supabase
    .from('budgets')
    .select('category_id, category:categories(id, name, icon, color, parent_id)')
    .eq('user_id', user.id)
    .eq('year', year)

  if (budgetError) {
    console.error('Error fetching yearly budgets:', budgetError)
    throw new Error('Failed to fetch budgets')
  }

  // Get unique categories
  const uniqueCategories = new Map<string, any>()
  for (const budget of allYearBudgets || []) {
    const categoryKey = budget.category_id || 'uncategorized'
    if (!uniqueCategories.has(categoryKey)) {
      uniqueCategories.set(categoryKey, budget.category)
    }
  }

  // Get ALL budgets for the year (to find budget for each category)
  const { data: allBudgets, error: allBudgetsError } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', user.id)
    .eq('year', year)

  if (allBudgetsError) {
    console.error('Error fetching all budgets:', allBudgetsError)
    throw new Error('Failed to fetch budgets')
  }

  // Build budget map: prefer current month, otherwise use any month's budget
  const monthBudgetMap = new Map<string, number>()
  const fallbackBudgetMap = new Map<string, number>()
  
  for (const budget of allBudgets || []) {
    const categoryKey = budget.category_id || 'uncategorized'
    
    if (budget.month === month) {
      // Current month budget - use this!
      monthBudgetMap.set(categoryKey, budget.amount)
    } else if (!fallbackBudgetMap.has(categoryKey)) {
      // Fallback: use budget from another month if current month not found
      fallbackBudgetMap.set(categoryKey, budget.amount)
    }
  }
  
  // Merge fallback budgets into main map
  for (const [categoryKey, amount] of fallbackBudgetMap.entries()) {
    if (!monthBudgetMap.has(categoryKey)) {
      monthBudgetMap.set(categoryKey, amount)
    }
  }

  // Calculate spending for the specific month
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select('amount, category_id, categories(id, parent_id)')
    .eq('user_id', user.id)
    .eq('is_transfer', false)
    .eq('is_income', false)
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)

  if (txError) {
    console.error('Error fetching transactions:', txError)
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
  }

  // Build budget status for each unique category
  const statuses: BudgetStatus[] = []

  for (const [categoryKey, categoryData] of uniqueCategories.entries()) {
    const budgetAmount = monthBudgetMap.get(categoryKey) || 0
    const spent = Math.abs(spendingByCategory.get(categoryKey) || 0)
    const remaining = budgetAmount - spent
    const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0

    statuses.push({
      budget: {
        id: `${categoryKey}-${month}`, // Temporary ID
        user_id: user.id,
        category_id: categoryKey === 'uncategorized' ? null : categoryKey,
        amount: budgetAmount,
        month,
        year,
        created_at: '',
        updated_at: '',
        category: categoryData,
      },
      spent,
      remaining,
      percentage,
    })
  }

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
 * Update budget for a specific month (inline editing)
 */
export async function updateBudgetForMonth(input: {
  category_id: string
  month: number
  budget: number
}): Promise<{ success: boolean; error?: string }> {
  const year = new Date().getFullYear()
  return upsertBudget(input.category_id, input.budget, input.month, year)
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

