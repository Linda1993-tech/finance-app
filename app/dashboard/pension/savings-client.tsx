'use client'

import { useState, useEffect } from 'react'
import type { SavingsAccount } from '@/lib/types/database'
import { CreateAccountForm } from './create-account-form'
import { AccountCard } from './account-card'
import { AddEntryForm } from './add-entry-form'
import { ImportTransfers } from './import-transfers'
import { calculateSavingsStats, type SavingsStats, deletePensionAccount } from './actions'
import { formatEuro } from '@/lib/utils/currency-format'

type Props = {
  initialAccounts: SavingsAccount[]
}

export function SavingsClient({ initialAccounts }: Props) {
  const [accounts, setAccounts] = useState(initialAccounts)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showAddEntryForm, setShowAddEntryForm] = useState(false)
  const [showImportForm, setShowImportForm] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<SavingsAccount | null>(null)
  const [accountStats, setAccountStats] = useState<Record<string, SavingsStats>>({})
  const [loading, setLoading] = useState(true)

  // Load stats for all accounts
  useEffect(() => {
    async function loadStats() {
      setLoading(true)
      const stats: Record<string, SavingsStats> = {}
      
      for (const account of accounts) {
        try {
          stats[account.id] = await calculateSavingsStats(account.id)
        } catch (error) {
          console.error(`Error loading stats for account ${account.id}:`, error)
        }
      }
      
      setAccountStats(stats)
      setLoading(false)
    }

    if (accounts.length > 0) {
      loadStats()
    } else {
      setLoading(false)
    }
  }, [accounts])

  // Calculate totals across all accounts
  const totalBalance = Object.values(accountStats).reduce((sum, stats) => sum + stats.currentBalance, 0)
  const totalDeposits = Object.values(accountStats).reduce((sum, stats) => sum + stats.totalDeposits, 0)
  const totalInterest = Object.values(accountStats).reduce((sum, stats) => sum + stats.totalInterest, 0)

  function handleAddEntry(account: SavingsAccount) {
    setSelectedAccount(account)
    setShowAddEntryForm(true)
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      {accounts.length > 0 && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
            <div className="text-sm opacity-90 font-medium">Total Savings</div>
            <div className="text-3xl font-bold mt-2">{formatEuro(totalBalance)}</div>
            <div className="text-xs opacity-75 mt-1">Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}</div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
            <div className="text-sm opacity-90 font-medium">Total Deposits</div>
            <div className="text-3xl font-bold mt-2">{formatEuro(totalDeposits)}</div>
            <div className="text-xs opacity-75 mt-1">Money saved</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg p-6 text-white">
            <div className="text-sm opacity-90 font-medium">Total Interest Earned</div>
            <div className="text-3xl font-bold mt-2">{formatEuro(totalInterest)}</div>
            <div className="text-xs opacity-75 mt-1">Free money! 🎉</div>
          </div>
        </div>
      )}

      {/* Create Account Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Your Savings Accounts
        </h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowImportForm(true)}
            disabled={accounts.length === 0}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <span className="text-lg">📥</span>
            Import Transfers
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <span className="text-lg">+</span>
            Add Account
          </button>
        </div>
      </div>

      {/* Create Account Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Create Savings Account
                </h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              <CreateAccountForm onSuccess={() => {
                setShowCreateForm(false)
                window.location.reload()
              }} />
            </div>
          </div>
        </div>
      )}

      {/* Add Entry Modal */}
      {showAddEntryForm && selectedAccount && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Add Entry - {selectedAccount.name}
                </h3>
                <button
                  onClick={() => {
                    setShowAddEntryForm(false)
                    setSelectedAccount(null)
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              <AddEntryForm
                accountId={selectedAccount.id}
                onSuccess={() => {
                  setShowAddEntryForm(false)
                  setSelectedAccount(null)
                  window.location.reload()
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Import Transfers Modal */}
      {showImportForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Import Transfers from Transactions
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Select which transfer transactions are savings-related
                  </p>
                </div>
                <button
                  onClick={() => setShowImportForm(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              <ImportTransfers
                accounts={accounts}
                onSuccess={() => {
                  setShowImportForm(false)
                  window.location.reload()
                }}
                onClose={() => setShowImportForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Accounts List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Loading accounts...</p>
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow">
          <span className="text-6xl">🏦</span>
          <p className="text-gray-600 dark:text-gray-400 mt-4 text-lg">
            No savings accounts yet.
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
            Create your first account to start tracking!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              stats={accountStats[account.id]}
              onAddEntry={() => handleAddEntry(account)}
              onDelete={async (id) => {
                await deletePensionAccount(id)
                window.location.reload()
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
