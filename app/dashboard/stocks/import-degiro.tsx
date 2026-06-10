'use client'

import { useState } from 'react'
import {
  parseDeGiroCSV,
  parseDeGiroPortfolioCSV,
  type DeGiroProduct,
  type DeGiroHolding,
} from '@/lib/parsers/degiro-parser'
import {
  importDeGiroTransactions,
  importDeGiroPortfolio,
  type DeGiroImportItem,
  type DeGiroPortfolioImportItem,
} from './actions'
import { formatEuro, formatNumber } from '@/lib/utils/currency-format'

type Props = {
  onClose: () => void
}

type ProductSelection = {
  product: DeGiroProduct
  ticker: string
  selected: boolean
}

type HoldingSelection = {
  holding: DeGiroHolding
  ticker: string
  averageCost: string // editable text input
  selected: boolean
}

export function ImportDeGiro({ onClose }: Props) {
  const [mode, setMode] = useState<'transactions' | 'portfolio' | null>(null)
  const [selections, setSelections] = useState<ProductSelection[]>([])
  const [holdingSelections, setHoldingSelections] = useState<HoldingSelection[]>([])
  const [parseError, setParseError] = useState('')
  const [importError, setImportError] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [result, setResult] = useState<{ imported: number; duplicates: number } | null>(null)

  async function handleFile(file: File) {
    setParseError('')
    setSelections([])
    setHoldingSelections([])
    setMode(null)

    const content = await file.text()

    // Try the Transactions export first, then the Portfolio export
    const txResult = parseDeGiroCSV(content)
    if (txResult.success && txResult.products) {
      setMode('transactions')
      setSelections(
        txResult.products.map((product) => ({
          product,
          ticker: product.suggestedTicker,
          selected: true,
        }))
      )
      return
    }

    const portfolioResult = parseDeGiroPortfolioCSV(content)
    if (portfolioResult.success && portfolioResult.holdings) {
      setMode('portfolio')
      setHoldingSelections(
        portfolioResult.holdings.map((holding) => ({
          holding,
          ticker: holding.suggestedTicker,
          averageCost: holding.closingPrice ? String(holding.closingPrice) : '',
          selected: true,
        }))
      )
      return
    }

    setParseError(
      txResult.error || portfolioResult.error || 'Kon bestand niet lezen'
    )
  }

  async function handleImportTransactions() {
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

  async function handleImportPortfolio() {
    const selected = holdingSelections.filter((s) => s.selected)
    if (selected.length === 0) return

    const missingTicker = selected.find((s) => !s.ticker.trim())
    if (missingTicker) {
      setImportError(`Vul een ticker in voor "${missingTicker.holding.product}"`)
      return
    }

    setIsImporting(true)
    setImportError('')

    const items: DeGiroPortfolioImportItem[] = selected.map((s) => {
      const avgCost = parseFloat(s.averageCost.replace(',', '.')) || s.holding.closingPrice
      return {
        ticker: s.ticker.trim().toUpperCase(),
        name: s.holding.product,
        quantity: s.holding.quantity,
        averageCost: avgCost,
        currentPrice: s.holding.closingPrice || null,
      }
    })

    const importResult = await importDeGiroPortfolio(items)

    if (importResult.success) {
      setResult({
        imported: importResult.imported || 0,
        duplicates: 0,
      })
    } else {
      setImportError(importResult.error || 'Import mislukt')
      setIsImporting(false)
    }
  }

  const selectedTxCount = selections.filter((s) => s.selected).length
  const totalTransactions = selections
    .filter((s) => s.selected)
    .reduce((sum, s) => sum + s.product.transactions.length, 0)
  const selectedHoldingCount = holdingSelections.filter((s) => s.selected).length

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              📥 DeGiro import
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Upload een DeGiro-export: Transacties (historie) of Portfolio (huidige posities)
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
                {mode === 'portfolio'
                  ? `${result.imported} positie${result.imported !== 1 ? 's' : ''} geïmporteerd`
                  : `${result.imported} transactie${result.imported !== 1 ? 's' : ''} geïmporteerd`}
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
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-200 space-y-2">
                <p>
                  <strong>📊 Portfolio-export</strong> (huidige posities): DeGiro →
                  Portfolio → Export → CSV. Snelste manier om je posities in te laden.
                </p>
                <p>
                  <strong>📜 Transacties-export</strong> (volledige historie): DeGiro →
                  Inbox → Transacties → periode kiezen → Export → CSV. Berekent ook je
                  gemiddelde aankoopprijs.
                </p>
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

              {/* ============ PORTFOLIO REVIEW ============ */}
              {mode === 'portfolio' && holdingSelections.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      📊 Portfolio-export: {holdingSelections.length} positie
                      {holdingSelections.length !== 1 ? 's' : ''} gevonden
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Controleer de tickers (Yahoo-formaat, bijv. ASML.AS). De aankoopprijs
                    staat niet in deze export — we hebben de slotkoers ingevuld; pas aan
                    als je je echte gemiddelde aankoopprijs weet.
                  </p>

                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {holdingSelections.map((selection) => (
                      <div
                        key={selection.holding.product + selection.holding.symbolOrIsin}
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
                            onChange={() =>
                              setHoldingSelections((prev) =>
                                prev.map((s) =>
                                  s.holding === selection.holding
                                    ? { ...s, selected: !s.selected }
                                    : s
                                )
                              )
                            }
                            className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 dark:text-white truncate">
                              {selection.holding.product}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {selection.holding.symbolOrIsin}
                              {` · ${formatNumber(selection.holding.quantity, 2)} stuks`}
                              {selection.holding.valueEur > 0 &&
                                ` · ${formatEuro(selection.holding.valueEur)}`}
                            </div>
                            {selection.selected && (
                              <div className="mt-2 flex gap-4">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Ticker
                                  </label>
                                  <input
                                    type="text"
                                    value={selection.ticker}
                                    onChange={(e) =>
                                      setHoldingSelections((prev) =>
                                        prev.map((s) =>
                                          s.holding === selection.holding
                                            ? { ...s, ticker: e.target.value }
                                            : s
                                        )
                                      )
                                    }
                                    placeholder="Bijv. ASML.AS"
                                    className="w-40 px-2 py-1 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Gem. aankoopprijs
                                  </label>
                                  <input
                                    type="text"
                                    value={selection.averageCost}
                                    onChange={(e) =>
                                      setHoldingSelections((prev) =>
                                        prev.map((s) =>
                                          s.holding === selection.holding
                                            ? { ...s, averageCost: e.target.value }
                                            : s
                                        )
                                      )
                                    }
                                    placeholder="Bijv. 85,50"
                                    className="w-32 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
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
                      onClick={handleImportPortfolio}
                      disabled={isImporting || selectedHoldingCount === 0}
                      className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
                    >
                      {isImporting
                        ? 'Importeren...'
                        : `Importeer ${selectedHoldingCount} positie${selectedHoldingCount !== 1 ? 's' : ''}`}
                    </button>
                  </div>
                </>
              )}

              {/* ============ TRANSACTIONS REVIEW ============ */}
              {mode === 'transactions' && selections.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      📜 Transacties-export: {selections.length} product
                      {selections.length !== 1 ? 'en' : ''} gevonden
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
                              onChange={() =>
                                setSelections((prev) =>
                                  prev.map((s) =>
                                    s.product.isin === selection.product.isin
                                      ? { ...s, selected: !s.selected }
                                      : s
                                  )
                                )
                              }
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
                                      setSelections((prev) =>
                                        prev.map((s) =>
                                          s.product.isin === selection.product.isin
                                            ? { ...s, ticker: e.target.value }
                                            : s
                                        )
                                      )
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
                      onClick={handleImportTransactions}
                      disabled={isImporting || selectedTxCount === 0}
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
