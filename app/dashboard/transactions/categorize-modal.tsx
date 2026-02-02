'use client'

import { useState, useEffect } from 'react'
import { categorizeTransaction, type CategorizeOption } from './categorization-actions'
import type { Category, SavingsAccount } from '@/lib/types/database'
import { getSavingsAccounts } from '../savings/actions'
import { formatEuro } from '@/lib/utils/currency-format'

type Transaction = {
  id: string
  description: string
  normalized_description: string
  learning_key: string | null
  amount: number
  transaction_date: string
}

type Props = {
  transaction: Transaction
  categories: Category[]
  onClose: () => void
}

export function CategorizeModal({ transaction, categories, onClose }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [option, setOption] = useState<CategorizeOption>('rule')
  const [isTransfer, setIsTransfer] = useState(false)
  const [isIncome, setIsIncome] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [savingsAccounts, setSavingsAccounts] = useState<SavingsAccount[]>([])
  const [selectedSavingsAccount, setSelectedSavingsAccount] = useState<string>('')
  const [savingsEntryType, setSavingsEntryType] = useState<'deposit' | 'withdrawal'>(
    transaction.amount > 0 ? 'deposit' : 'withdrawal'
  )

  // Load savings accounts when modal opens
  useEffect(() => {
    async function loadSavingsAccounts() {
      try {
        const accounts = await getSavingsAccounts()
        setSavingsAccounts(accounts)
      } catch (error) {
        console.error('Failed to load savings accounts:', error)
      }
    }
    loadSavingsAccounts()
  }, [])

  // Group categories by parent
  const parentCategories = categories.filter((c) => !c.parent_id)
  const getSubcategories = (parentId: string) =>
    categories.filter((c) => c.parent_id === parentId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Category is optional for transfers and income, required otherwise
    if (!selectedCategory && !isTransfer && !isIncome) return

    setIsSubmitting(true)
    try {
      await categorizeTransaction(
        transaction.id,
        selectedCategory,
        option,
        isTransfer,
        isIncome,
        // Pass savings account info if selected
        selectedSavingsAccount || undefined,
        savingsEntryType,
        transaction.transaction_date
      )
      onClose()
      window.location.reload()
    } catch (error) {
      alert(`Error: ${error}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Categorize Transaction
          </h2>
          <div className="mt-3 space-y-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Description:</strong> {transaction.description}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Normalized:</strong> {transaction.normalized_description}
            </p>
            {transaction.learning_key && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Learning Key:</strong>{' '}
                <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                  {transaction.learning_key}
                </code>
              </p>
            )}
            <p
              className={`text-sm font-medium ${
                transaction.amount >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {transaction.amount >= 0 ? '+' : ''}{formatEuro(transaction.amount)}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              required={!isTransfer && !isIncome}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">-- Choose a category --</option>
              {parentCategories.map((parent) => {
                const subcats = getSubcategories(parent.id)
                return (
                  <optgroup key={parent.id} label={`${parent.icon || ''} ${parent.name}`}>
                    <option value={parent.id}>
                      {parent.icon} {parent.name}
                    </option>
                    {subcats.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        &nbsp;&nbsp;└ {sub.icon} {sub.name}
                      </option>
                    ))}
                  </optgroup>
                )
              })}
            </select>
          </div>

          {/* Transfer Checkbox */}
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-lg space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isTransfer}
                onChange={(e) => setIsTransfer(e.target.checked)}
                className="mt-1"
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  🔄 This is a transfer
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Money moved between your own accounts (savings, stocks, between banks).
                  Won't be counted as income or expense.
                </div>
              </div>
            </label>

            {/* Savings Account Selection (only shown when transfer is checked) */}
            {isTransfer && savingsAccounts.length > 0 && (
              <div className="ml-7 space-y-3 border-t border-amber-200 dark:border-amber-800 pt-3">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  💰 Link to Savings Account (optional)
                </label>
                <select
                  value={selectedSavingsAccount}
                  onChange={(e) => setSelectedSavingsAccount(e.target.value)}
                  className="w-full px-3 py-2 border border-amber-300 dark:border-amber-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">-- Don't link to savings --</option>
                  {savingsAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.icon} {account.name}
                    </option>
                  ))}
                </select>
                {selectedSavingsAccount && (
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="entry-type"
                        value="deposit"
                        checked={savingsEntryType === 'deposit'}
                        onChange={() => setSavingsEntryType('deposit')}
                        className="text-green-600"
                      />
                      <span className="text-sm text-gray-900 dark:text-white">
                        ➕ Deposit (into savings)
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="entry-type"
                        value="withdrawal"
                        checked={savingsEntryType === 'withdrawal'}
                        onChange={() => setSavingsEntryType('withdrawal')}
                        className="text-red-600"
                      />
                      <span className="text-sm text-gray-900 dark:text-white">
                        ➖ Withdrawal (from savings)
                      </span>
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Income Checkbox (for positive amounts) */}
          {transaction.amount > 0 && !isTransfer && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isIncome}
                  onChange={(e) => setIsIncome(e.target.checked)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    💰 This is real income
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Check this for salary, gifts, or side income. Leave unchecked for
                    reimbursements, split bills, or people paying you back.
                  </div>
                </div>
              </label>
            </div>
          )}

          {/* Learning Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Learning Behavior
            </label>
            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-blue-500 bg-blue-50 dark:bg-blue-900/20">
                <input
                  type="radio"
                  name="option"
                  value="rule"
                  checked={option === 'rule'}
                  onChange={(e) => setOption(e.target.value as CategorizeOption)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    ✅ Always create/update rule (Recommended)
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Create a rule for "{transaction.learning_key}" → auto-categorize similar
                    transactions in the future
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <input
                  type="radio"
                  name="option"
                  value="once"
                  checked={option === 'once'}
                  onChange={(e) => setOption(e.target.value as CategorizeOption)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    🔷 Apply once (no rule)
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Categorize only this transaction, don't create a learning rule
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <input
                  type="radio"
                  name="option"
                  value="no-auto"
                  checked={option === 'no-auto'}
                  onChange={(e) => setOption(e.target.value as CategorizeOption)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    🚫 Don't auto-apply rules
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    For merchants like Amazon/Bizum - categorize manually each time
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <input
                  type="radio"
                  name="option"
                  value="exclude"
                  checked={option === 'exclude'}
                  onChange={(e) => setOption(e.target.value as CategorizeOption)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    ⛔ Do not learn from this
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Exclude this transaction from learning system entirely
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting || (!selectedCategory && !isTransfer && !isIncome)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {isSubmitting ? 'Saving...' : 'Save & Categorize'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

