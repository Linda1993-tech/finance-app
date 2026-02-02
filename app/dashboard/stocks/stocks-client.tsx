'use client'

import { useState, useEffect } from 'react'
import type { Stock, StockTransaction } from '@/lib/types/database'
import { formatEuro, formatNumber } from '@/lib/utils/currency-format'
import { AddStockForm } from './add-stock-form'
import { AddTransactionForm } from './add-transaction-form'
import { HoldingCard } from './holding-card'
import { HoldingsTable } from './holdings-table'
import { fetchStockPrices } from './actions'

type Props = {
  initialStocks: Stock[]
  initialTransactions: StockTransaction[]
}

export function StocksClient({ initialStocks, initialTransactions }: Props) {
  const [showAddStock, setShowAddStock] = useState(false)
  const [showAddTransaction, setShowAddTransaction] = useState(false)
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({})
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table') // Default to table view

  // Fetch live prices on mount
  const fetchPrices = async () => {
    if (initialStocks.length === 0) return
    
    setIsRefreshing(true)
    
    try {
      const tickers = initialStocks.map((s) => s.ticker)
      console.log('Fetching prices for tickers:', tickers)
      const prices = await fetchStockPrices(tickers)
      console.log('Received prices:', prices)
      setCurrentPrices(prices)
      
      // Show alert if no prices were fetched
      if (Object.keys(prices).length === 0 && tickers.length > 0) {
        alert('⚠️ Koersen niet gevonden. Zorg dat je de juiste ticker gebruikt (bijv. AGN.AS voor Aegon Amsterdam)')
      }
    } catch (error) {
      console.error('Error fetching stock prices:', error)
      alert('❌ Fout bij ophalen koersen. Check de console voor details.')
    } finally {
      setIsRefreshing(false)
    }
  }

  // Fetch prices on mount
  useEffect(() => {
    fetchPrices()
  }, [])

  // Calculate portfolio stats
  const totalValue = initialStocks.reduce((sum, stock) => {
    const currentPrice = currentPrices[stock.ticker] || stock.average_cost
    return sum + (stock.quantity * currentPrice)
  }, 0)

  const totalCost = initialStocks.reduce((sum, stock) => {
    return sum + (stock.quantity * stock.average_cost)
  }, 0)

  const totalGainLoss = totalValue - totalCost
  const totalGainLossPercentage = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                📈 Stocks Portfolio (DeGiro)
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Track your investments and performance
              </p>
            </div>
            <a
              href="/dashboard"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors text-sm font-medium"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
            <div className="text-sm opacity-90 font-medium">Portfolio Value</div>
            <div className="text-3xl font-bold mt-2">{formatEuro(totalValue)}</div>
            <div className="text-xs opacity-75 mt-1">Current market value</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg p-6 text-white">
            <div className="text-sm opacity-90 font-medium">Total Invested</div>
            <div className="text-3xl font-bold mt-2">{formatEuro(totalCost)}</div>
            <div className="text-xs opacity-75 mt-1">Cost basis</div>
          </div>

          <div className={`bg-gradient-to-br ${
            totalGainLoss >= 0 
              ? 'from-green-500 to-emerald-600' 
              : 'from-red-500 to-rose-600'
          } rounded-xl shadow-lg p-6 text-white`}>
            <div className="text-sm opacity-90 font-medium">Total Gain/Loss</div>
            <div className="text-3xl font-bold mt-2">
              {totalGainLoss >= 0 ? '+' : ''}{formatEuro(totalGainLoss)}
            </div>
            <div className="text-xs opacity-75 mt-1">Unrealized</div>
          </div>

          <div className={`bg-gradient-to-br ${
            totalGainLossPercentage >= 0 
              ? 'from-green-500 to-emerald-600' 
              : 'from-red-500 to-rose-600'
          } rounded-xl shadow-lg p-6 text-white`}>
            <div className="text-sm opacity-90 font-medium">Return %</div>
            <div className="text-3xl font-bold mt-2">
              {totalGainLossPercentage >= 0 ? '+' : ''}{formatNumber(totalGainLossPercentage)}%
            </div>
            <div className="text-xs opacity-75 mt-1">Since inception</div>
          </div>
        </div>

        {/* Ticker Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>💡 Tip:</strong> Gebruik de juiste ticker met beurs suffix:
            <span className="ml-2 font-mono">ASML.AS (Amsterdam), AAPL (US), AIR.PA (Parijs)</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddTransaction(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
            >
              <span className="text-lg">💰</span> Add Transaction
            </button>
            <button
              onClick={fetchPrices}
              disabled={isRefreshing}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-lg">{isRefreshing ? '⏳' : '🔄'}</span> 
              {isRefreshing ? 'Refreshing...' : 'Refresh Prices'}
            </button>
            <button
              onClick={() => setShowAddStock(true)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
            >
              <span className="text-lg">✏️</span> Manual Entry
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2 bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              📊 Tabel
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              🎴 Cards
            </button>
          </div>
        </div>

        {/* Holdings */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Your Holdings ({initialStocks.length})
          </h2>
          {initialStocks.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No stocks yet. Add your first position to start tracking!
              </p>
              <button
                onClick={() => setShowAddTransaction(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Add Your First Transaction
              </button>
            </div>
          ) : viewMode === 'table' ? (
            <HoldingsTable
              stocks={initialStocks}
              currentPrices={currentPrices}
              onUpdatePrice={(ticker, price) => {
                setCurrentPrices({ ...currentPrices, [ticker]: price })
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {initialStocks.map((stock) => (
                <HoldingCard
                  key={stock.id}
                  stock={stock}
                  currentPrice={currentPrices[stock.ticker] || stock.average_cost}
                  onUpdatePrice={(ticker, price) => {
                    setCurrentPrices({ ...currentPrices, [ticker]: price })
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Recent Transactions
          </h2>
          {initialTransactions.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-600 dark:text-gray-400">
              No transactions yet
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Ticker
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {initialTransactions.slice(0, 10).map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {new Date(tx.transaction_date).toLocaleDateString('nl-NL')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          tx.transaction_type === 'buy' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                          tx.transaction_type === 'sell' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                        }`}>
                          {tx.transaction_type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {tx.ticker}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                        {tx.quantity ? formatNumber(tx.quantity, 4) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                        {tx.price_per_share ? formatEuro(tx.price_per_share) : '-'}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                        tx.total_amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {tx.total_amount >= 0 ? '+' : ''}{formatEuro(tx.total_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showAddStock && (
        <AddStockForm onClose={() => setShowAddStock(false)} />
      )}
      {showAddTransaction && (
        <AddTransactionForm onClose={() => setShowAddTransaction(false)} />
      )}
    </div>
  )
}
