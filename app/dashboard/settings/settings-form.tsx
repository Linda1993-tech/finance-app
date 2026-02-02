'use client'

import { useState } from 'react'
import type { UserPreferences } from '@/lib/types/database'
import { updateUserPreferences } from './actions'

type Props = {
  preferences: UserPreferences | null
}

export function SettingsForm({ preferences }: Props) {
  const [dutchBalance, setDutchBalance] = useState<string>(
    preferences?.dutch_account_starting_balance.toString() || '0'
  )
  const [dutchDate, setDutchDate] = useState<string>(
    preferences?.dutch_account_starting_date || new Date().toISOString().split('T')[0]
  )
  const [spanishBalance, setSpanishBalance] = useState<string>(
    preferences?.spanish_account_starting_balance.toString() || '0'
  )
  const [spanishDate, setSpanishDate] = useState<string>(
    preferences?.spanish_account_starting_date || new Date().toISOString().split('T')[0]
  )
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const result = await updateUserPreferences({
      dutch_account_starting_balance: parseFloat(dutchBalance) || 0,
      dutch_account_starting_date: dutchDate || null,
      spanish_account_starting_balance: parseFloat(spanishBalance) || 0,
      spanish_account_starting_date: spanishDate || null,
    })

    setSaving(false)

    if (result.success) {
      setMessage({ type: 'success', text: '✓ Settings saved successfully!' })
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1000)
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to save settings' })
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dutch Account */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            🇳🇱 Dutch Account (ING NL)
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Starting Balance
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  €
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={dutchBalance}
                  onChange={(e) => setDutchBalance(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Starting Date
              </label>
              <input
                type="date"
                value={dutchDate}
                onChange={(e) => setDutchDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Spanish Account */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            🇪🇸 Spanish Account (ING ES)
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Starting Balance
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  €
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={spanishBalance}
                  onChange={(e) => setSpanishBalance(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Starting Date
              </label>
              <input
                type="date"
                value={spanishDate}
                onChange={(e) => setSpanishDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          <a
            href="/dashboard"
            className="px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
          >
            Cancel
          </a>
        </div>
      </form>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          💡 How this works
        </h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Dutch & Spanish accounts are tracked separately</li>
          <li>• When you import ING NL CSV → Dutch account</li>
          <li>• When you import ING ES XLSX → Spanish account</li>
          <li>• <strong>Current Account balance</strong> = Starting Balance + All transactions (minus transfers)</li>
          <li>• This affects your <strong>Total Net Worth</strong> calculation</li>
        </ul>
      </div>
    </div>
  )
}
