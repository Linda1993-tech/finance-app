/**
 * Multi-API Stock Price Fetcher
 * Uses different APIs based on market/ticker to get the best data
 * 
 * Supported APIs:
 * 1. Financial Modeling Prep (FMP) - Good for European stocks
 * 2. Yahoo Finance - Free, broad coverage
 * 3. Alpha Vantage - Alternative for US stocks (optional)
 */

export type StockQuote = {
  ticker: string
  price: number
  currency: string
  name: string
  change: number
  changePercent: number
  dividendYield?: number
  trailingAnnualDividend?: number
  source: 'fmp' | 'yahoo' | 'alphavantage' | 'cache'
}

// Configuration
const FMP_API_KEY = process.env.NEXT_PUBLIC_FMP_API_KEY
const ALPHA_VANTAGE_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY

// Cache to avoid hitting rate limits
const priceCache = new Map<string, { quote: StockQuote; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Determine which exchange a ticker belongs to
 */
function detectExchange(ticker: string): 'US' | 'EU' | 'UK' | 'UNKNOWN' {
  // Already has exchange suffix
  if (ticker.includes('.')) {
    const suffix = ticker.split('.')[1]
    if (suffix === 'AS' || suffix === 'PA' || suffix === 'DE' || suffix === 'MI') return 'EU'
    if (suffix === 'L' || suffix === 'LON') return 'UK'
  }
  
  // Common EU tickers without suffix
  const euTickers = ['ASML', 'INGA', 'PHIA', 'ADYEN', 'HEIA', 'AKZA', 'URW', 'KPN']
  if (euTickers.includes(ticker.toUpperCase())) return 'EU'
  
  // Default to US
  return 'US'
}

/**
 * Format ticker for specific API
 */
function formatTickerForAPI(ticker: string, api: 'fmp' | 'yahoo' | 'alphavantage'): string {
  // If already has suffix, use as-is
  if (ticker.includes('.')) return ticker
  
  const exchange = detectExchange(ticker)
  
  if (api === 'yahoo' || api === 'fmp') {
    // Both use same format for EU stocks
    if (exchange === 'EU') {
      // Common Dutch stocks -> Amsterdam
      return `${ticker}.AS`
    }
    if (exchange === 'UK') {
      return `${ticker}.L`
    }
  }
  
  return ticker // US stocks don't need suffix
}

/**
 * Fetch from Financial Modeling Prep (best for EU stocks)
 */
async function fetchFromFMP(ticker: string): Promise<StockQuote | null> {
  if (!FMP_API_KEY) {
    console.warn('FMP API key not configured')
    return null
  }

  try {
    const formattedTicker = formatTickerForAPI(ticker, 'fmp')
    const url = `https://financialmodelingprep.com/api/v3/quote/${formattedTicker}?apikey=${FMP_API_KEY}`
    
    const response = await fetch(url, { 
      next: { revalidate: 300 },
      headers: { 'User-Agent': 'WorthFlow/1.0' }
    })
    
    if (!response.ok) throw new Error(`FMP returned ${response.status}`)
    
    const data = await response.json()
    if (!Array.isArray(data) || data.length === 0) return null
    
    const quote = data[0]
    
    return {
      ticker: ticker,
      price: quote.price || 0,
      currency: 'EUR', // FMP doesn't always provide currency
      name: quote.name || ticker,
      change: quote.change || 0,
      changePercent: quote.changesPercentage || 0,
      dividendYield: quote.dividendYield || undefined,
      trailingAnnualDividend: quote.trailingAnnualDividend || undefined,
      source: 'fmp'
    }
  } catch (error) {
    console.error(`FMP error for ${ticker}:`, error)
    return null
  }
}

/**
 * Fetch from Yahoo Finance (free, broad coverage)
 */
async function fetchFromYahoo(ticker: string): Promise<StockQuote | null> {
  try {
    const formattedTicker = formatTickerForAPI(ticker, 'yahoo')
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${formattedTicker}`
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WorthFlow/1.0)' },
      next: { revalidate: 300 }
    })
    
    if (!response.ok) throw new Error(`Yahoo returned ${response.status}`)
    
    const data = await response.json()
    const result = data.chart?.result?.[0]
    
    if (!result) return null
    
    const meta = result.meta
    const currentPrice = meta.regularMarketPrice || meta.previousClose || 0
    const previousClose = meta.previousClose || currentPrice
    const change = currentPrice - previousClose
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0
    
    return {
      ticker: ticker,
      price: currentPrice,
      currency: meta.currency || 'EUR',
      name: meta.shortName || meta.symbol || ticker,
      change: change,
      changePercent: changePercent,
      source: 'yahoo'
    }
  } catch (error) {
    console.error(`Yahoo error for ${ticker}:`, error)
    return null
  }
}

/**
 * Fetch from Alpha Vantage (optional, good for US stocks)
 */
async function fetchFromAlphaVantage(ticker: string): Promise<StockQuote | null> {
  if (!ALPHA_VANTAGE_KEY) return null
  
  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${ALPHA_VANTAGE_KEY}`
    
    const response = await fetch(url, { next: { revalidate: 300 } })
    if (!response.ok) throw new Error(`Alpha Vantage returned ${response.status}`)
    
    const data = await response.json()
    const quote = data['Global Quote']
    
    if (!quote) return null
    
    const price = parseFloat(quote['05. price'] || '0')
    const change = parseFloat(quote['09. change'] || '0')
    const changePercent = parseFloat(quote['10. change percent']?.replace('%', '') || '0')
    
    return {
      ticker: ticker,
      price: price,
      currency: 'USD',
      name: ticker,
      change: change,
      changePercent: changePercent,
      source: 'alphavantage'
    }
  } catch (error) {
    console.error(`Alpha Vantage error for ${ticker}:`, error)
    return null
  }
}

/**
 * Main function: Try multiple APIs with smart routing
 */
export async function fetchStockQuote(ticker: string): Promise<StockQuote | null> {
  // Check cache first
  const cached = priceCache.get(ticker)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`💾 Using cached price for ${ticker}`)
    return { ...cached.quote, source: 'cache' }
  }
  
  const exchange = detectExchange(ticker)
  
  // Strategy 1: EU stocks -> Try FMP first, then Yahoo
  if (exchange === 'EU' || exchange === 'UK') {
    console.log(`🇪🇺 Fetching ${ticker} as European stock...`)
    
    // Try FMP first (best for EU)
    if (FMP_API_KEY) {
      const fmpQuote = await fetchFromFMP(ticker)
      if (fmpQuote && fmpQuote.price > 0) {
        priceCache.set(ticker, { quote: fmpQuote, timestamp: Date.now() })
        return fmpQuote
      }
    }
    
    // Fallback to Yahoo
    const yahooQuote = await fetchFromYahoo(ticker)
    if (yahooQuote && yahooQuote.price > 0) {
      priceCache.set(ticker, { quote: yahooQuote, timestamp: Date.now() })
      return yahooQuote
    }
  }
  
  // Strategy 2: US stocks -> Try Yahoo first (free & reliable)
  if (exchange === 'US') {
    console.log(`🇺🇸 Fetching ${ticker} as US stock...`)
    
    // Try Yahoo first
    const yahooQuote = await fetchFromYahoo(ticker)
    if (yahooQuote && yahooQuote.price > 0) {
      priceCache.set(ticker, { quote: yahooQuote, timestamp: Date.now() })
      return yahooQuote
    }
    
    // Fallback to Alpha Vantage
    if (ALPHA_VANTAGE_KEY) {
      const avQuote = await fetchFromAlphaVantage(ticker)
      if (avQuote && avQuote.price > 0) {
        priceCache.set(ticker, { quote: avQuote, timestamp: Date.now() })
        return avQuote
      }
    }
  }
  
  // Last resort: try all APIs
  console.warn(`⚠️ Trying all APIs for ${ticker}...`)
  
  const results = await Promise.allSettled([
    fetchFromYahoo(ticker),
    FMP_API_KEY ? fetchFromFMP(ticker) : Promise.resolve(null),
    ALPHA_VANTAGE_KEY ? fetchFromAlphaVantage(ticker) : Promise.resolve(null)
  ])
  
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value && result.value.price > 0) {
      priceCache.set(ticker, { quote: result.value, timestamp: Date.now() })
      return result.value
    }
  }
  
  console.error(`❌ Failed to fetch price for ${ticker} from all sources`)
  return null
}

/**
 * Fetch multiple quotes in parallel
 */
export async function fetchMultipleStockQuotes(
  tickers: string[]
): Promise<Record<string, StockQuote>> {
  const quotes: Record<string, StockQuote> = {}
  
  // Fetch all in parallel
  const results = await Promise.allSettled(
    tickers.map(ticker => fetchStockQuote(ticker))
  )
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      quotes[tickers[index]] = result.value
    }
  })
  
  return quotes
}

/**
 * Clear cache (useful for manual refresh)
 */
export function clearPriceCache() {
  priceCache.clear()
  console.log('💨 Price cache cleared')
}

/**
 * Get cache stats (for debugging)
 */
export function getCacheStats() {
  return {
    size: priceCache.size,
    tickers: Array.from(priceCache.keys()),
    oldestEntry: Math.min(...Array.from(priceCache.values()).map(v => v.timestamp))
  }
}
