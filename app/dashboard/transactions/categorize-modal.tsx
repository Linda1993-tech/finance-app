'use client'

import { useState, useEffect } from 'react'
import { categorizeTransaction, type CategorizeOption } from './categorization-actions'
import type { Category, SavingsAccount } from '@/lib/types/database'
import { getSavingsAccounts } from '../savings/actions'
import { formatEuro } from '@/lib/utils/currency-format'
import {
  getDefaultCategorizeOption,
  getSavingsEntryTypeFromTransactionAmount,
  isVariableMerchant,
  resolveOnceCategorizeOption,
  shouldDefaultExcludeFromLearning,
} from '@/lib/utils/transaction-utils'

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

type RememberOption = 'rule' | 'once'

function getOnceOptionDescription(
  normalizedDescription: string,
  learningKey: string | null
): string {
  if (shouldDefaultExcludeFromLearning(normalizedDescription, learningKey)) {
    return 'Geen rule — te generieke omschrijving om van te leren (transferencia, traspaso, etc.)'
  }
  if (isVariableMerchant(normalizedDescription, learningKey)) {
    return 'Geen rule — bestaande rules worden niet op deze transactie toegepast (Bizum, Amazon, etc.)'
  }
  return 'Geen rule — volgende vergelijkbare transactie opnieuw categoriseren'
}

export function CategorizeModal({ transaction, categories, onClose }: Props) {
  const [rememberOption, setRememberOption] = useState<RememberOption>(
    getDefaultCategorizeOption(transaction.normalized_description, transaction.learning_key)
  )
  const [isTransfer, setIsTransfer] = useState(false)
  const [isIncome, setIsIncome] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [savingsAccounts, setSavingsAccounts] = useState<SavingsAccount[]>([])
  const [selectedSavingsAccount, setSelectedSavingsAccount] = useState<string>('')
  const savingsEntryType = getSavingsEntryTypeFromTransactionAmount(transaction.amount)
  const [learningKey, setLearningKey] = useState(transaction.learning_key || '')
  const [selectedCategory, setSelectedCategory] = useState<string>('')

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

  const parentCategories = categories.filter((c) => !c.parent_id)
  const getSubcategories = (parentId: string) =>
    categories.filter((c) => c.parent_id === parentId)

  const isGenericTransfer = shouldDefaultExcludeFromLearning(
    transaction.normalized_description,
    transaction.learning_key
  )
  const isVariable = isVariableMerchant(
    transaction.normalized_description,
    transaction.learning_key
  )

  function toBackendOption(): CategorizeOption {
    if (rememberOption === 'rule') return 'rule'
    return resolveOnceCategorizeOption(
      transaction.normalized_description,
      learningKey.trim() || transaction.learning_key
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCategory && !isTransfer && !isIncome) return
    if (rememberOption === 'rule' && !learningKey.trim()) return

    setIsSubmitting(true)
    try {
      await categorizeTransaction(
        transaction.id,
        selectedCategory,
        toBackendOption(),
        isTransfer,
        isIncome,
        selectedSavingsAccount || undefined,
        savingsEntryType,
        transaction.transaction_date,
        learningKey.trim() || undefined
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
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Transactie categoriseren
          </h2>
          <div className="mt-3 space-y-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Omschrijving:</strong> {transaction.description}
            </p>
            {rememberOption === 'rule' && (
              <div>
                <label
                  htmlFor="learning-key"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Learning key (rule)
                </label>
                <input
                  id="learning-key"
                  type="text"
                  value={learningKey}
                  onChange={(e) => setLearningKey(e.target.value)}
                  placeholder="Bijv. MENSSANA"
                  maxLength={16}
                  className="w-full px-3 py-2 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Pas aan voor een specifiekere match — bijv. MENSSANA i.p.v. CAFE
                </p>
              </div>
            )}
            <p
              className={`text-sm font-medium ${
                transaction.amount >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {transaction.amount >= 0 ? '+' : ''}
              {formatEuro(transaction.amount)}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Categorie
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              required={!isTransfer && !isIncome}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">-- Kies een categorie --</option>
              {parentCategories.map((parent) => {
                const subcats = getSubcategories(parent.id)
                return (
                  <optgroup key={parent.id} label={`${parent.icon || ''} ${parent.name}`}>
                    {subcats.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.icon} {sub.name}
                      </option>
                    ))}
                  </optgroup>
                )
              })}
            </select>
          </div>

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
                  🔄 Dit is een transfer
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Geld verplaatst tussen eigen rekeningen (spaar, beleggen, tussen banken).
                </div>
              </div>
            </label>

            {isTransfer && savingsAccounts.length > 0 && (
              <div className="ml-7 space-y-3 border-t border-amber-200 dark:border-amber-800 pt-3">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  💰 Koppel aan spaarrekening (optioneel)
                </label>
                <select
                  value={selectedSavingsAccount}
                  onChange={(e) => setSelectedSavingsAccount(e.target.value)}
                  className="w-full px-3 py-2 border border-amber-300 dark:border-amber-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">-- Niet koppelen --</option>
                  {savingsAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.icon} {account.name}
                    </option>
                  ))}
                </select>
                {selectedSavingsAccount && (
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {savingsEntryType === 'deposit' ? '➕ Bijschrijving' : '➖ Afboeking'}
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      (automatisch op basis van bedrag)
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

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
                    💰 Dit is echt inkomen
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Salaris, cadeaus, etc. Uit voor terugbetalingen of split bills.
                  </div>
                </div>
              </label>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Onthouden?
            </label>
            {(isGenericTransfer || isVariable) && rememberOption === 'once' && (
              <p className="text-xs text-orange-600 dark:text-orange-400 mb-2">
                💡 Standaard: alleen deze transactie
                {isGenericTransfer && ' — generieke omschrijving, niet leren'}
              </p>
            )}
            <div className="space-y-2">
              <label
                className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                  rememberOption === 'rule'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name="remember"
                  value="rule"
                  checked={rememberOption === 'rule'}
                  onChange={() => setRememberOption('rule')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    ✅ Onthoud voor volgende keer
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Maak een rule voor &quot;{learningKey.trim() || '…'}&quot; — vergelijkbare
                    transacties worden automatisch gecategoriseerd
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                  rememberOption === 'once'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name="remember"
                  value="once"
                  checked={rememberOption === 'once'}
                  onChange={() => setRememberOption('once')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    🔷 Alleen deze transactie
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {getOnceOptionDescription(
                      transaction.normalized_description,
                      learningKey.trim() || transaction.learning_key
                    )}
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={
                isSubmitting ||
                (!selectedCategory && !isTransfer && !isIncome) ||
                (rememberOption === 'rule' && !learningKey.trim())
              }
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {isSubmitting ? 'Opslaan...' : 'Opslaan'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
            >
              Annuleren
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
