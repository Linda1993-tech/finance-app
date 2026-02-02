'use client'

import { useState } from 'react'
import { addSavingsEntry } from './actions'

type Props = {
  accountId: string
  onSuccess: () => void
}

export function AddEntryForm({ accountId, onSuccess }: Props) {
  const [entryType, setEntryType] = useState<'balance' | 'deposit' | 'withdrawal'>('balance')
  const [amount, setAmount] = useState('')
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount greater than 0')
      return
    }

    setSubmitting(true)
    setError('')

    const result = await addSavingsEntry({
      account_id: accountId,
      entry_type: entryType,
      amount: amountNum,
      entry_date: entryDate,
      notes: notes.trim() || undefined,
    })

    if (result.success) {
      onSuccess()
    } else {
      setError(result.error || 'Failed to add entry')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Entry Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Entry Type *
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setEntryType('balance')}
            className={`px-4 py-3 rounded-lg font-medium transition-all ${
              entryType === 'balance'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <div className="text-2xl mb-1">📸</div>
            <div className="text-xs">Balance</div>
          </button>
          <button
            type="button"
            onClick={() => setEntryType('deposit')}
            className={`px-4 py-3 rounded-lg font-medium transition-all ${
              entryType === 'deposit'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <div className="text-2xl mb-1">💵</div>
            <div className="text-xs">Deposit</div>
          </button>
          <button
            type="button"
            onClick={() => setEntryType('withdrawal')}
            className={`px-4 py-3 rounded-lg font-medium transition-all ${
              entryType === 'withdrawal'
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <div className="text-2xl mb-1">💸</div>
            <div className="text-xs">Withdrawal</div>
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {entryType === 'balance' && '📸 Record your current account balance'}
          {entryType === 'deposit' && '💵 Money you added to this account'}
          {entryType === 'withdrawal' && '💸 Money you took out of this account'}
        </p>
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Amount (€) *
        </label>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          required
        />
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Date *
        </label>
        <input
          type="date"
          value={entryDate}
          onChange={(e) => setEntryDate(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          required
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., Monthly savings, Emergency fund deposit..."
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
        />
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
        >
          {submitting ? 'Adding...' : 'Add Entry'}
        </button>
      </div>
    </form>
  )
}
