/**
 * Currency conversion utilities
 * Uses exchange rates to convert between currencies
 */

// Exchange rates (EUR base)
// You can fetch live rates from an API in the future
const EXCHANGE_RATES: Record<string, number> = {
  'EUR': 1,
  'USD': 0.92, // 1 USD = 0.92 EUR (approximate)
  'GBP': 1.16, // 1 GBP = 1.16 EUR (approximate)
  '$': 0.92,   // Alias for USD
  '€': 1,      // Alias for EUR
  '£': 1.16,   // Alias for GBP
}

/**
 * Convert amount from one currency to EUR
 */
export function convertToEUR(amount: number, fromCurrency: string): number {
  const currency = fromCurrency.toUpperCase().trim()
  
  // Already EUR
  if (currency === 'EUR' || currency === '€') {
    return amount
  }
  
  // Get exchange rate
  const rate = EXCHANGE_RATES[currency] || EXCHANGE_RATES['USD'] // Default to USD if unknown
  
  return amount * rate
}

/**
 * Fetch live exchange rates from API (optional enhancement)
 */
export async function fetchLiveExchangeRates(): Promise<Record<string, number>> {
  try {
    // Free API: https://exchangerate-api.com or https://fixer.io
    // For now, return static rates
    // TODO: Implement live rates in the future
    return EXCHANGE_RATES
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error)
    return EXCHANGE_RATES
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
