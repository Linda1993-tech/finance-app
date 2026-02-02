'use client'

import { useState } from 'react'
import type { Stock } from '@/lib/types/database'
import { formatEuro, formatNumber } from '@/lib/utils/currency-format'
import { getDisplayTicker } from '@/lib/utils/ticker-formatter'
import { deleteStock } from './actions'

type Props = {
  stocks: Stock[]
  currentPrices: Record<string, number>
  onUpdatePrice: (ticker: string, price: number) => void
}

export function HoldingsTable({ stocks, currentPrices, onUpdatePrice }: Props) {
  const [editingPrice, setEditingPrice] = useState<string | null>(null)
  const [newPrice, setNewPrice] = useState('')

  const handleUpdatePrice = (ticker: string) => {
    const price = parseFloat(newPrice)
    if (!isNaN(price) && price > 0) {
      onUpdatePrice(ticker, price)
      setEditingPrice(null)
      setNewPrice('')
    }
  }

  const handleDelete = async (id: string, ticker: string) => {
    if (!confirm(`Weet je zeker dat je ${ticker} wilt verwijderen?`)) return
    const result = await deleteStock(id)
    if (!result.success) {
      alert(`Error: ${result.error}`)
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Aandeel
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Aantal
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Ø Koers
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Huidige Koers
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Waarde
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Kostprijs
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              W/V
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              W/V %
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {stocks.map((stock) => {
            const currentPrice = currentPrices[stock.ticker] || stock.average_cost
            const marketValue = stock.quantity * currentPrice
            const costBasis = stock.quantity * stock.average_cost
            const gainLoss = marketValue - costBasis
            const gainLossPercentage = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0

            return (
              <tr key={stock.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                {/* Aandeel */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {getDisplayTicker(stock.ticker)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {stock.name}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Aantal */}
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                  {stock.quantity % 1 === 0 ? stock.quantity.toFixed(0) : formatNumber(stock.quantity, 2)}
                </td>

                {/* Ø Koers */}
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                  {formatEuro(stock.average_cost)}
                </td>

                {/* Huidige Koers */}
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                  {editingPrice === stock.ticker ? (
                    <div className="flex items-center justify-end gap-1">
                      <input
                        type="number"
                        step="0.01"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        className="w-20 px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                        autoFocus
                      />
                      <button
                        onClick={() => handleUpdatePrice(stock.ticker)}
                        className="px-1 py-0.5 bg-green-600 text-white rounded text-xs"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => {
                          setEditingPrice(null)
                          setNewPrice('')
                        }}
                        className="px-1 py-0.5 bg-gray-600 text-white rounded text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingPrice(stock.ticker)
                        setNewPrice(currentPrice.toString())
                      }}
                      className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {formatEuro(currentPrice)} 📝
                    </button>
                  )}
                </td>

                {/* Waarde */}
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900 dark:text-white">
                  {formatEuro(marketValue)}
                </td>

                {/* Kostprijs */}
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-600 dark:text-gray-400">
                  {formatEuro(costBasis)}
                </td>

                {/* W/V */}
                <td className={`px-4 py-3 whitespace-nowrap text-right text-sm font-medium ${
                  gainLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {gainLoss >= 0 ? '+' : ''}{formatEuro(gainLoss)}
                </td>

                {/* W/V % */}
                <td className={`px-4 py-3 whitespace-nowrap text-right text-sm font-bold ${
                  gainLossPercentage >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {gainLossPercentage >= 0 ? '+' : ''}{formatNumber(gainLossPercentage)}%
                </td>

                {/* Actions */}
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                  <button
                    onClick={() => handleDelete(stock.id, stock.ticker)}
                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
