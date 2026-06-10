'use client'

import { useState } from 'react'
import { parseDeGiroCSV, type DeGiroProduct } from '@/lib/parsers/degiro-parser'
import { importDeGiroTransactions, type DeGiroImportItem } from './actions'
import { formatEuro, formatNumber } from '@/lib/utils/currency-format'

type Props = {
  onClose: () => void
}

type ProductSelection = {
  product: DeGiroProduct
  ticker: string
  selected: boolean
}

export function ImportDeGiro({ onClose }: Props) {
  const [selections, setSelections] = useState<ProductSelection[]>([])
  const [parseError, setParseError] = useState('')
  const [importError, setImportError] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [result, setResult] = useState<{ imported: number; duplicates: number } | null>(null)

  async function handleFile(file: File) {
    setParseError('')
    setSelections([])

    const content = await file.text()
    const parsed = parseDeGiroCSV(content)

    if (!parsed.success || !parsed.products) {
      setParseError(parsed.error || 'Kon bestand niet lezen')
      return
    }

    setSelections(
      parsed.products.map((product) => ({
        product,
        ticker: product.suggestedTicker,
        selected: true,
      }))
    )
  }

  function updateTicker(isin: string, ticker: string) {
    setSelections((prev) =>
      prev.map((s) => (s.product.isin === isin ? { ...s, ticker } : s))
    )
  }

  function toggleSelected(isin: string) {
    setSelections((prev) =>
      prev.map((s) => (s.product.isin === isin ? { ...s, selected: !s.selected } : s))
    )
  }

  async function handleImport() {
    const selected = selections.filter((s) => s.selected)
    if (selected.length === 0) return

    const missingTicker = selected.find((s) => !s.ticker.trim())
    if (missingTicker) {
      setImportError(`Vul een ticker in voor "${missingTicker.product.product}"`)
      return
    }

    setIsImporting(true)
    setImportError('')

    const items: DeGiroImportItem[] = selected.map((s) => ({
      ticker: s.ticker.trim().toUpperCase(),
      name: s.product.product,
      currency: s.product.currency,
      transactions: s.product.transactions.map((tx) => ({
        date: tx.date,
        quantity: tx.quantity,
        price: tx.price,
        fees: tx.fees,
        total: tx.total,
        orderId: tx.orderId,
      })),
    }))

    const importResult = await importDeGiroTransactions(items)

    if (importResult.success) {
      setResult({
        imported: importResult.imported || 0,
        duplicates: importResult.duplicates || 0,
      })
    } else {
      setImportError(importResult.error || 'Import mislukt')
      setIsImporting(false)
    }
  }

  const selectedCount = selections.filter((s) => s.selected).length
  const totalTransactions = selections
    .filter((s) => s.selected)
    .reduce((sum, s) => sum + s.product.transactions.length, 0)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              📥 DeGiro import
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Upload je DeGiro Transactions-export (CSV)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none"
            aria-label="Sluiten"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-5">
          {result ? (
            <div className="text-center py-8">
              <span className="text-6xl">✅</span>
              <p className="text-lg font-medium text-gray-900 dark:text-white mt-4">
                {result.imported} transactie{result.imported !== 1 ? 's' : ''} geïmporteerd
              </p>
              {result.duplicates > 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {result.duplicates} duplica{result.duplicates !== 1 ? 'ten' : 'at'} overgeslagen
                </p>
              )}
              <button
                onClick={() => window.location.reload()}
                className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Sluiten en verversen
              </button>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-200">
                <strong>Hoe exporteer je vanuit DeGiro?</strong>
                <ol className="list-decimal ml-5 mt-1 space-y-0.5">
                  <li>Log in op DeGiro → Inbox → <strong>Transacties</strong></li>
                  <li>Kies de gewenste periode</li>
                  <li>Klik op <strong>Export</strong> → CSV</li>
                </ol>
              </div>

              <input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFile(file)
                }}
                className="block w-full text-sm text-gray-600 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:font-medium hover:file:bg-blue-700 file:cursor-pointer"
              />

              {parseError && (
                <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg text-sm">
                  {parseError}
                </div>
              )}

              {selections.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {selections.length} product{selections.length !== 1 ? 'en' : ''} gevonden
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Controleer de tickers (Yahoo-formaat, bijv. ASML.AS)
                    </p>
                  </div>

                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {selections.map((selection) => {
                      const txs = selection.product.transactions
                      const totalInvested = txs.reduce((sum, t) => sum + Math.abs(t.total), 0)

                      return (
                        <div
                          key={selection.product.isin}
                          className={`border-2 rounded-lg p-4 transition-all ${
                            selection.selected
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={selection.selected}
                              onChange={() => toggleSelected(selection.product.isin)}
                              className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 dark:text-white truncate">
                                {selection.product.product}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {selection.product.isin}
                                {selection.product.exchange && ` · ${selection.product.exchange}`}
                                {` · ${txs.length} transactie${txs.length !== 1 ? 's' : ''}`}
                                {` · ${formatEuro(totalInvested)} omzet`}
                              </div>
                              {selection.selected && (
                                <div className="mt-2">
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Ticker
                                  </label>
                                  <input
                                    type="text"
                                    value={selection.ticker}
                                    onChange={(e) =>
                                      updateTicker(selection.product.isin, e.target.value)
                                    }
                                    placeholder="Bijv. ASML.AS of VWRL.AS"
                                    className="w-48 px-2 py-1 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                                  />
                                </div>
                              )}
                            </div>
                            <div className="text-right text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                              {formatNumber(
                                txs.reduce((sum, t) => sum + t.quantity, 0),
                                2
                              )}{' '}
                              stuks
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {importError && (
                    <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg text-sm">
                      {importError}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={onClose}
                      disabled={isImporting}
                      className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                      Annuleren
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={isImporting || selectedCount === 0}
                      className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
                    >
                      {isImporting
                        ? 'Importeren...'
                        : `Importeer ${totalTransactions} transactie${totalTransactions !== 1 ? 's' : ''}`}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
