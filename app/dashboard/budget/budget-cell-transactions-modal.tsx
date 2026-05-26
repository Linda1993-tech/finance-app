'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  getBudgetCellTransactions,
  updateBudgetForMonth,
  type BudgetCellDetails,
} from './budget-actions'
import { formatEuro } from '@/lib/utils/currency-format'

type Props = {
  categoryId: string
  categoryName: string
  categoryIcon: string | null
  year: number
  month: number | null
  budget: number
  onClose: () => void
}

export function BudgetCellTransactionsModal({
  categoryId,
  categoryName,
  categoryIcon,
  year,
  month,
  budget,
  onClose,
}: Props) {
  const router = useRouter()
  const [details, setDetails] = useState<BudgetCellDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const result = await getBudgetCellTransactions(categoryId, year, month)
        if (!cancelled) {
          setDetails(result)
        }
      } catch {
        if (!cancelled) {
          setError('Kon transacties niet laden')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [categoryId, year, month])

  function handleEditBudget() {
    if (month === null) return

    const newBudget = prompt(
      `Budget voor ${categoryName} in ${details?.monthLabel || month}:`,
      (details?.budget ?? budget).toString()
    )

    if (newBudget === null || newBudget === '') return

    const parsed = parseFloat(newBudget) || 0

    updateBudgetForMonth({
      category_id: categoryId,
      month,
      budget: parsed,
      year,
    }).then((result) => {
      if (!result.success) {
        alert(`Fout: ${result.error}`)
        return
      }
      getBudgetCellTransactions(categoryId, year, month).then(setDetails)
      router.refresh()
    })
  }

  const netSpent = details?.netSpent ?? 0
  const budgetAmount = details?.budget ?? budget
  const percentage = budgetAmount > 0 ? (netSpent / budgetAmount) * 100 : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-start justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div>
            <div className="flex items-center gap-2">
              {categoryIcon && <span className="text-2xl">{categoryIcon}</span>}
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {categoryName}
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {details?.monthLabel || 'Laden...'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none"
            aria-label="Sluiten"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Besteed: </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatEuro(netSpent)}
              </span>
            </div>
            {budgetAmount > 0 && (
              <>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Budget: </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatEuro(budgetAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Gebruikt: </span>
                  <span
                    className={`font-semibold ${
                      percentage > 100
                        ? 'text-red-600 dark:text-red-400'
                        : percentage > 80
                        ? 'text-orange-600 dark:text-orange-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}
                  >
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
              Transacties laden...
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-600 dark:text-red-400">{error}</div>
          ) : details && details.transactions.length === 0 ? (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
              Geen transacties in deze periode
            </div>
          ) : (
            <div className="space-y-2">
              {details?.transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-start justify-between gap-4 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {tx.description}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(tx.transaction_date).toLocaleDateString('nl-NL')}
                      {tx.category_name && tx.category_name !== categoryName && (
                        <span> · {tx.category_name}</span>
                      )}
                      {tx.amount > 0 && (
                        <span className="text-cyan-600 dark:text-cyan-400"> · terugbetaling</span>
                      )}
                    </div>
                  </div>
                  <div
                    className={`text-sm font-semibold whitespace-nowrap ${
                      tx.amount >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {tx.amount >= 0 ? '+' : ''}
                    {formatEuro(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
          {month !== null ? (
            <button
              onClick={handleEditBudget}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Budget aanpassen
            </button>
          ) : (
            <span />
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  )
}
