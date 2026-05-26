'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  deleteImportBatch,
  deleteRecentImportBatches,
  fixDateRangeAccountType,
  fixImportBatchAccountType,
  fixTransactionsAccountType,
} from './actions'
import type { AccountTypeFixData } from './actions'
import { formatEuro } from '@/lib/utils/currency-format'

type Props = {
  data: AccountTypeFixData
}

const accountLabels = {
  dutch: '🇳🇱 Nederlands',
  spanish: '🇪🇸 Spaans',
  other: 'Overig',
}

function oppositeAccount(type: 'dutch' | 'spanish' | 'other'): 'dutch' | 'spanish' {
  return type === 'dutch' ? 'spanish' : 'dutch'
}

export function FixAccountTypePanel({ data }: Props) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [fixing, setFixing] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [showDateRange, setShowDateRange] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [dateRangeFromAccount, setDateRangeFromAccount] = useState<'dutch' | 'spanish'>('dutch')

  const { suspicious, importBatches } = data

  if (suspicious.length === 0 && importBatches.length === 0) {
    return null
  }

  function toggleSelection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAllSuspicious() {
    setSelectedIds(new Set(suspicious.map((t) => t.id)))
  }

  async function handleFixSelected() {
    if (selectedIds.size === 0) return

    const toFix = suspicious.filter((t) => selectedIds.has(t.id))
    const byTarget = new Map<'dutch' | 'spanish', string[]>()
    for (const tx of toFix) {
      const ids = byTarget.get(tx.suggested_account_type) ?? []
      ids.push(tx.id)
      byTarget.set(tx.suggested_account_type, ids)
    }

    setFixing(true)
    setResult(null)

    try {
      let total = 0
      for (const [targetType, ids] of byTarget) {
        const res = await fixTransactionsAccountType(ids, targetType)
        if (!res.success) {
          setResult(`❌ ${res.error}`)
          return
        }
        total += res.count ?? 0
      }
      setResult(`✅ ${total} transactie${total === 1 ? '' : 's'} verplaatst naar het juiste account`)
      setSelectedIds(new Set())
      router.refresh()
    } finally {
      setFixing(false)
    }
  }

  async function handleDeleteBatch(importDate: string, count: number) {
    const confirmed = confirm(
      `Weet je zeker dat je deze import wilt verwijderen?\n\n${count} transactie${count === 1 ? '' : 's'} worden permanent verwijderd.`
    )
    if (!confirmed) return

    setFixing(true)
    setResult(null)

    try {
      const res = await deleteImportBatch(importDate)
      if (res.success) {
        setResult(
          `✅ ${res.count} transactie${res.count === 1 ? '' : 's'} verwijderd`
        )
        router.refresh()
      } else {
        setResult(`❌ ${res.error}`)
      }
    } finally {
      setFixing(false)
    }
  }

  async function handleDeleteLastTwo() {
    const recent = importBatches.slice(0, 2)
    if (recent.length === 0) return

    const totalCount = recent.reduce((sum, b) => sum + b.count, 0)
    const summary = recent
      .map(
        (b) =>
          `• ${b.count} transacties (${accountLabels[b.account_type]}, ${new Date(b.date_range.from).toLocaleDateString('nl-NL')} – ${new Date(b.date_range.to).toLocaleDateString('nl-NL')})`
      )
      .join('\n')

    const confirmed = confirm(
      `Weet je zeker dat je de laatste ${recent.length} upload${recent.length === 1 ? '' : 's'} wilt verwijderen?\n\n${summary}\n\nTotaal: ${totalCount} transacties. Dit kan niet ongedaan worden gemaakt.`
    )
    if (!confirmed) return

    setFixing(true)
    setResult(null)

    try {
      const res = await deleteRecentImportBatches(2)
      if (res.success) {
        setResult(
          `✅ ${res.count} transactie${res.count === 1 ? '' : 's'} verwijderd (laatste ${recent.length} upload${recent.length === 1 ? '' : 's'})`
        )
        router.refresh()
      } else {
        setResult(`❌ ${res.error}`)
      }
    } finally {
      setFixing(false)
    }
  }

  async function handleFixBatch(importDate: string, currentType: 'dutch' | 'spanish' | 'other') {
    const newType = oppositeAccount(currentType)
    setFixing(true)
    setResult(null)

    try {
      const res = await fixImportBatchAccountType(importDate, newType)
      if (res.success) {
        setResult(
          `✅ ${res.count} transactie${res.count === 1 ? '' : 's'} verplaatst naar ${accountLabels[newType]} account`
        )
        router.refresh()
      } else {
        setResult(`❌ ${res.error}`)
      }
    } finally {
      setFixing(false)
    }
  }

  async function handleFixDateRange() {
    if (!dateFrom || !dateTo) {
      setResult('❌ Vul een start- en einddatum in')
      return
    }

    const newType = oppositeAccount(dateRangeFromAccount)
    setFixing(true)
    setResult(null)

    try {
      const res = await fixDateRangeAccountType(dateFrom, dateTo, dateRangeFromAccount, newType)
      if (res.success) {
        setResult(
          `✅ ${res.count} transactie${res.count === 1 ? '' : 's'} verplaatst van ${accountLabels[dateRangeFromAccount]} naar ${accountLabels[newType]}`
        )
        router.refresh()
      } else {
        setResult(`❌ ${res.error}`)
      }
    } finally {
      setFixing(false)
    }
  }

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-5 space-y-6">
      <div>
        <h3 className="font-semibold text-yellow-900 dark:text-yellow-200 text-lg">
          🔧 Imports beheren
        </h3>
        <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
          Verkeerde upload? Verwijder een import en upload opnieuw, of verplaats transacties naar
          het juiste account.
        </p>
      </div>

      {result && (
        <div className="text-sm font-medium text-yellow-900 dark:text-yellow-200">{result}</div>
      )}

      {importBatches.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-yellow-900 dark:text-yellow-200">
              Recente imports
            </h4>
            {importBatches.length >= 1 && (
              <button
                onClick={handleDeleteLastTwo}
                disabled={fixing}
                className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                🗑️ Verwijder laatste 2 uploads
              </button>
            )}
          </div>
          <p className="text-xs text-yellow-700 dark:text-yellow-400 mb-3">
            Elke import heeft een eigen batch. Verwijder een verkeerde upload of verplaats naar
            het andere account.
          </p>
          <div className="space-y-2">
            {importBatches.slice(0, 5).map((batch) => (
              <div
                key={batch.import_date}
                className="flex items-center justify-between gap-4 bg-white/60 dark:bg-gray-800/60 rounded-lg p-3"
              >
                <div className="text-sm">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {batch.count} transacties
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {' '}
                    · {accountLabels[batch.account_type]} ·{' '}
                    {new Date(batch.date_range.from).toLocaleDateString('nl-NL')} –{' '}
                    {new Date(batch.date_range.to).toLocaleDateString('nl-NL')}
                  </span>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Geïmporteerd op{' '}
                    {new Date(batch.import_date).toLocaleString('nl-NL', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  {batch.account_type !== 'other' && (
                    <button
                      onClick={() => handleFixBatch(batch.import_date, batch.account_type)}
                      disabled={fixing}
                      className="px-3 py-1.5 text-sm bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                    >
                      → {accountLabels[oppositeAccount(batch.account_type)]}
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteBatch(batch.import_date, batch.count)}
                    disabled={fixing}
                    className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                    title="Import verwijderen"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {suspicious.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-yellow-900 dark:text-yellow-200">
              Verdachte transacties ({suspicious.length})
            </h4>
            <button
              onClick={selectAllSuspicious}
              className="text-xs text-yellow-700 dark:text-yellow-400 hover:underline"
            >
              Alles selecteren
            </button>
          </div>
          <p className="text-xs text-yellow-700 dark:text-yellow-400 mb-3">
            Deze transacties lijken op het verkeerde account te staan op basis van de omschrijving.
          </p>
          <div className="max-h-48 overflow-y-auto space-y-1 mb-3">
            {suspicious.map((tx) => (
              <label
                key={tx.id}
                className="flex items-start gap-3 bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(tx.id)}
                  onChange={() => toggleSelection(tx.id)}
                  className="mt-1"
                />
                <div className="text-sm min-w-0">
                  <div className="text-gray-900 dark:text-white truncate">{tx.description}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(tx.transaction_date).toLocaleDateString('nl-NL')} ·{' '}
                    {formatEuro(tx.amount)} · {tx.reason}
                  </div>
                </div>
              </label>
            ))}
          </div>
          <button
            onClick={handleFixSelected}
            disabled={fixing || selectedIds.size === 0}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors text-sm"
          >
            {fixing
              ? 'Bezig...'
              : `${selectedIds.size} geselecteerde verplaatsen`}
          </button>
        </div>
      )}

      <div>
        <button
          onClick={() => setShowDateRange(!showDateRange)}
          className="text-sm text-yellow-700 dark:text-yellow-400 hover:underline"
        >
          {showDateRange ? '▼' : '▶'} Handmatig op datumbereik corrigeren
        </button>
        {showDateRange && (
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-yellow-800 dark:text-yellow-300 mb-1">
                Van
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-2 py-1.5 text-sm rounded border border-yellow-300 dark:border-yellow-700 bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-xs text-yellow-800 dark:text-yellow-300 mb-1">
                Tot
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-2 py-1.5 text-sm rounded border border-yellow-300 dark:border-yellow-700 bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-xs text-yellow-800 dark:text-yellow-300 mb-1">
                Verplaats van
              </label>
              <select
                value={dateRangeFromAccount}
                onChange={(e) =>
                  setDateRangeFromAccount(e.target.value as 'dutch' | 'spanish')
                }
                className="px-2 py-1.5 text-sm rounded border border-yellow-300 dark:border-yellow-700 bg-white dark:bg-gray-800"
              >
                <option value="dutch">🇳🇱 Nederlands → 🇪🇸 Spaans</option>
                <option value="spanish">🇪🇸 Spaans → 🇳🇱 Nederlands</option>
              </select>
            </div>
            <button
              onClick={handleFixDateRange}
              disabled={fixing || !dateFrom || !dateTo}
              className="px-4 py-1.5 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors text-sm"
            >
              Corrigeren
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
