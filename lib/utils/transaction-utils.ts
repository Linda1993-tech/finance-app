/**
 * Utility functions for transaction processing
 */

/**
 * Normalize a transaction description for matching
 * Removes extra spaces, converts to uppercase, removes special characters
 */
export function normalizeDescription(description: string): string {
  return description
    .toUpperCase()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^A-Z0-9\s]/g, '') // Remove special characters
    .trim()
}

/**
 * Common prefixes to skip when generating learning keys
 * These are generic payment/transfer descriptions that don't help identify merchants
 */
const COMMON_PREFIXES = [
  'PAGO EN ',
  'PAGO ',
  'PAYMENT ',
  'PAYMENT TO ',
  'TRANSFER ',
  'TRANSFER TO ',
  'COMPRA EN ',
  'COMPRA ',
]

/**
 * Clean transaction-specific noise from description
 * Removes dates, transaction codes, and other variable parts
 * 
 * Examples:
 * - "GLOVO01JAN BC6L1KTB" → "GLOVO"
 * - "ALBERT HEIJN 1234" → "ALBERT HEIJN"
 * - "NETFLIX 20240115" → "NETFLIX"
 */
function cleanTransactionNoise(text: string): string {
  let cleaned = text

  // Step 1: Remove date patterns (AGGRESSIVE - no word boundaries)
  // Matches: 01JAN, 16FEB, 31DEC, etc. (with or without spaces)
  cleaned = cleaned.replace(/\d{1,2}(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)/gi, ' ')

  // Remove full dates: 20240115, 2024-01-15, 15-01-2024, 15/01/2024
  cleaned = cleaned.replace(/\d{4}[-/]?\d{2}[-/]?\d{2}/g, ' ')
  cleaned = cleaned.replace(/\d{2}[-/]\d{2}[-/]\d{4}/g, ' ')

  // Step 2: Remove ALL remaining numbers (standalone or in codes)
  // This is aggressive but effective - keeps only letters
  cleaned = cleaned.replace(/\d+/g, ' ')

  // Step 3: Remove very short "words" that are likely codes (1-2 chars)
  // This removes things like "BC", "6L", "K", "TB" that remain after removing numbers
  cleaned = cleaned.replace(/\b[A-Z]{1,2}\b/g, ' ')

  // Step 4: Clean up multiple spaces and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim()

  return cleaned
}

/**
 * Generate a learning key from a normalized description
 * 
 * Strategy:
 * 1. Skip common prefixes like "PAGO EN", "PAYMENT", etc.
 * 2. Remove transaction-specific noise (dates, codes)
 * 3. Use up to 16 characters for merchant identification
 * 4. Falls back to original if cleaning results in too-short text
 * 
 * Examples:
 * - "PAGO EN GLOVO 16JAN B1TZXNK5" → "GLOVO"
 * - "ALBERT HEIJN 1234" → "ALBERT HEIJN"
 * - "SHELL STATION" → "SHELL STATION"
 */
export function generateLearningKey(normalizedDescription: string): string {
  let workingText = normalizedDescription

  // Step 1: Skip common prefixes
  for (const prefix of COMMON_PREFIXES) {
    if (workingText.startsWith(prefix)) {
      workingText = workingText.substring(prefix.length).trim()
      break
    }
  }

  // Step 2: Clean transaction noise (dates, codes, etc.)
  workingText = cleanTransactionNoise(workingText)

  // If cleaning left us with too little, use original (less the prefix)
  if (workingText.length < 3) {
    workingText = normalizedDescription
    for (const prefix of COMMON_PREFIXES) {
      if (workingText.startsWith(prefix)) {
        workingText = workingText.substring(prefix.length).trim()
        break
      }
    }
  }

  // Step 3: Take ONLY the first word (the merchant name)
  // This ensures we don't include leftover transaction codes
  // "GLOVO TZXNK" → "GLOVO"
  // "ALBERT HEIJN" → "ALBERT HEIJN" (we'll take up to 16 chars)
  const firstWord = workingText.split(/\s+/)[0]
  
  // If first word is too short (< 3 chars), try taking first 2 words
  if (firstWord.length < 3) {
    const words = workingText.split(/\s+/)
    workingText = words.slice(0, 2).join(' ')
  } else {
    workingText = firstWord
  }

  // Return up to 16 characters
  return workingText.substring(0, 16).trim()
}

/**
 * Parse amount string to number
 * Handles various formats: "1.234,56" or "1,234.56"
 */
export function parseAmount(amountStr: string): number {
  // Remove spaces
  let cleaned = amountStr.replace(/\s/g, '')

  // Detect format by looking at the last separator
  const lastComma = cleaned.lastIndexOf(',')
  const lastDot = cleaned.lastIndexOf('.')

  if (lastComma > lastDot) {
    // European format: 1.234,56 -> 1234.56
    cleaned = cleaned.replace(/\./g, '').replace(',', '.')
  } else {
    // US format: 1,234.56 -> 1234.56
    cleaned = cleaned.replace(/,/g, '')
  }

  return parseFloat(cleaned)
}

/**
 * Parse date string to YYYY-MM-DD format
 * Handles: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, YYYYMMDD
 */
export function parseDate(dateStr: string): string {
  // If already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr
  }

  // Handle YYYYMMDD format (e.g., 20240115)
  if (/^\d{8}$/.test(dateStr)) {
    const year = dateStr.substring(0, 4)
    const month = dateStr.substring(4, 6)
    const day = dateStr.substring(6, 8)
    return `${year}-${month}-${day}`
  }

  // Try DD/MM/YYYY or DD-MM-YYYY
  const parts = dateStr.split(/[/-]/)
  if (parts.length === 3) {
    const [first, second, third] = parts

    // If first part is 4 digits, assume YYYY-MM-DD (might have wrong separator)
    if (first.length === 4) {
      return `${first}-${second.padStart(2, '0')}-${third.padStart(2, '0')}`
    }

    // Otherwise assume DD-MM-YYYY
    return `${third}-${second.padStart(2, '0')}-${first.padStart(2, '0')}`
  }

  throw new Error(`Unable to parse date: ${dateStr}`)
}

