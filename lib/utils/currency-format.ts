/**
 * Format a number as European currency (€1.590,99)
 * - Thousands separator: . (dot)
 * - Decimal separator: , (comma)
 */
export function formatEuro(amount: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

/**
 * Format a number as European number without currency symbol (1.590,99)
 */
export function formatNumber(amount: number, decimals: number = 2): string {
  return new Intl.NumberFormat('nl-NL', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
}
