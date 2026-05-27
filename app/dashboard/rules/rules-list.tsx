'use client'

import { useState } from 'react'
import type { Category } from '@/lib/types/database'
import { deleteCategorizationRule, updateCategorizationRule } from './rule-actions'

type Rule = {
  id: string
  learning_key: string
  category_id: string
  confidence: number
  category: {
    name: string
    icon: string | null
  } | null
  matchingCount: number
}

type Props = {
  rules: Rule[]
  categories: Category[]
}

export function RulesList({ rules, categories }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editKey, setEditKey] = useState('')
  const [editCategoryId, setEditCategoryId] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const parentCategories = categories.filter((c) => !c.parent_id)
  const getSubcategories = (parentId: string) =>
    categories.filter((c) => c.parent_id === parentId)

  function startEdit(rule: Rule) {
    setEditingId(rule.id)
    setEditKey(rule.learning_key)
    setEditCategoryId(rule.category_id)
    setError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditKey('')
    setEditCategoryId('')
    setError('')
  }

  async function handleSave(ruleId: string) {
    if (!editKey.trim() || !editCategoryId) return

    setIsSaving(true)
    setError('')

    const result = await updateCategorizationRule(ruleId, {
      learning_key: editKey.trim(),
      category_id: editCategoryId,
    })

    if (result.success) {
      cancelEdit()
      window.location.reload()
    } else {
      setError(result.error || 'Opslaan mislukt')
      setIsSaving(false)
    }
  }

  async function handleDelete(ruleId: string, learningKey: string) {
    if (!confirm(`Rule "${learningKey}" verwijderen?`)) return

    setDeletingId(ruleId)
    setError('')

    const result = await deleteCategorizationRule(ruleId)

    if (result.success) {
      window.location.reload()
    } else {
      setError(result.error || 'Verwijderen mislukt')
      setDeletingId(null)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Jouw learning rules
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Bewerk of verwijder rules die verkeerd categoriseren
        </p>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Learning key
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Categorie
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Confidence
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Matches
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acties
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {rules.map((rule) => {
              const isEditing = editingId === rule.id

              return (
                <tr key={rule.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editKey}
                        onChange={(e) => setEditKey(e.target.value)}
                        className="w-full px-2 py-1 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <>
                        <code className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-900 dark:text-gray-300">
                          {rule.learning_key}
                        </code>
                        {rule.learning_key.includes(':') && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {rule.learning_key.startsWith('contains:') && '📍 Contains'}
                            {rule.learning_key.startsWith('starts_with:') && '▶️ Starts with'}
                            {rule.learning_key.startsWith('exact:') && '🎯 Exact match'}
                          </div>
                        )}
                      </>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {isEditing ? (
                      <select
                        value={editCategoryId}
                        onChange={(e) => setEditCategoryId(e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      >
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
                    ) : (
                      <div className="flex items-center gap-2">
                        {rule.category?.icon && <span>{rule.category.icon}</span>}
                        <span className="text-gray-900 dark:text-gray-300">
                          {rule.category?.name || 'Onbekend'}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {rule.confidence}x
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {rule.matchingCount > 0 ? (
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        {rule.matchingCount} transacties
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">Geen matches</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    {isEditing ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleSave(rule.id)}
                          disabled={isSaving || !editKey.trim() || !editCategoryId}
                          className="text-green-600 hover:text-green-700 dark:text-green-400 font-medium disabled:opacity-50"
                        >
                          {isSaving ? '...' : 'Opslaan'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={isSaving}
                          className="text-gray-600 hover:text-gray-800 dark:text-gray-400 font-medium"
                        >
                          Annuleer
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => startEdit(rule)}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                        >
                          Bewerken
                        </button>
                        <button
                          onClick={() => handleDelete(rule.id, rule.learning_key)}
                          disabled={deletingId === rule.id}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 font-medium disabled:opacity-50"
                        >
                          {deletingId === rule.id ? '...' : 'Verwijderen'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
