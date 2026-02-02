/**
 * Fetch current stock prices from Yahoo Finance API
 */

export type StockQuote = {
  ticker: string
  price: number
  currency: string
  name: string
  change: number
  changePercent: number
}

/**
 * Fetch a single stock quote from Yahoo Finance
 */
export async function fetchStockQuote(ticker: string): Promise<StockQuote | null> {
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      }
    )

    if (!response.ok) {
      console.error(`Failed to fetch quote for ${ticker}:`, response.status)
      return null
    }

    const data = await response.json()
    const result = data.chart?.result?.[0]

    if (!result) {
      console.error(`No data for ${ticker}`)
      return null
    }

    const meta = result.meta
    const currentPrice = meta.regularMarketPrice || meta.previousClose
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
    }
  } catch (error) {
    console.error(`Error fetching quote for ${ticker}:`, error)
    return null
  }
}

/**
 * Fetch multiple stock quotes at once
 */
export async function fetchMultipleStockQuotes(tickers: string[]): Promise<Record<string, StockQuote>> {
  const quotes: Record<string, StockQuote> = {}

  // Fetch all quotes in parallel
  const results = await Promise.allSettled(
    tickers.map((ticker) => fetchStockQuote(ticker))
  )

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      quotes[tickers[index]] = result.value
    }
  })

  return quotes
}

/**
 * Format ticker for Yahoo Finance (handle different exchanges)
 * For European stocks, you might need to add exchange suffix
 * e.g., ASML -> ASML.AS (Amsterdam)
 */
export function formatTickerForYahoo(ticker: string, exchange?: string): string {
  // If already has exchange suffix, return as is
  if (ticker.includes('.')) {
    return ticker
  }

  // Common European exchanges
  if (exchange === 'AMS' || exchange === 'Amsterdam') {
    return `${ticker}.AS` // Amsterdam
  }
  if (exchange === 'EPA' || exchange === 'Paris') {
    return `${ticker}.PA` // Paris
  }
  if (exchange === 'FRA' || exchange === 'Frankfurt') {
    return `${ticker}.DE` // Frankfurt
  }
  if (exchange === 'LON' || exchange === 'London') {
    return `${ticker}.L` // London
  }

  // Default: US stocks don't need suffix
  return ticker
}
