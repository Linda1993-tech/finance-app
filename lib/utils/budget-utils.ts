/**
 * Budget spending helpers.
 * Expenses are stored as negative amounts, offsets/reimbursements as positive.
 */

type CategoryJoin = {
  id?: string
  parent_id?: string | null
} | null | undefined

type BudgetTransaction = {
  amount: number
  category_id: string | null
  is_transfer: boolean
  is_income: boolean
  transaction_date?: string
  categories?: CategoryJoin | CategoryJoin[]
}

/**
 * Net spending after offsets: expenses minus reimbursements, floored at zero.
 */
export function calculateNetSpent(signedSum: number): number {
  return Math.max(0, -signedSum)
}

/**
 * Sum signed transaction amounts (negative = expense, positive = offset).
 */
export function sumSignedAmounts(amounts: number[]): number {
  return amounts.reduce((sum, amount) => sum + amount, 0)
}

/**
 * Month number (1-12) from YYYY-MM-DD without timezone shifts.
 */
export function getMonthFromDateString(dateStr: string): number {
  return parseInt(dateStr.slice(5, 7), 10)
}

/**
 * Supabase may return a joined category as object or single-element array.
 */
export function getCategoryParentId(categories: CategoryJoin | CategoryJoin[]): string | null {
  const category = Array.isArray(categories) ? categories[0] : categories
  return category?.parent_id ?? null
}

/**
 * Whether a transaction should affect budget spending.
 * Includes positive categorized amounts (e.g. Bizum refunds) even if marked as income.
 */
export function countsTowardBudget(tx: BudgetTransaction): boolean {
  if (tx.is_transfer) return false
  if (!tx.is_income) return true
  return tx.amount > 0 && tx.category_id !== null
}

/**
 * Roll up signed amounts per category (and parent categories).
 */
export function addToSpendingMap(
  spendingMap: Map<string, number>,
  categoryId: string,
  amount: number,
  parentId: string | null
): void {
  spendingMap.set(categoryId, (spendingMap.get(categoryId) || 0) + amount)
  if (parentId) {
    spendingMap.set(parentId, (spendingMap.get(parentId) || 0) + amount)
  }
}

/**
 * Roll up signed amounts per category and month (and parent categories).
 */
export function addToMonthlySpendingMap(
  spendingMap: Map<string, { [month: number]: number }>,
  categoryId: string,
  month: number,
  amount: number,
  parentId: string | null
): void {
  const addToCategory = (id: string) => {
    if (!spendingMap.has(id)) {
      spendingMap.set(id, {})
    }
    const categorySpending = spendingMap.get(id)!
    categorySpending[month] = (categorySpending[month] || 0) + amount
  }

  addToCategory(categoryId)
  if (parentId) {
    addToCategory(parentId)
  }
}

export function buildSpendingByCategory(
  transactions: BudgetTransaction[]
): Map<string, number> {
  const spendingByCategory = new Map<string, number>()

  for (const tx of transactions) {
    if (!countsTowardBudget(tx)) continue

    const categoryId = tx.category_id || 'uncategorized'
    const parentId = getCategoryParentId(tx.categories ?? null)
    addToSpendingMap(spendingByCategory, categoryId, tx.amount, parentId)
  }

  return spendingByCategory
}

export function buildMonthlySpendingByCategory(
  transactions: BudgetTransaction[]
): Map<string, { [month: number]: number }> {
  const spendingMap = new Map<string, { [month: number]: number }>()

  for (const tx of transactions) {
    if (!countsTowardBudget(tx) || !tx.transaction_date) continue

    const month = getMonthFromDateString(tx.transaction_date)
    const categoryId = tx.category_id || 'uncategorized'
    const parentId = getCategoryParentId(tx.categories ?? null)
    addToMonthlySpendingMap(spendingMap, categoryId, month, tx.amount, parentId)
  }

  return spendingMap
}

/**
 * Avoid double-counting when both a parent and its subcategories have budgets.
 * Only include overall budgets, parent budgets, and subcategories whose parent has no budget.
 */
export function getTopLevelBudgetStatuses<T extends {
  budget: { category: { id: string; parent_id: string | null } | null }
  spent: number
}>(statuses: T[]): T[] {
  const parentIdsWithBudgets = new Set(
    statuses
      .filter((s) => s.budget.category && !s.budget.category.parent_id)
      .map((s) => s.budget.category!.id)
  )

  return statuses.filter((s) => {
    if (!s.budget.category) return true
    if (!s.budget.category.parent_id) return true
    return !parentIdsWithBudgets.has(s.budget.category.parent_id)
  })
}
