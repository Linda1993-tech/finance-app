'use client'

import { useState } from 'react'
import { createSavingsAccount } from './actions'

type Props = {
  onSuccess: () => void
}

export function CreateAccountForm({ onSuccess }: Props) {
  const [name, setName] = useState('')
  const [accountType, setAccountType] = useState<'dutch' | 'spanish' | 'other'>('dutch')
  const [icon, setIcon] = useState('🏦')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const iconOptions = ['🏦', '💰', '💵', '💶', '💳', '🏛️', '🐷', '📊', '💎', '🌟']

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!name.trim()) {
      setError('Account name is required')
      return
    }

    setSubmitting(true)
    setError('')

    const result = await createSavingsAccount({
      name: name.trim(),
      account_type: accountType,
      icon,
    })

    if (result.success) {
      onSuccess()
    } else {
      setError(result.error || 'Failed to create account')
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

      {/* Account Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Account Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Dutch Savings, Spanish Emergency Fund"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          required
        />
      </div>

      {/* Account Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Account Type *
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setAccountType('dutch')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              accountType === 'dutch'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            🇳🇱 Dutch
          </button>
          <button
            type="button"
            onClick={() => setAccountType('spanish')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              accountType === 'spanish'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            🇪🇸 Spanish
          </button>
          <button
            type="button"
            onClick={() => setAccountType('other')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              accountType === 'other'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            🌍 Other
          </button>
        </div>
      </div>

      {/* Icon Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Choose an Icon
        </label>
        <div className="grid grid-cols-5 gap-2">
          {iconOptions.map((iconOption) => (
            <button
              key={iconOption}
              type="button"
              onClick={() => setIcon(iconOption)}
              className={`text-3xl p-3 rounded-lg transition-all ${
                icon === iconOption
                  ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-600 scale-110'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {iconOption}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
        >
          {submitting ? 'Creating...' : 'Create Account'}
        </button>
      </div>
    </form>
  )
}
