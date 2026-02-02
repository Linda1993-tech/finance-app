/**
 * Automatically format tickers with the correct exchange suffix for Yahoo Finance
 */

// Common Dutch/European stocks that need .AS suffix (Amsterdam)
const AMSTERDAM_STOCKS = [
  'AGN', 'ASML', 'PHIA', 'HEIA', 'ING', 'KPN', 'ABN',
  'ADYEN', 'RAND', 'NN', 'ASR', 'AKZA', 'DSM', 'UNA',
  'AD', 'WKL', 'BESI', 'IMCD', 'SHELL', 'MT', 'LIGHT'
]

// Common stocks on other European exchanges
const PARIS_STOCKS = ['AIR', 'MC', 'OR', 'SAN', 'BN', 'CA']
const FRANKFURT_STOCKS = ['BMW', 'DAI', 'VOW', 'SIE', 'SAP', 'ALV']
const LONDON_STOCKS = ['BP', 'HSBA', 'GSK', 'AZN', 'ULVR', 'RIO']

/**
 * Format a ticker for Yahoo Finance by adding the correct exchange suffix
 */
export function formatTickerForYahoo(ticker: string): string {
  const upperTicker = ticker.toUpperCase().trim()
  
  // If already has a suffix, return as-is
  if (upperTicker.includes('.')) {
    return upperTicker
  }
  
  // Check for Amsterdam stocks
  if (AMSTERDAM_STOCKS.includes(upperTicker)) {
    return `${upperTicker}.AS`
  }
  
  // Check for Paris stocks
  if (PARIS_STOCKS.includes(upperTicker)) {
    return `${upperTicker}.PA`
  }
  
  // Check for Frankfurt stocks
  if (FRANKFURT_STOCKS.includes(upperTicker)) {
    return `${upperTicker}.DE`
  }
  
  // Check for London stocks
  if (LONDON_STOCKS.includes(upperTicker)) {
    return `${upperTicker}.L`
  }
  
  // Default: assume US stock (no suffix needed)
  return upperTicker
}

/**
 * Get the display name for a ticker (without suffix)
 */
export function getDisplayTicker(ticker: string): string {
  return ticker.split('.')[0]
}

/**
 * Get the exchange from a ticker
 */
export function getExchange(ticker: string): string {
  if (ticker.includes('.AS')) return 'Amsterdam'
  if (ticker.includes('.PA')) return 'Paris'
  if (ticker.includes('.DE')) return 'Frankfurt'
  if (ticker.includes('.L')) return 'London'
  return 'US'
}
