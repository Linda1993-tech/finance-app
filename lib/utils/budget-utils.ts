/**
 * Budget spending helpers.
 * Expenses are stored as negative amounts, offsets/reimbursements as positive.
 */

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
