/**
 * CSV Parser for Dutch bank format
 */

import Papa from 'papaparse'
import { parseAmount, parseDate } from '../utils/transaction-utils'

export type ParsedTransaction = {
  date: string // YYYY-MM-DD
  description: string
  amount: number
  currency: string
  account_type: 'dutch' | 'spanish' | 'other'
}

export type ParseResult = {
  success: boolean
  transactions?: ParsedTransaction[]
  error?: string
  rowCount?: number
}

/**
 * Parse Dutch bank CSV file
 * Expected columns:
 * - Datum (Date in YYYYMMDD format)
 * - Naam / Omschrijving (Description)
 * - Bedrag (EUR) (Amount, always positive)
 * - Af Bij (Debit/Credit: "Af" = expense, "Bij" = income)
 */
export function parseINGNLCSV(fileContent: string): ParseResult {
  try {
    const result = Papa.parse<Record<string, string>>(fileContent, {
      header: true,
      skipEmptyLines: true,
      delimiter: ';', // Dutch banks typically use semicolon
      transformHeader: (header) => header.trim().replace(/"/g, ''), // Remove quotes
    })

    if (result.errors.length > 0) {
      return {
        success: false,
        error: `CSV parsing error: ${result.errors[0].message}`,
      }
    }

    const transactions: ParsedTransaction[] = []
    const headers = result.meta.fields || []

    // Find column names (exact or partial match)
    const dateCol = findColumn(headers, ['datum'])
    const descCol = findColumn(headers, ['naam', 'omschrijving'])
    const amountCol = findColumn(headers, ['bedrag'])
    const debitCreditCol = findColumn(headers, ['af bij'])

    if (!dateCol || !descCol || !amountCol || !debitCreditCol) {
      return {
        success: false,
        error: `Could not find required columns. Found: ${headers.join(', ')}. Expected: Datum, Naam / Omschrijving, Bedrag (EUR), Af Bij`,
      }
    }

    for (const row of result.data) {
      try {
        // Parse date from YYYYMMDD format
        const dateStr = row[dateCol]?.trim()
        if (!dateStr || dateStr.length !== 8) continue
        
        const year = dateStr.substring(0, 4)
        const month = dateStr.substring(4, 6)
        const day = dateStr.substring(6, 8)
        const date = `${year}-${month}-${day}`

        // Get description
        const description = row[descCol]?.trim() || 'Unknown'

        // Parse amount (always positive in file)
        let amount = parseAmount(row[amountCol] || '0')
        
        // Make negative if it's a debit ("Af")
        const debitCredit = row[debitCreditCol]?.trim().toLowerCase()
        if (debitCredit === 'af') {
          amount = -Math.abs(amount)
        } else if (debitCredit === 'bij') {
          amount = Math.abs(amount)
        }

        if (!description || amount === 0) continue

        transactions.push({
          date,
          description,
          amount,
          currency: 'EUR',
          account_type: 'dutch',
        })
      } catch (err) {
        console.warn('Skipping invalid row:', row, err)
        // Continue processing other rows
      }
    }

    return {
      success: true,
      transactions,
      rowCount: transactions.length,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Parse Spanish bank CSV file
 * Expected columns: F. VALOR / Fecha, DESCRIPCION, IMPORTE
 */
export function parseINGESCSV(fileContent: string): ParseResult {
  try {
    let parsed: Papa.ParseResult<Record<string, string>> | null = null

    for (const delimiter of [';', ',']) {
      const result = Papa.parse<Record<string, string>>(fileContent, {
        header: true,
        skipEmptyLines: true,
        delimiter,
        transformHeader: (header) => header.trim().replace(/"/g, ''),
      })
      if ((result.meta.fields || []).length > 0) {
        parsed = result
        break
      }
    }

    if (!parsed || parsed.errors.length > 0) {
      return {
        success: false,
        error: parsed?.errors[0]?.message ?? 'Could not parse CSV file',
      }
    }

    const headers = parsed.meta.fields || []
    const dateCol = findColumn(headers, ['f. valor', 'valor', 'fecha'])
    const descCol = findColumn(headers, ['descripcion', 'concepto'])
    const amountCol = findColumn(headers, ['importe'])

    if (!dateCol || !descCol || !amountCol) {
      return {
        success: false,
        error: `Could not find required columns. Found: ${headers.join(', ')}. Expected: F. VALOR, DESCRIPCION, IMPORTE`,
      }
    }

    const transactions: ParsedTransaction[] = []

    for (const row of parsed.data) {
      try {
        const dateStr = row[dateCol]?.trim()
        if (!dateStr) continue

        const date = parseDate(dateStr)
        const description = row[descCol]?.trim() || 'Unknown'
        const amountStr = row[amountCol]?.trim()
        if (!amountStr || amountStr === '0' || amountStr === '0,00') continue

        const amount = parseAmount(amountStr)
        if (!description || amount === 0) continue

        transactions.push({
          date,
          description,
          amount,
          currency: 'EUR',
          account_type: 'spanish',
        })
      } catch (err) {
        console.warn('Skipping invalid row:', row, err)
      }
    }

    return {
      success: true,
      transactions,
      rowCount: transactions.length,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Find column name that matches any of the given names (case insensitive)
 */
function findColumn(headers: string[], possibleNames: string[]): string | null {
  for (const header of headers) {
    for (const name of possibleNames) {
      if (header.toLowerCase().includes(name.toLowerCase())) {
        return header
      }
    }
  }
  return null
}

