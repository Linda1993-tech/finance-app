import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DebugBalancePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get preferences
  const { data: preferences } = await supabase
    .from('user_preferences')
    .select('dutch_account_starting_balance, dutch_account_starting_date, spanish_account_starting_balance, spanish_account_starting_date')
    .eq('user_id', user.id)
    .single()

  const dutchStartingBalance = preferences?.dutch_account_starting_balance || 0
  const dutchStartingDate = preferences?.dutch_account_starting_date
  const spanishStartingBalance = preferences?.spanish_account_starting_balance || 0
  const spanishStartingDate = preferences?.spanish_account_starting_date

  // Get transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount, is_transfer, account_type, transaction_date')
    .eq('user_id', user.id)

  // Dutch account calculation (EXACTLY as wealth-actions.ts does it)
  // INCLUDE ALL transactions (no filtering on is_transfer)
  const dutchTransactions = transactions?.filter((t) => 
    t.account_type === 'dutch' &&
    (!dutchStartingDate || t.transaction_date > dutchStartingDate)
  ) || []
  
  const dutchTransactionsTotal = dutchTransactions.reduce((sum, t) => sum + t.amount, 0)
  const dutchAccountBalance = dutchStartingBalance + dutchTransactionsTotal

  // Spanish account calculation (EXACTLY as wealth-actions.ts does it)
  // INCLUDE ALL transactions (no filtering on is_transfer)
  const spanishTransactions = transactions?.filter((t) => 
    t.account_type === 'spanish' &&
    (!spanishStartingDate || t.transaction_date > spanishStartingDate)
  ) || []
  
  const spanishTransactionsTotal = spanishTransactions.reduce((sum, t) => sum + t.amount, 0)
  const spanishAccountBalance = spanishStartingBalance + spanishTransactionsTotal

  const currentAccount = dutchAccountBalance + spanishAccountBalance

  // Count how many transactions are marked as transfers (for info only)
  const transfers = transactions?.filter((t) => t.is_transfer) || []
  const transfersTotal = transfers.reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🔍 Balance Debug
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Exact calculation as shown in the app
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Current Account Total */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 rounded-xl shadow p-6">
            <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-200 mb-2">
              💰 Current Account Total
            </h2>
            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              € {currentAccount.toFixed(2)}
            </p>
          </div>

          {/* Dutch Account */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              🇳🇱 Dutch Account (ING NL)
            </h2>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex justify-between">
                <span>Starting Balance:</span>
                <span className="font-bold">€ {dutchStartingBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Starting Date:</span>
                <span>{dutchStartingDate || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span>Transactions (after start date):</span>
                <span>{dutchTransactions.length} transactions</span>
              </div>
              <div className="flex justify-between">
                <span>Transactions Total:</span>
                <span className={dutchTransactionsTotal >= 0 ? 'text-green-600' : 'text-red-600'}>
                  € {dutchTransactionsTotal.toFixed(2)}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Account Balance:</span>
                <span>€ {dutchAccountBalance.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Spanish Account */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              🇪🇸 Spanish Account (ING ES)
            </h2>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex justify-between">
                <span>Starting Balance:</span>
                <span className="font-bold">€ {spanishStartingBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Starting Date:</span>
                <span>{spanishStartingDate || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span>Transactions (after start date):</span>
                <span>{spanishTransactions.length} transactions</span>
              </div>
              <div className="flex justify-between">
                <span>Transactions Total:</span>
                <span className={spanishTransactionsTotal >= 0 ? 'text-green-600' : 'text-red-600'}>
                  € {spanishTransactionsTotal.toFixed(2)}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Account Balance:</span>
                <span>€ {spanishAccountBalance.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Transfers Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl shadow p-6">
            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-200 mb-4">
              🔄 Transfers (included in balance)
            </h2>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex justify-between">
                <span>Number of transfers:</span>
                <span className="font-bold">{transfers.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total amount:</span>
                <span className="font-bold">€ {transfersTotal.toFixed(2)}</span>
              </div>
              <p className="text-xs text-blue-800 dark:text-blue-300 mt-4">
                ℹ️ ALL transactions are included in the Current Account balance (including transfers)
              </p>
            </div>
          </div>

          {/* Formula */}
          <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">📐 Formula:</h3>
            <pre className="text-sm font-mono text-gray-700 dark:text-gray-300 overflow-x-auto">
{`Current Account = 
  Dutch (${dutchStartingBalance.toFixed(2)} + ${dutchTransactionsTotal.toFixed(2)}) + 
  Spanish (${spanishStartingBalance.toFixed(2)} + ${spanishTransactionsTotal.toFixed(2)})
= ${dutchAccountBalance.toFixed(2)} + ${spanishAccountBalance.toFixed(2)}
= €${currentAccount.toFixed(2)}`}
            </pre>
          </div>

          <div className="text-center">
            <a
              href="/dashboard"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
