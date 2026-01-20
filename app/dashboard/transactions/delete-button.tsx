'use client'

import { useState } from 'react'
import { deleteAllTransactions } from '../import/actions'

export function DeleteAllButton() {
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    const confirmed = confirm(
      '⚠️ Are you sure you want to delete ALL transactions?\n\nThis cannot be undone!'
    )

    if (!confirmed) return

    setIsDeleting(true)
    try {
      const result = await deleteAllTransactions()
      if (result.success) {
        alert('✅ All transactions deleted successfully!')
        window.location.reload()
      } else {
        alert(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      alert(`❌ Unexpected error: ${error}`)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
    >
      {isDeleting ? 'Deleting...' : '🗑️ Delete All'}
    </button>
  )
}

