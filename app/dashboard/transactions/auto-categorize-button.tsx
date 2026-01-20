'use client'

import { useState } from 'react'
import { autoCategorizeWithPatterns } from '../rules/rule-actions'

type Props = {
  count: number
}

export function AutoCategorizeButton({ count }: Props) {
  const [isRunning, setIsRunning] = useState(false)

  async function handleClick() {
    setIsRunning(true)
    try {
      const result = await autoCategorizeWithPatterns()
      if (result.success) {
        alert(`✅ Successfully auto-categorized ${result.count} transactions!`)
        window.location.reload()
      }
    } catch (error) {
      alert(`❌ Error: ${error}`)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isRunning}
      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
    >
      {isRunning ? 'Running...' : `🧠 Auto-Categorize (${count})`}
    </button>
  )
}

