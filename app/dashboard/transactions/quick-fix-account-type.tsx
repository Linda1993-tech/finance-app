'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export function QuickFixAccountType() {
  const [fixing, setFixing] = useState(false)
  const [result, setResult] = useState<string>('')

  async function fixSalaryAccountType() {
    setFixing(true)
    setResult('')

    try {
      const supabase = createClient()

      // Update the salary transaction from dutch to spanish
      const { data, error } = await supabase
        .from('transactions')
        .update({ account_type: 'spanish' })
        .match({
          description: 'Nomina recibida CITYTOURS DREAMS S.L.',
          account_type: 'dutch'
        })
        .select()

      if (error) {
        setResult(`❌ Error: ${error.message}`)
        return
      }

      if (data && data.length > 0) {
        setResult(`✅ Success! ${data.length} transaction(s) updated. Refresh the page!`)
      } else {
        setResult(`⚠️ No transactions found to update. Maybe already fixed?`)
      }
    } catch (err) {
      setResult(`❌ Error: ${err}`)
    } finally {
      setFixing(false)
    }
  }

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
      <h3 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
        🔧 Quick Fix: Salary Account Type
      </h3>
      <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-3">
        Your salary (€4122.14) is in the Dutch account but should be in Spanish. Click below to fix:
      </p>
      <button
        onClick={fixSalaryAccountType}
        disabled={fixing}
        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
      >
        {fixing ? 'Fixing...' : 'Fix Salary Account Type'}
      </button>
      {result && (
        <div className="mt-3 text-sm font-medium">
          {result}
        </div>
      )}
    </div>
  )
}
