'use client'

import { useState, useEffect } from 'react'
import type { Transaction } from '@/lib/types/database'
import type { SavingsAccount } from '@/lib/types/database'
import { getUnlinkedTransfers, importTransfersToSavings } from './actions'

type Props = {
  accounts: SavingsAccount[]
  onSuccess: () => void
  onClose: () => void
}

type TransferSelection = {
  transaction: Transaction
  accountId: string
  entryType: 'deposit' | 'withdrawal'
  selected: boolean
}

export function ImportTransfers({ accounts, onSuccess, onClose }: Props) {
  const [transfers, setTransfers] = useState<Transaction[]>([])
  const [selections, setSelections] = useState<Record<string, TransferSelection>>({})
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadTransfers() {
      try {
        const data = await getUnlinkedTransfers()
        setTransfers(data)
        
        // Initialize selections
        const initial: Record<string, TransferSelection> = {}
        data.forEach((t: any) => {
          initial[t.id] = {
            transaction: t,
            accountId: accounts[0]?.id || '',
            entryType: t.amount > 0 ? 'deposit' : 'withdrawal',
            selected: false,
          }
        })
        setSelections(initial)
      } catch (err) {
        setError('Failed to load transfers')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadTransfers()
  }, [accounts])

  function toggleSelection(transactionId: string) {
    setSelections((prev) => ({
      ...prev,
      [transactionId]: {
        ...prev[transactionId],
        selected: !prev[transactionId].selected,
      },
    }))
  }

  function updateSelection(transactionId: string, updates: Partial<TransferSelection>) {
    setSelections((prev) => ({
      ...prev,
      [transactionId]: {
        ...prev[transactionId],
        ...updates,
      },
    }))
  }

  async function handleImport() {
    const selected = Object.values(selections).filter((s) => s.selected)
    
    if (selected.length === 0) {
      setError('Please select at least one transfer to import')
      return
    }

    setImporting(true)
    setError('')

    const imports = selected.map((s) => ({
      transaction_id: s.transaction.id,
      account_id: s.accountId,
      entry_type: s.entryType,
      transaction_date: s.transaction.transaction_date,
      amount: s.transaction.amount,
      description: s.transaction.description,
    }))

    const result = await importTransfersToSavings(imports)

    if (result.success) {
      onSuccess()
    } else {
      setError(result.error || 'Failed to import transfers')
      setImporting(false)
    }
  }

  const selectedCount = Object.values(selections).filter((s) => s.selected).length

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-gray-600 dark:text-gray-400 mt-4">Loading transfers...</p>
      </div>
    )
  }

  if (transfers.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="text-6xl">✅</span>
        <p className="text-gray-600 dark:text-gray-400 mt-4 text-lg">
          All transfers have been imported!
        </p>
        <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
          No unlinked transfers found.
        </p>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Close
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Select Transfers to Import ({selectedCount} selected)
        </h3>
        <button
          onClick={() => {
            const allSelected = selectedCount === transfers.length
            const updated = { ...selections }
            Object.keys(updated).forEach((id) => {
              updated[id].selected = !allSelected
            })
            setSelections(updated)
          }}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {selectedCount === transfers.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto space-y-3 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        {transfers.map((transfer: any) => {
          const selection = selections[transfer.id]
          if (!selection) return null

          return (
            <div
              key={transfer.id}
              className={`border-2 rounded-lg p-4 transition-all ${
                selection.selected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selection.selected}
                  onChange={() => toggleSelection(transfer.id)}
                  className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {transfer.description}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(transfer.transaction_date).toLocaleDateString('en-GB')}
                      </div>
                    </div>
                    <div className={`text-lg font-semibold ${
                      transfer.amount > 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {transfer.amount > 0 ? '+' : ''}€{transfer.amount.toFixed(2)}
                    </div>
                  </div>

                  {selection.selected && (
                    <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      {/* Account Selection */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Savings Account
                        </label>
                        <select
                          value={selection.accountId}
                          onChange={(e) => updateSelection(transfer.id, { accountId: e.target.value })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                          {accounts.map((account) => (
                            <option key={account.id} value={account.id}>
                              {account.icon} {account.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Type Selection */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Entry Type
                        </label>
                        <select
                          value={selection.entryType}
                          onChange={(e) =>
                            updateSelection(transfer.id, { entryType: e.target.value as 'deposit' | 'withdrawal' })
                          }
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="deposit">💵 Deposit (Money In)</option>
                          <option value="withdrawal">💸 Withdrawal (Money Out)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-3 pt-4">
        <button
          onClick={onClose}
          disabled={importing}
          className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleImport}
          disabled={importing || selectedCount === 0}
          className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
        >
          {importing ? 'Importing...' : `Import ${selectedCount} Transfer${selectedCount !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  )
}
