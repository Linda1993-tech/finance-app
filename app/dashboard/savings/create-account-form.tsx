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
  const [interestType, setInterestType] = useState<'manual' | 'fixed' | 'variable'>('manual')
  const [interestRate, setInterestRate] = useState('')
  const [paymentFrequency, setPaymentFrequency] = useState<'annual' | 'quarterly' | 'monthly'>('annual')
  const [fixedRateEndDate, setFixedRateEndDate] = useState('')
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
      interest_rate: interestRate ? parseFloat(interestRate) / 100 : 0, // Convert percentage to decimal
      interest_type: interestType,
      interest_payment_frequency: paymentFrequency,
      fixed_rate_end_date: fixedRateEndDate || null,
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

      {/* Interest Configuration */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          💰 Rente Configuratie
        </h3>

        {/* Interest Type */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Rente Type *
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setInterestType('manual')}
              className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                interestType === 'manual'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              ✍️ Handmatig
            </button>
            <button
              type="button"
              onClick={() => setInterestType('fixed')}
              className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                interestType === 'fixed'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              🔒 Vast
            </button>
            <button
              type="button"
              onClick={() => setInterestType('variable')}
              className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                interestType === 'variable'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              📊 Variabel
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {interestType === 'manual' && '✍️ Je voert rente handmatig in als entry'}
            {interestType === 'fixed' && '🔒 Vaste rente wordt automatisch berekend'}
            {interestType === 'variable' && '📊 Variabele rente, voer elke betaling handmatig in'}
          </p>
        </div>

        {/* Interest Rate (alleen voor fixed/variable) */}
        {(interestType === 'fixed' || interestType === 'variable') && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Jaarlijks Rente Percentage
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="2.60"
                className="w-full px-4 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
            </div>
          </div>
        )}

        {/* Payment Frequency (alleen voor fixed) */}
        {interestType === 'fixed' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Uitbetalingsfrequentie
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentFrequency('annual')}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  paymentFrequency === 'annual'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                📅 Jaarlijks
              </button>
              <button
                type="button"
                onClick={() => setPaymentFrequency('quarterly')}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  paymentFrequency === 'quarterly'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                📆 Kwartaal
              </button>
              <button
                type="button"
                onClick={() => setPaymentFrequency('monthly')}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  paymentFrequency === 'monthly'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                📋 Maandelijks
              </button>
            </div>
          </div>
        )}

        {/* Fixed Rate End Date (alleen voor fixed) */}
        {interestType === 'fixed' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Einddatum Vaste Rente (optioneel)
            </label>
            <input
              type="date"
              value={fixedRateEndDate}
              onChange={(e) => setFixedRateEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Bijv. 12-02-2048 voor ING NL
            </p>
          </div>
        )}
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
