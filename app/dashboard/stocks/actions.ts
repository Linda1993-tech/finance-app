'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Stock, StockTransaction } from '@/lib/types/database'
import { formatTickerForYahoo } from '@/lib/utils/ticker-formatter'

// ============== STOCKS (Holdings) ==============

export async function getStocks() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('stocks')
    .select('*')
    .eq('user_id', user.id)
    .order('ticker')

  if (error) {
    console.error('Error fetching stocks:', error)
    throw new Error('Failed to fetch stocks')
  }
  return data as Stock[]
}

export async function createStock(
  ticker: string,
  name: string,
  quantity: number,
  averageCost: number,
  currency: string,
  notes: string | null
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('stocks').insert({
    user_id: user.id,
    ticker: ticker.toUpperCase(),
    name,
    quantity,
    average_cost: averageCost,
    currency,
    notes,
  })

  if (error) {
    console.error('Error creating stock:', error)
    return { success: false, error: error.message }
  }
  revalidatePath('/dashboard/stocks')
  return { success: true }
}

export async function updateStock(
  id: string,
  quantity: number,
  averageCost: number
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('stocks')
    .update({
      quantity,
      average_cost: averageCost,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error updating stock:', error)
    return { success: false, error: error.message }
  }
  revalidatePath('/dashboard/stocks')
  return { success: true }
}

export async function updateStockName(
  id: string,
  name: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('stocks')
    .update({
      name,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error updating stock name:', error)
    return { success: false, error: error.message }
  }
  revalidatePath('/dashboard/stocks')
  return { success: true }
}

export async function updateStockPrice(
  ticker: string,
  price: number,
  currency: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('stocks')
    .update({
      current_price: price,
      currency: currency,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .eq('ticker', ticker)

  if (error) {
    console.error('Error updating stock price:', error)
    return { error: error.message }
  }
  
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/stocks')
}

export async function deleteStock(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('stocks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting stock:', error)
    return { success: false, error: error.message }
  }
  revalidatePath('/dashboard/stocks')
  return { success: true }
}

// ============== STOCK TRANSACTIONS ==============

export async function getStockTransactions() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('stock_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('transaction_date', { ascending: false })

  if (error) {
    console.error('Error fetching stock transactions:', error)
    throw new Error('Failed to fetch stock transactions')
  }
  return data as StockTransaction[]
}

export async function createStockTransaction(
  transactionDate: string,
  transactionType: 'buy' | 'sell' | 'dividend',
  ticker: string,
  quantity: number | null,
  pricePerShare: number | null,
  totalAmount: number,
  fees: number,
  currency: string,
  notes: string | null
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Insert transaction
  const { error: txError } = await supabase.from('stock_transactions').insert({
    user_id: user.id,
    transaction_date: transactionDate,
    transaction_type: transactionType,
    ticker: ticker.toUpperCase(),
    quantity,
    price_per_share: pricePerShare,
    total_amount: totalAmount,
    fees,
    currency,
    notes,
  })

  if (txError) {
    console.error('Error creating stock transaction:', txError)
    return { success: false, error: txError.message }
  }

  // Update stock position if buy/sell
  if (transactionType === 'buy' || transactionType === 'sell') {
    await updateStockPosition(ticker.toUpperCase(), transactionType, quantity!, pricePerShare!, fees)
  }

  revalidatePath('/dashboard/stocks')
  return { success: true }
}

// Helper function to update stock position
async function updateStockPosition(
  ticker: string,
  transactionType: 'buy' | 'sell',
  quantity: number,
  pricePerShare: number,
  fees: number
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get current stock position
  const { data: stock } = await supabase
    .from('stocks')
    .select('*')
    .eq('user_id', user.id)
    .eq('ticker', ticker)
    .single()

  if (transactionType === 'buy') {
    // Get current exchange rate
    const { getCurrentExchangeRate } = await import('@/lib/utils/currency-converter')
    const currentRate = getCurrentExchangeRate('USD') // Default, will be updated based on actual currency
    
    if (stock) {
      // Update existing position
      const newQuantity = stock.quantity + quantity
      const totalCost = (stock.quantity * stock.average_cost) + (quantity * pricePerShare) + fees
      const newAverageCost = totalCost / newQuantity
      
      // Calculate weighted average exchange rate
      const oldWeight = stock.quantity * stock.average_cost
      const newWeight = quantity * pricePerShare + fees
      const totalWeight = oldWeight + newWeight
      const oldRate = stock.exchange_rate_at_purchase || currentRate
      const newExchangeRate = ((oldWeight * oldRate) + (newWeight * currentRate)) / totalWeight

      await supabase
        .from('stocks')
        .update({
          quantity: newQuantity,
          average_cost: newAverageCost,
          exchange_rate_at_purchase: newExchangeRate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', stock.id)
    } else {
      // Get currency from transaction (need to pass it)
      // For now, determine from ticker or default to EUR
      const stockCurrency = ticker.endsWith('.AS') || ticker.endsWith('.PA') ? 'EUR' : 'USD'
      const exchangeRate = getCurrentExchangeRate(stockCurrency)
      
      // Create new position
      await supabase.from('stocks').insert({
        user_id: user.id,
        ticker,
        name: ticker, // Default to ticker, user can update later
        quantity,
        average_cost: (quantity * pricePerShare + fees) / quantity,
        currency: stockCurrency,
        exchange_rate_at_purchase: exchangeRate,
      })
    }
  } else if (transactionType === 'sell' && stock) {
    // Reduce position
    const newQuantity = stock.quantity - quantity
    if (newQuantity <= 0) {
      // Delete position if fully sold
      await supabase.from('stocks').delete().eq('id', stock.id)
    } else {
      // Update quantity (keep same average cost)
      await supabase
        .from('stocks')
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', stock.id)
    }
  }
}

// ============== DEGIRO IMPORT ==============

export type DeGiroImportItem = {
  ticker: string
  name: string
  currency: string
  transactions: {
    date: string
    quantity: number // positive = buy, negative = sell
    price: number
    fees: number
    total: number
    orderId: string | null
  }[]
}

export type DeGiroImportResult = {
  success: boolean
  imported?: number
  duplicates?: number
  error?: string
}

export async function importDeGiroTransactions(
  items: DeGiroImportItem[]
): Promise<DeGiroImportResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  let imported = 0
  let duplicates = 0

  for (const item of items) {
    const ticker = item.ticker.trim().toUpperCase()
    if (!ticker) continue

    // Existing transactions for dedup (match on DeGiro order id in notes,
    // or on date + quantity + total for rows without an order id)
    const { data: existing } = await supabase
      .from('stock_transactions')
      .select('transaction_date, quantity, total_amount, notes')
      .eq('user_id', user.id)
      .eq('ticker', ticker)

    const existingOrderIds = new Set(
      (existing || [])
        .map((t) => t.notes?.match(/DeGiro:(\S+)/)?.[1])
        .filter(Boolean)
    )
    const existingKeys = new Set(
      (existing || []).map(
        (t) => `${t.transaction_date}|${t.quantity}|${t.total_amount}`
      )
    )

    const rows = []
    for (const tx of item.transactions) {
      const isDuplicate = tx.orderId
        ? existingOrderIds.has(tx.orderId)
        : existingKeys.has(`${tx.date}|${Math.abs(tx.quantity)}|${tx.total}`)

      if (isDuplicate) {
        duplicates++
        continue
      }

      rows.push({
        user_id: user.id,
        transaction_date: tx.date,
        transaction_type: tx.quantity >= 0 ? ('buy' as const) : ('sell' as const),
        ticker,
        quantity: Math.abs(tx.quantity),
        price_per_share: tx.price,
        total_amount: tx.total,
        fees: tx.fees,
        currency: item.currency,
        notes: tx.orderId ? `DeGiro:${tx.orderId}` : 'DeGiro import',
      })
    }

    if (rows.length > 0) {
      const { error } = await supabase.from('stock_transactions').insert(rows)
      if (error) {
        console.error('Error importing DeGiro transactions:', error)
        return { success: false, error: `Import mislukt voor ${ticker}: ${error.message}` }
      }
      imported += rows.length
    }

    await rebuildStockPosition(user.id, ticker, item.name, item.currency)
  }

  revalidatePath('/dashboard/stocks')
  revalidatePath('/dashboard')
  return { success: true, imported, duplicates }
}

/** Best-guess currency from a Yahoo ticker suffix */
function tickerCurrency(ticker: string): string {
  const suffixMap: Record<string, string> = {
    '.AS': 'EUR', '.PA': 'EUR', '.BR': 'EUR', '.DE': 'EUR', '.F': 'EUR',
    '.MC': 'EUR', '.MI': 'EUR', '.LS': 'EUR',
    '.L': 'GBP', '.SW': 'CHF', '.ST': 'SEK', '.CO': 'DKK', '.OL': 'NOK', '.TO': 'CAD',
  }
  const dotIndex = ticker.lastIndexOf('.')
  if (dotIndex === -1) return 'USD' // No suffix = US exchange
  return suffixMap[ticker.substring(dotIndex)] ?? 'EUR'
}

export type DeGiroPortfolioImportItem = {
  ticker: string
  name: string
  quantity: number
  averageCost: number
  currentPrice: number | null
}

export async function importDeGiroPortfolio(
  items: DeGiroPortfolioImportItem[]
): Promise<DeGiroImportResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  let imported = 0

  for (const item of items) {
    const ticker = item.ticker.trim().toUpperCase()
    if (!ticker || item.quantity <= 0) continue

    const currency = tickerCurrency(ticker)

    const { data: existing } = await supabase
      .from('stocks')
      .select('id')
      .eq('user_id', user.id)
      .eq('ticker', ticker)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from('stocks')
        .update({
          quantity: item.quantity,
          average_cost: item.averageCost,
          current_price: item.currentPrice,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)

      if (error) {
        console.error('Error updating holding:', error)
        return { success: false, error: `Import mislukt voor ${ticker}: ${error.message}` }
      }
    } else {
      const { error } = await supabase.from('stocks').insert({
        user_id: user.id,
        ticker,
        name: item.name || ticker,
        quantity: item.quantity,
        average_cost: item.averageCost,
        current_price: item.currentPrice,
        currency,
      })

      if (error) {
        console.error('Error inserting holding:', error)
        return { success: false, error: `Import mislukt voor ${ticker}: ${error.message}` }
      }
    }

    imported++
  }

  revalidatePath('/dashboard/stocks')
  revalidatePath('/dashboard')
  return { success: true, imported, duplicates: 0 }
}

/**
 * Rebuild a stock position from all its buy/sell transactions (chronological,
 * average cost method). Used after bulk imports.
 */
async function rebuildStockPosition(
  userId: string,
  ticker: string,
  name: string,
  currency: string
) {
  const supabase = await createClient()

  const { data: transactions } = await supabase
    .from('stock_transactions')
    .select('transaction_date, transaction_type, quantity, price_per_share, fees')
    .eq('user_id', userId)
    .eq('ticker', ticker)
    .in('transaction_type', ['buy', 'sell'])
    .order('transaction_date', { ascending: true })

  let quantity = 0
  let totalCost = 0

  for (const tx of transactions || []) {
    const q = tx.quantity || 0
    if (tx.transaction_type === 'buy') {
      quantity += q
      totalCost += q * (tx.price_per_share || 0) + (tx.fees || 0)
    } else {
      const avgCost = quantity > 0 ? totalCost / quantity : 0
      totalCost -= q * avgCost
      quantity -= q
    }
  }

  const { data: stock } = await supabase
    .from('stocks')
    .select('id, name')
    .eq('user_id', userId)
    .eq('ticker', ticker)
    .maybeSingle()

  if (quantity <= 0) {
    if (stock) {
      await supabase.from('stocks').delete().eq('id', stock.id)
    }
    return
  }

  const averageCost = totalCost / quantity

  if (stock) {
    await supabase
      .from('stocks')
      .update({
        quantity,
        average_cost: averageCost,
        updated_at: new Date().toISOString(),
      })
      .eq('id', stock.id)
  } else {
    await supabase.from('stocks').insert({
      user_id: userId,
      ticker,
      name: name || ticker,
      quantity,
      average_cost: averageCost,
      currency,
    })
  }
}

// ============== PORTFOLIO STATS ==============

export type PortfolioStats = {
  totalValue: number
  totalCost: number
  totalGainLoss: number
  totalGainLossPercentage: number
}

export async function calculatePortfolioStats(currentPrices: Record<string, number>): Promise<PortfolioStats> {
  const stocks = await getStocks()
  
  let totalValue = 0
  let totalCost = 0

  for (const stock of stocks) {
    const currentPrice = currentPrices[stock.ticker] || stock.average_cost
    totalValue += stock.quantity * currentPrice
    totalCost += stock.quantity * stock.average_cost
  }

  const totalGainLoss = totalValue - totalCost
  const totalGainLossPercentage = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0

  return {
    totalValue,
    totalCost,
    totalGainLoss,
    totalGainLossPercentage,
  }
}

// ============== STOCK PRICES ==============

// Import StockQuote type from multi-API
import type { StockQuote } from '@/lib/utils/multi-stock-api'
export type { StockQuote } from '@/lib/utils/multi-stock-api'

export async function fetchStockPrices(tickers: string[]): Promise<Record<string, number>> {
  const prices: Record<string, number> = {}

  for (const ticker of tickers) {
    try {
      const response = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          next: { revalidate: 300 }, // Cache for 5 minutes
        }
      )

      if (response.ok) {
        const data = await response.json()
        const result = data.chart?.result?.[0]

        if (result?.meta) {
          const currentPrice = result.meta.regularMarketPrice || result.meta.previousClose
          if (currentPrice) {
            prices[ticker] = currentPrice
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching price for ${ticker}:`, error)
    }
  }

  return prices
}

export async function fetchStockQuotes(tickers: string[]): Promise<Record<string, StockQuote>> {
  // Use the new multi-API stock fetcher which automatically selects the best source
  const { fetchMultipleStockQuotes } = await import('@/lib/utils/multi-stock-api')
  const quotes = await fetchMultipleStockQuotes(tickers)
  
  // Log which sources were used
  const sourceCounts = Object.values(quotes).reduce((acc, q) => {
    acc[q.source] = (acc[q.source] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  console.log(`📊 Fetched ${Object.keys(quotes).length} quotes from:`, sourceCounts)
  
  return quotes
}
