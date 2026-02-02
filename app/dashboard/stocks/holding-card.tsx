'use client'

import { useState, useEffect } from 'react'
import type { Stock, StockTransaction } from '@/lib/types/database'
import { formatEuro, formatNumber } from '@/lib/utils/currency-format'
import { deleteStock, getStockTransactions } from './actions'

type Props = {
  stock: Stock
  currentPrice: number
  onUpdatePrice: (ticker: string, price: number) => void
}

export function HoldingCard({ stock, currentPrice, onUpdatePrice }: Props) {
  const [isEditingPrice, setIsEditingPrice] = useState(false)
  const [newPrice, setNewPrice] = useState(currentPrice.toString())
  const [isDeleting, setIsDeleting] = useState(false)
  const [showTransactions, setShowTransactions] = useState(false)
  const [transactions, setTransactions] = useState<StockTransaction[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)

  // Fetch transactions for this stock
  useEffect(() => {
    async function fetchTransactions() {
      if (!showTransactions) return
      setIsLoadingTransactions(true)
      try {
        const allTransactions = await getStockTransactions()
        const stockTransactions = allTransactions.filter(
          (tx) => tx.ticker === stock.ticker
        )
        setTransactions(stockTransactions)
      } catch (error) {
        console.error('Error fetching transactions:', error)
      } finally {
        setIsLoadingTransactions(false)
      }
    }
    fetchTransactions()
  }, [showTransactions, stock.ticker])

  const marketValue = stock.quantity * currentPrice
  const costBasis = stock.quantity * stock.average_cost
  const gainLoss = marketValue - costBasis
  const gainLossPercentage = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0

  const handleUpdatePrice = () => {
    const price = parseFloat(newPrice)
    if (!isNaN(price) && price > 0) {
      onUpdatePrice(stock.ticker, price)
      setIsEditingPrice(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${stock.ticker}?`)) return
    setIsDeleting(true)
    const result = await deleteStock(stock.id)
    if (!result.success) {
      alert(`Error: ${result.error}`)
      setIsDeleting(false)
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 relative">
      {/* Delete button */}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="absolute top-4 right-4 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
      >
        🗑️
      </button>

      {/* Ticker & Name */}
      <div className="mb-4">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
          {stock.ticker}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{stock.name}</p>
      </div>

      {/* Current Price */}
      <div className="mb-4">
        {isEditingPrice ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
              autoFocus
            />
            <button
              onClick={handleUpdatePrice}
              className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
            >
              ✓
            </button>
            <button
              onClick={() => {
                setNewPrice(currentPrice.toString())
                setIsEditingPrice(false)
              }}
              className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditingPrice(true)}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
          >
            Current: {formatEuro(currentPrice)} 📝
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Shares:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {formatNumber(stock.quantity, 4)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Avg Cost:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {formatEuro(stock.average_cost)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Market Value:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {formatEuro(marketValue)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Cost Basis:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {formatEuro(costBasis)}
          </span>
        </div>
      </div>

      {/* Gain/Loss */}
      <div className={`p-3 rounded-lg ${
        gainLoss >= 0 
          ? 'bg-green-50 dark:bg-green-900/20' 
          : 'bg-red-50 dark:bg-red-900/20'
      }`}>
        <div className="flex justify-between items-center">
          <span className={`text-sm font-medium ${
            gainLoss >= 0 
              ? 'text-green-700 dark:text-green-400' 
              : 'text-red-700 dark:text-red-400'
          }`}>
            {gainLoss >= 0 ? '▲' : '▼'} {gainLoss >= 0 ? '+' : ''}{formatEuro(gainLoss)}
          </span>
          <span className={`text-sm font-medium ${
            gainLoss >= 0 
              ? 'text-green-700 dark:text-green-400' 
              : 'text-red-700 dark:text-red-400'
          }`}>
            {gainLossPercentage >= 0 ? '+' : ''}{formatNumber(gainLossPercentage)}%
          </span>
        </div>
      </div>

      {stock.notes && (
        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 italic">
          {stock.notes}
        </div>
      )}

      {/* Transaction History Toggle */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setShowTransactions(!showTransactions)}
          className="w-full text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-center gap-2"
        >
          {showTransactions ? '▼' : '▶'} Transaction History
        </button>
      </div>

      {/* Transactions List */}
      {showTransactions && (
        <div className="mt-3 space-y-2">
          {isLoadingTransactions ? (
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
              Loading...
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
              No transactions yet
            </div>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between text-xs p-2 bg-gray-50 dark:bg-gray-700/50 rounded"
              >
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    tx.transaction_type === 'buy' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                    tx.transaction_type === 'sell' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                    'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                  }`}>
                    {tx.transaction_type.toUpperCase()}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {new Date(tx.transaction_date).toLocaleDateString('nl-NL')}
                  </span>
                </div>
                <div className="text-right">
                  {tx.quantity && (
                    <div className="text-gray-900 dark:text-white">
                      {formatNumber(tx.quantity, 2)} @ {formatEuro(tx.price_per_share!)}
                    </div>
                  )}
                  <div className={`font-medium ${
                    tx.total_amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {tx.total_amount >= 0 ? '+' : ''}{formatEuro(Math.abs(tx.total_amount))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
