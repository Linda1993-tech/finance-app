import { createClient } from '@/lib/supabase/server'

export default async function DebugBudgetPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return <div>Not authenticated</div>
  
  // Get all categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .order('name')
  
  // Get all budgets
  const { data: budgets } = await supabase
    .from('budgets')
    .select('*, category:categories(id, name, parent_id)')
    .eq('user_id', user.id)
    .eq('year', 2026)
    .eq('month', 1)
  
  // Get leisure & entertainment transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*, categories(id, name, parent_id)')
    .eq('user_id', user.id)
    .eq('is_transfer', false)
    .eq('is_income', false)
    .gte('transaction_date', '2026-01-01')
    .lte('transaction_date', '2026-01-31')
  
  const leisureTransactions = transactions?.filter(
    t => t.categories?.name === 'Leisure & entertainment'
  )
  
  const leisureTotal = leisureTransactions?.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0
  
  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Budget Debug Info</h1>
      
      <div className="mb-8">
        <h2 className="text-xl mb-2">Categories:</h2>
        <div className="bg-gray-800 p-4 rounded">
          {categories?.map(cat => (
            <div key={cat.id} className="mb-2">
              {cat.parent_id ? '  ↳ ' : '🎬 '}
              {cat.name} (ID: {cat.id.slice(0, 8)}...)
              {cat.parent_id && ` parent: ${cat.parent_id.slice(0, 8)}...`}
            </div>
          ))}
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl mb-2">Budgets for Jan 2026:</h2>
        <div className="bg-gray-800 p-4 rounded">
          {budgets?.map(budget => (
            <div key={budget.id} className="mb-4 border-b border-gray-600 pb-2">
              <p>Category: <strong>{budget.category?.name}</strong></p>
              <p>Category ID: {budget.category_id?.slice(0, 8)}...</p>
              <p>Amount: €{budget.amount}</p>
              <p>Is subcategory: {budget.category?.parent_id ? 'YES' : 'NO'}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl mb-2">Leisure & Entertainment Transactions (Jan 2026):</h2>
        <div className="bg-gray-800 p-4 rounded">
          <p className="mb-2">Count: {leisureTransactions?.length}</p>
          <p className="mb-2 font-bold text-green-400">Total: €{leisureTotal.toFixed(2)}</p>
          <p className="text-sm text-gray-400 mb-4">(This should match what shows in the budget table)</p>
          {leisureTransactions?.slice(0, 10).map(tx => (
            <div key={tx.id} className="text-sm mb-1">
              {tx.transaction_date}: {tx.description} - €{Math.abs(tx.amount).toFixed(2)}
            </div>
          ))}
        </div>
      </div>
      
      <a href="/dashboard/budget" className="text-blue-400 underline">← Back to Budget</a>
    </div>
  )
}

