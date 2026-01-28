'use client'

import type { SavingsAccount } from '@/lib/types/database'
import type { SavingsStats } from './actions'

type Props = {
  account: SavingsAccount
  stats: SavingsStats | undefined
  onAddEntry: () => void
}

export function AccountCard({ account, stats, onAddEntry }: Props) {
  if (!stats) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  const accountTypeLabels = {
    dutch: '🇳🇱 Dutch',
    spanish: '🇪🇸 Spanish',
    other: '🌍 Other',
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{account.icon}</span>
            <div>
              <h3 className="text-xl font-bold">{account.name}</h3>
              <p className="text-sm opacity-90">{accountTypeLabels[account.account_type]}</p>
            </div>
          </div>
        </div>
        
        {/* Current Balance */}
        <div className="mt-4">
          <div className="text-sm opacity-90">Current Balance</div>
          <div className="text-4xl font-bold mt-1">
            €{stats.currentBalance.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 p-6">
        <div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Deposits</div>
          <div className="text-lg font-semibold text-green-600 dark:text-green-400">
            €{stats.totalDeposits.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Withdrawals</div>
          <div className="text-lg font-semibold text-red-600 dark:text-red-400">
            €{stats.totalWithdrawals.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Interest</div>
          <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
            €{stats.totalInterest.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Interest Rate */}
      {stats.interestRate > 0 && (
        <div className="px-6 pb-4">
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 flex items-center justify-between">
            <div>
              <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                Annualized Interest Rate
              </div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                {stats.interestRate.toFixed(2)}%
              </div>
            </div>
            <span className="text-3xl">📈</span>
          </div>
        </div>
      )}

      {/* Recent Entries */}
      {stats.entries.length > 0 && (
        <div className="px-6 pb-4">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Recent Activity
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {stats.entries.slice(-5).reverse().map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between text-sm py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {entry.entry_type === 'balance' ? '📸' : entry.entry_type === 'deposit' ? '💵' : '💸'}
                  </span>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {entry.entry_type === 'balance' ? 'Balance Snapshot' : entry.entry_type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(entry.entry_date).toLocaleDateString('en-GB')}
                    </div>
                  </div>
                </div>
                <div className={`font-semibold ${
                  entry.entry_type === 'deposit' ? 'text-green-600 dark:text-green-400' :
                  entry.entry_type === 'withdrawal' ? 'text-red-600 dark:text-red-400' :
                  'text-blue-600 dark:text-blue-400'
                }`}>
                  €{entry.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-6 pb-6">
        <button
          onClick={onAddEntry}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <span className="text-lg">+</span>
          Add Entry
        </button>
      </div>
    </div>
  )
}
