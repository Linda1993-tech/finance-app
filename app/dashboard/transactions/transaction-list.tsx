'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CategorizeModal } from './categorize-modal'
import type { Category } from '@/lib/types/database'
import { formatEuro } from '@/lib/utils/currency-format'

type Transaction = {
  id: string
  transaction_date: string
  description: string
  amount: number
  currency: string
  normalized_description: string
  learning_key: string | null
  category: {
    id: string
    name: string
    icon: string | null
    color: string | null
  } | null
  import_source: string | null
}

type Props = {
  transactions: Transaction[]
  categories: Category[]
}

export function TransactionList({ transactions, categories }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'income' | 'expense' | 'uncategorized'>('all')
  const [categorizingTransaction, setCategorizingTransaction] = useState<Transaction | null>(
    null
  )

  // Read filter from URL on mount
  useEffect(() => {
    const filterParam = searchParams.get('filter')
    if (filterParam === 'uncategorized' || filterParam === 'income' || filterParam === 'expense') {
      setFilter(filterParam)
    }
  }, [searchParams])

  // Update URL when filter changes
  function handleFilterChange(newFilter: 'all' | 'income' | 'expense' | 'uncategorized') {
    setFilter(newFilter)
    const params = new URLSearchParams(searchParams.toString())
    if (newFilter === 'all') {
      params.delete('filter')
    } else {
      params.set('filter', newFilter)
    }
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const filtered = transactions.filter((t: any) => {
    if (filter === 'income') return t.amount > 0
    if (filter === 'expense') return t.amount < 0
    if (filter === 'uncategorized') return !t.category_id && !t.is_transfer && !t.is_income
    return true
  })

  const uncategorizedCount = transactions.filter((t: any) => !t.category_id && !t.is_transfer && !t.is_income).length

  // Only count transactions explicitly marked as income
  const totalIncome = transactions
    .filter((t: any) => t.is_income && !t.is_transfer)
    .reduce((sum, t) => sum + t.amount, 0)

  // Calculate net expenses (expenses - reimbursements)
  // Include all non-income, non-transfer transactions (both negative and positive)
  const totalExpense = Math.abs(
    transactions
      .filter((t: any) => !t.is_income && !t.is_transfer)
      .reduce((sum, t) => sum + t.amount, 0)
  )

  const netCashflow = totalIncome - totalExpense

  return (
    <>
      {categorizingTransaction && (
        <CategorizeModal
          transaction={categorizingTransaction}
          categories={categories}
          onClose={() => setCategorizingTransaction(null)}
        />
      )}

      <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">Income</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatEuro(totalIncome)}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">Expenses</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatEuro(totalExpense)}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">Net Cashflow</div>
          <div
            className={`text-2xl font-bold ${
              netCashflow >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {formatEuro(netCashflow)}
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex gap-2">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All ({transactions.length})
          </button>
          <button
            onClick={() => handleFilterChange('income')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'income'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Income ({transactions.filter((t: any) => t.amount > 0).length})
          </button>
          <button
            onClick={() => handleFilterChange('expense')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'expense'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Expenses ({transactions.filter((t: any) => t.amount < 0).length})
          </button>
          <button
            onClick={() => handleFilterChange('uncategorized')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'uncategorized'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            ⚠️ Uncategorized ({uncategorizedCount})
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Learning Key
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filtered.map((transaction: any) => (
                <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {new Date(transaction.transaction_date).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                    <div>{transaction.description}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {transaction.normalized_description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {transaction.is_transfer ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded text-xs font-medium">
                        🔄 Transfer
                      </span>
                    ) : transaction.is_income ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded text-xs font-medium">
                          💰 Income
                        </span>
                        {transaction.category && (
                          <>
                            {transaction.category.icon && (
                              <span>{transaction.category.icon}</span>
                            )}
                            <span className="text-gray-900 dark:text-gray-300">
                              {transaction.category.name}
                            </span>
                          </>
                        )}
                      </div>
                    ) : transaction.category ? (
                      <div className="flex items-center gap-2">
                        {transaction.category.icon && (
                          <span>{transaction.category.icon}</span>
                        )}
                        <span className="text-gray-900 dark:text-gray-300">
                          {transaction.category.name}
                        </span>
                        {transaction.amount > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-100 dark:bg-cyan-900/20 text-cyan-800 dark:text-cyan-200 rounded text-xs font-medium">
                            ↩️ Offset
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 rounded text-xs font-medium">
                        ⚠️ Uncategorized
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600 dark:text-gray-400">
                    {transaction.learning_key || '-'}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                      transaction.amount >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {transaction.amount >= 0 ? '+' : ''}
                    {formatEuro(transaction.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => setCategorizingTransaction(transaction)}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                    >
                      {transaction.category ? 'Edit' : 'Categorize'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            No transactions match your filter
          </div>
        )}
      </div>
    </div>
    </>
  )
}

