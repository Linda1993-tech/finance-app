import { createClient } from '@/lib/supabase/server'
import { formatEuro } from '@/lib/utils/currency-format'
import {
  buildMonthlySpendingByCategory,
  calculateNetSpent,
  countsTowardBudget,
  getCategoryParentId,
} from '@/lib/utils/budget-utils'

const DEBUG_YEAR = 2026
const DEBUG_MONTH = 5
const LEISURE_NAME = 'Leisure & entertainment'

export default async function DebugBudgetPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return <div>Not authenticated</div>

  const startDate = `${DEBUG_YEAR}-${String(DEBUG_MONTH).padStart(2, '0')}-01`
  const lastDay = new Date(DEBUG_YEAR, DEBUG_MONTH, 0).getDate()
  const endDate = `${DEBUG_YEAR}-${String(DEBUG_MONTH).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  const leisureCategory = categories?.find((c) => c.name === LEISURE_NAME)
  const leisureSubcategoryIds =
    categories?.filter((c) => c.parent_id === leisureCategory?.id).map((c) => c.id) || []
  const leisureCategoryIds = leisureCategory
    ? [leisureCategory.id, ...leisureSubcategoryIds]
    : []

  const { data: budgets } = await supabase
    .from('budgets')
    .select('*, category:categories(id, name, parent_id)')
    .eq('user_id', user.id)
    .eq('year', DEBUG_YEAR)
    .eq('month', DEBUG_MONTH)

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*, categories(id, name, parent_id)')
    .eq('user_id', user.id)
    .eq('is_transfer', false)
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)
    .order('transaction_date')

  type Tx = NonNullable<typeof transactions>[number]

  const leisureTransactions =
    transactions?.filter((t) => t.category_id && leisureCategoryIds.includes(t.category_id)) || []

  const excludedIncomeOffsets = leisureTransactions.filter(
    (t) => t.is_income && t.amount > 0 && !countsTowardBudget(t)
  )

  const includedOffsets = leisureTransactions.filter(
    (t) => t.amount > 0 && countsTowardBudget(t)
  )

  const spendingMap = buildMonthlySpendingByCategory(
    (transactions || []).map((t) => ({
      amount: t.amount,
      category_id: t.category_id,
      is_transfer: t.is_transfer,
      is_income: t.is_income,
      transaction_date: t.transaction_date,
      categories: t.categories,
    }))
  )

  const leisureNetFromMap = leisureCategory
    ? calculateNetSpent(spendingMap.get(leisureCategory.id)?.[DEBUG_MONTH] || 0)
    : 0

  const leisureNetManual = calculateNetSpent(
    leisureTransactions.filter(countsTowardBudget).reduce((sum, t) => sum + t.amount, 0)
  )

  const bizumTransactions =
    transactions?.filter((t) => t.description.toUpperCase().includes('BIZUM')) || []

  function txRow(tx: Tx) {
    const parentName = getCategoryParentId(tx.categories)
      ? categories?.find((c) => c.id === getCategoryParentId(tx.categories))?.name
      : null

    return (
      <div key={tx.id} className="text-sm mb-2 border-b border-gray-700 pb-2">
        <div>
          {tx.transaction_date}: {tx.description} — {formatEuro(tx.amount)}
        </div>
        <div className="text-xs text-gray-400">
          category: {(tx.categories as { name?: string } | null)?.name || 'none'}
          {parentName ? ` (under ${parentName})` : ''}
          {tx.is_income ? ' · income' : ''}
          {tx.amount > 0 ? ' · offset' : ''}
          {countsTowardBudget(tx) ? ' · counts in budget' : ' · excluded from budget'}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Budget Debug — {LEISURE_NAME}</h1>
      <p className="text-gray-400 mb-6">
        {new Date(DEBUG_YEAR, DEBUG_MONTH - 1).toLocaleDateString('nl-NL', {
          month: 'long',
          year: 'numeric',
        })}
      </p>

      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <div className="bg-gray-800 p-4 rounded">
          <p className="text-sm text-gray-400">Net spent (budget logic)</p>
          <p className="text-2xl font-bold text-green-400">{formatEuro(leisureNetFromMap)}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded">
          <p className="text-sm text-gray-400">Offsets included</p>
          <p className="text-2xl font-bold text-yellow-300">
            {formatEuro(includedOffsets.reduce((sum, t) => sum + t.amount, 0))}
          </p>
          <p className="text-xs text-gray-500 mt-1">{includedOffsets.length} transactions</p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl mb-2">Budgets for this month:</h2>
        <div className="bg-gray-800 p-4 rounded">
          {budgets?.map((budget) => (
            <div key={budget.id} className="mb-4 border-b border-gray-600 pb-2">
              <p>
                Category: <strong>{budget.category?.name}</strong> — €{budget.amount}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl mb-2">Leisure transactions (direct + subcategories)</h2>
        <div className="bg-gray-800 p-4 rounded">
          <p className="mb-2">Count: {leisureTransactions.length}</p>
          <p className="mb-4 font-bold text-green-400">Manual net: {formatEuro(leisureNetManual)}</p>
          {leisureTransactions.map(txRow)}
        </div>
      </div>

      {excludedIncomeOffsets.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl mb-2 text-orange-300">Excluded income-marked offsets</h2>
          <div className="bg-gray-800 p-4 rounded">
            <p className="text-sm text-gray-400 mb-3">
              These positive leisure transactions were marked as income and previously excluded from budget.
            </p>
            {excludedIncomeOffsets.map(txRow)}
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl mb-2">All Bizum this month</h2>
        <div className="bg-gray-800 p-4 rounded">
          {bizumTransactions.length === 0 ? (
            <p className="text-gray-400">No Bizum transactions found</p>
          ) : (
            bizumTransactions.map(txRow)
          )}
        </div>
      </div>

      <a href="/dashboard/budget" className="text-blue-400 underline">
        ← Back to Budget
      </a>
    </div>
  )
}
