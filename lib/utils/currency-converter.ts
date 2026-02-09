/**
 * Currency conversion utilities
 * Uses exchange rates to convert between currencies
 */

// Exchange rates (EUR base) - how much EUR you get for 1 unit of foreign currency
// Example: 1 USD = 0.92 EUR means USD rate is 0.92
const EXCHANGE_RATES: Record<string, number> = {
  'EUR': 1,
  'USD': 0.92, // 1 USD = 0.92 EUR
  'GBP': 1.16, // 1 GBP = 1.16 EUR
  '$': 0.92,   // Alias for USD
  '€': 1,      // Alias for EUR
  '£': 1.16,   // Alias for GBP
}

// Cache for live rates
let cachedRates: Record<string, number> | null = null
let lastFetchTime = 0
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Get current exchange rate (how much EUR you get for 1 unit of currency)
 */
export function getCurrentExchangeRate(currency: string): number {
  const curr = currency.toUpperCase().trim()
  
  // Use cached rates if available
  if (cachedRates && Date.now() - lastFetchTime < CACHE_DURATION) {
    return cachedRates[curr] || EXCHANGE_RATES[curr] || 1
  }
  
  // Return static rates
  return EXCHANGE_RATES[curr] || 1
}

/**
 * Convert amount from one currency to EUR
 */
export function convertToEUR(amount: number, fromCurrency: string, exchangeRate?: number): number {
  const currency = fromCurrency.toUpperCase().trim()
  
  // Already EUR
  if (currency === 'EUR' || currency === '€') {
    return amount
  }
  
  // Use provided rate or get current rate
  const rate = exchangeRate ?? getCurrentExchangeRate(currency)
  
  return amount * rate
}

/**
 * Fetch live exchange rates from API
 * Uses exchangerate-api.com free tier (1500 requests/month)
 */
export async function fetchLiveExchangeRates(): Promise<Record<string, number>> {
  try {
    // Check cache first
    if (cachedRates && Date.now() - lastFetchTime < CACHE_DURATION) {
      return cachedRates
    }
    
    // Fetch from API (EUR base)
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/EUR')
    
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates')
    }
    
    const data = await response.json()
    
    // Convert to our format (how much EUR for 1 unit of currency)
    const rates: Record<string, number> = {
      'EUR': 1,
      'USD': 1 / data.rates.USD, // Invert because we want EUR per USD
      'GBP': 1 / data.rates.GBP,
    }
    
    cachedRates = rates
    lastFetchTime = Date.now()
    
    console.log('💱 Live exchange rates updated:', rates)
    
    return rates
  } catch (error) {
    console.error('Failed to fetch exchange rates, using static rates:', error)
    return EXCHANGE_RATES
  }
}

/**
 * Calculate currency gain/loss (like DeGiro's "Valuta W/V")
 * 
 * @param costBasisInForeignCurrency - Original cost in foreign currency (e.g., $642.76)
 * @param marketValueInForeignCurrency - Current value in foreign currency (e.g., $1098.48)
 * @param currency - The foreign currency (e.g., 'USD')
 * @param exchangeRateAtPurchase - Exchange rate when purchased (e.g., 0.90 EUR/USD)
 * @returns Object with product gain/loss and currency gain/loss in EUR
 */
export function calculateCurrencyGainLoss(
  costBasisInForeignCurrency: number,
  marketValueInForeignCurrency: number,
  currency: string,
  exchangeRateAtPurchase: number
): {
  productGainLoss: number // Gain/loss from stock price movement in EUR
  currencyGainLoss: number // Gain/loss from exchange rate movement
  totalGainLoss: number // Total in EUR
} {
  const currentRate = getCurrentExchangeRate(currency)
  
  // Convert to EUR at different rates
  const costBasisInEUR = costBasisInForeignCurrency * exchangeRateAtPurchase
  const marketValueInEUR = marketValueInForeignCurrency * currentRate
  
  // Product gain/loss: change in stock price, converted at current rate
  const gainInForeignCurrency = marketValueInForeignCurrency - costBasisInForeignCurrency
  const productGainLoss = gainInForeignCurrency * currentRate
  
  // Currency gain/loss: change due to exchange rate movement
  const costBasisAtCurrentRate = costBasisInForeignCurrency * currentRate
  const currencyGainLoss = costBasisAtCurrentRate - costBasisInEUR
  
  // Total gain/loss in EUR
  const totalGainLoss = marketValueInEUR - costBasisInEUR
  
  return {
    productGainLoss,
    currencyGainLoss,
    totalGainLoss
  }
}

/**
 * Format amount with currency symbol
 */
export function formatWithCurrency(amount: number, currency: string): string {
  const curr = currency.toUpperCase().trim()
  
  const formatted = amount.toLocaleString('nl-NL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  
  switch (curr) {
    case 'EUR':
    case '€':
      return `€${formatted}`
    case 'USD':
    case '$':
      return `$${formatted}`
    case 'GBP':
    case '£':
      return `£${formatted}`
    default:
      return `${curr} ${formatted}`
  }
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: string): string {
  const curr = currency.toUpperCase().trim()
  
  switch (curr) {
    case 'EUR': return '€'
    case 'USD': return '$'
    case 'GBP': return '£'
    default: return curr
  }
}
