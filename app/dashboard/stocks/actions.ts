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
    if (stock) {
      // Update existing position
      const newQuantity = stock.quantity + quantity
      const totalCost = (stock.quantity * stock.average_cost) + (quantity * pricePerShare) + fees
      const newAverageCost = totalCost / newQuantity

      await supabase
        .from('stocks')
        .update({
          quantity: newQuantity,
          average_cost: newAverageCost,
          updated_at: new Date().toISOString(),
        })
        .eq('id', stock.id)
    } else {
      // Create new position
      await supabase.from('stocks').insert({
        user_id: user.id,
        ticker,
        name: ticker, // Default to ticker, user can update later
        quantity,
        average_cost: (quantity * pricePerShare + fees) / quantity,
        currency: 'EUR',
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
