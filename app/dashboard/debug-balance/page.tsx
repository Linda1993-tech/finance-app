import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { calculateCurrentAccountBreakdown } from '@/lib/utils/current-account-utils'

export default async function DebugBalancePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: preferences } = await supabase
    .from('user_preferences')
    .select('dutch_account_starting_balance, dutch_account_starting_date, spanish_account_starting_balance, spanish_account_starting_date')
    .eq('user_id', user.id)
    .single()

  const { data: transactions } = await supabase
    .from('transactions')
    .select('id, amount, is_transfer, account_type, transaction_date, description')
    .eq('user_id', user.id)

  const breakdown = calculateCurrentAccountBreakdown(transactions || [], {
    dutchStartingBalance: preferences?.dutch_account_starting_balance || 0,
    dutchStartingDate: preferences?.dutch_account_starting_date || null,
    spanishStartingBalance: preferences?.spanish_account_starting_balance || 0,
    spanishStartingDate: preferences?.spanish_account_starting_date || null,
  })

  const transfers = transactions?.filter((t) => t.is_transfer) || []
  const unmarkedLarge = (transactions || []).filter(
    (t) =>
      !t.is_transfer &&
      Math.abs(t.amount) >= 100 &&
      (t.description?.toLowerCase().includes('spaar') ||
        t.description?.toLowerCase().includes('savings') ||
        t.description?.toLowerCase().includes('degiro') ||
        t.description?.toLowerCase().includes('overboeking'))
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🔍 Balance Debug
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Startsaldo + alle transacties na startdatum = banksaldo betaalrekening
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 rounded-xl shadow p-6">
            <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-200 mb-2">
              💰 Current Account Total
            </h2>
            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              € {breakdown.currentAccount.toFixed(2)}
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-300 mt-2">
              🇳🇱 € {breakdown.dutchAccountBalance.toFixed(2)} + 🇪🇸 €{' '}
              {breakdown.spanishAccountBalance.toFixed(2)}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <AccountCard
              flag="🇳🇱"
              title="Dutch Account (ING NL)"
              startingBalance={breakdown.dutchStartingBalance}
              startingDate={preferences?.dutch_account_starting_date}
              transactionsTotal={breakdown.dutchTransactionsTotal}
              transferTotal={breakdown.dutchTransferTotal}
              accountBalance={breakdown.dutchAccountBalance}
            />
            <AccountCard
              flag="🇪🇸"
              title="Spanish Account (ING ES)"
              startingBalance={breakdown.spanishStartingBalance}
              startingDate={preferences?.spanish_account_starting_date}
              transactionsTotal={breakdown.spanishTransactionsTotal}
              transferTotal={breakdown.spanishTransferTotal}
              accountBalance={breakdown.spanishAccountBalance}
            />
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl shadow p-6">
            <h2 className="text-xl font-bold text-yellow-900 dark:text-yellow-200 mb-4">
              🔄 Transfer impact
            </h2>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex justify-between">
                <span>Marked transfers ({transfers.length}):</span>
                <span>
                  €{' '}
                  {(
                    breakdown.dutchTransferTotal + breakdown.spanishTransferTotal
                  ).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Balance if transfers excluded:</span>
                <span>€ {breakdown.balanceIfTransfersExcluded.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Transfer impact on balance:</span>
                <span>€ {breakdown.transferImpact.toFixed(2)}</span>
              </div>
            </div>
            <p className="text-xs text-yellow-800 dark:text-yellow-300 mt-4">
              Transfers naar spaar/pensioen/beleggen horen wél in het banksaldo (geld
              verlaat je betaalrekening). Ze staan ook apart in Savings/Pension/Stocks.
            </p>
          </div>

          {breakdown.excludedOtherCount > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl shadow p-6">
              <h2 className="text-xl font-bold text-red-900 dark:text-red-200 mb-2">
                ⚠️ Transacties zonder NL/ES account ({breakdown.excludedOtherCount})
              </h2>
              <p className="text-sm text-red-800 dark:text-red-300">
                Totaal niet meegeteld: € {breakdown.excludedOtherTotal.toFixed(2)}. Check
                het accounttype van deze transacties.
              </p>
            </div>
          )}

          {unmarkedLarge.length > 0 && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl shadow p-6">
              <h2 className="text-xl font-bold text-orange-900 dark:text-orange-200 mb-2">
                ⚠️ Mogelijke transfers niet gemarkeerd ({unmarkedLarge.length})
              </h2>
              <p className="text-sm text-orange-800 dark:text-orange-300 mb-3">
                Deze lijken op overboekingen maar staan niet als transfer gemarkeerd:
              </p>
              <div className="space-y-1 text-sm font-mono">
                {unmarkedLarge.slice(0, 10).map((tx) => (
                  <div key={tx.id}>
                    {tx.transaction_date}: {tx.description} — € {tx.amount.toFixed(2)}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">📐 Formule:</h3>
            <pre className="text-sm font-mono text-gray-700 dark:text-gray-300 overflow-x-auto">
              {`Current Account =
  NL (${breakdown.dutchStartingBalance.toFixed(2)} + ${breakdown.dutchTransactionsTotal.toFixed(2)}) +
  ES (${breakdown.spanishStartingBalance.toFixed(2)} + ${breakdown.spanishTransactionsTotal.toFixed(2)})
= ${breakdown.dutchAccountBalance.toFixed(2)} + ${breakdown.spanishAccountBalance.toFixed(2)}
= €${breakdown.currentAccount.toFixed(2)}`}
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

function AccountCard({
  flag,
  title,
  startingBalance,
  startingDate,
  transactionsTotal,
  transferTotal,
  accountBalance,
}: {
  flag: string
  title: string
  startingBalance: number
  startingDate: string | null | undefined
  transactionsTotal: number
  transferTotal: number
  accountBalance: number
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        {flag} {title}
      </h2>
      <div className="space-y-2 font-mono text-sm">
        <div className="flex justify-between">
          <span>Starting Balance:</span>
          <span className="font-bold">€ {startingBalance.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Starting Date:</span>
          <span>{startingDate || 'Not set'}</span>
        </div>
        <div className="flex justify-between">
          <span>Transactions total:</span>
          <span className={transactionsTotal >= 0 ? 'text-green-600' : 'text-red-600'}>
            € {transactionsTotal.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Of which transfers:</span>
          <span>€ {transferTotal.toFixed(2)}</span>
        </div>
        <div className="border-t pt-2 flex justify-between font-bold text-lg">
          <span>Account Balance:</span>
          <span>€ {accountBalance.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
