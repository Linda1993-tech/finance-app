/**
 * XLSX Parser for Spanish bank format
 */

import * as XLSX from 'xlsx'
import { parseAmount, parseDate } from '../utils/transaction-utils'
import type { ParsedTransaction, ParseResult } from './csv-parser'

/**
 * Parse Spanish bank XLSX/XLS file
 * Expected columns:
 * - F. VALOR (Date in DD/MM/YYYY format)
 * - DESCRIPCION (Description)
 * - IMPORTE (€) (Amount, negative for expenses)
 */
export function parseINGESXLSX(fileBuffer: ArrayBuffer): ParseResult {
  try {
    const workbook = XLSX.read(fileBuffer, { type: 'array' })

    // Get first sheet
    const firstSheetName = workbook.SheetNames[0]
    if (!firstSheetName) {
      return { success: false, error: 'No sheets found in Excel file' }
    }

    const worksheet = workbook.Sheets[firstSheetName]
    
    // Convert to array of arrays to find the header row
    const arrayData = XLSX.utils.sheet_to_json<any[]>(worksheet, {
      header: 1, // Return array of arrays instead of objects
      raw: false,
      defval: '',
    })

    if (arrayData.length === 0) {
      return { success: false, error: 'No data found in Excel file' }
    }

    const headerRowIndex = findHeaderRowIndex(arrayData)
    if (headerRowIndex === -1) {
      return {
        success: false,
        error: 'Could not find header row with F. VALOR, DESCRIPCION, IMPORTE columns.',
      }
    }

    const headers = (arrayData[headerRowIndex] as string[]).map((h) => String(h || '').trim())

    // Now parse the data starting from the row after headers
    const dataRows = arrayData.slice(headerRowIndex + 1)
    const transactions: ParsedTransaction[] = []

    // Find column indices (look for Spanish bank format columns)
    const dateColIndex = findColumnIndex(headers, ['f. valor', 'valor', 'fecha'])
    const descColIndex = findColumnIndex(headers, ['descripcion', 'concepto'])
    const amountColIndex = findColumnIndex(headers, ['importe'])

    if (dateColIndex === -1 || descColIndex === -1 || amountColIndex === -1) {
      return {
        success: false,
        error: `Could not find required columns. Found: ${headers.join(', ')}. Expected: F. VALOR, DESCRIPCION, IMPORTE`,
      }
    }

    for (const row of dataRows) {
      try {
        const rowArray = row as string[]
        
        // Parse date (DD/MM/YYYY format)
        const dateStr = String(rowArray[dateColIndex] || '').trim()
        if (!dateStr) continue
        
        const date = parseDate(dateStr)
        
        // Get description
        const description = String(rowArray[descColIndex] || '').trim() || 'Unknown'
        
        // Parse amount (already negative for expenses in Spanish bank files)
        const amountStr = String(rowArray[amountColIndex] || '0').trim()
        if (!amountStr || amountStr === '0' || amountStr === '0,00') continue
        
        const amount = parseAmount(amountStr)

        transactions.push({
          date,
          description,
          amount,
          currency: 'EUR',
          account_type: 'spanish',
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
 * Parse Dutch bank XLSX/XLS file
 * Expected columns: Datum, Naam/Omschrijving, Bedrag (EUR), Af Bij
 */
export function parseINGNLXLSX(fileBuffer: ArrayBuffer): ParseResult {
  try {
    const workbook = XLSX.read(fileBuffer, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]
    if (!firstSheetName) {
      return { success: false, error: 'No sheets found in Excel file' }
    }

    const arrayData = XLSX.utils.sheet_to_json<any[]>(workbook.Sheets[firstSheetName], {
      header: 1,
      raw: false,
      defval: '',
    })

    if (arrayData.length === 0) {
      return { success: false, error: 'No data found in Excel file' }
    }

    const headerRowIndex = findDutchHeaderRowIndex(arrayData)
    if (headerRowIndex === -1) {
      return {
        success: false,
        error: 'Could not find header row with Datum, Bedrag, Af Bij columns.',
      }
    }

    const headers = (arrayData[headerRowIndex] as string[]).map((h) => String(h || '').trim())
    const dataRows = arrayData.slice(headerRowIndex + 1)
    const transactions: ParsedTransaction[] = []

    const dateColIndex = findColumnIndex(headers, ['datum'])
    const descColIndex = findColumnIndex(headers, ['naam', 'omschrijving'])
    const amountColIndex = findColumnIndex(headers, ['bedrag'])
    const debitCreditColIndex = findColumnIndex(headers, ['af bij'])

    if (
      dateColIndex === -1 ||
      descColIndex === -1 ||
      amountColIndex === -1 ||
      debitCreditColIndex === -1
    ) {
      return {
        success: false,
        error: `Could not find required columns. Found: ${headers.join(', ')}. Expected: Datum, Naam/Omschrijving, Bedrag (EUR), Af Bij`,
      }
    }

    for (const row of dataRows) {
      try {
        const rowArray = row as string[]
        const dateStr = String(rowArray[dateColIndex] || '').trim()
        if (!dateStr || dateStr.length !== 8) continue

        const year = dateStr.substring(0, 4)
        const month = dateStr.substring(4, 6)
        const day = dateStr.substring(6, 8)
        const date = `${year}-${month}-${day}`

        const description = String(rowArray[descColIndex] || '').trim() || 'Unknown'
        let amount = parseAmount(String(rowArray[amountColIndex] || '0'))

        const debitCredit = String(rowArray[debitCreditColIndex] || '').trim().toLowerCase()
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

function findHeaderRowIndex(arrayData: unknown[]): number {
  for (let i = 0; i < Math.min(arrayData.length, 12); i++) {
    const row = arrayData[i] as string[]
    if (!Array.isArray(row)) continue

    const headers = row.map((h) => String(h || '').trim())
    const dateCol = findColumnIndex(headers, ['f. valor', 'valor', 'fecha'])
    const descCol = findColumnIndex(headers, ['descripcion', 'concepto'])
    const amountCol = findColumnIndex(headers, ['importe'])

    if (dateCol !== -1 && descCol !== -1 && amountCol !== -1) {
      return i
    }
  }
  return -1
}

function findDutchHeaderRowIndex(arrayData: unknown[]): number {
  for (let i = 0; i < Math.min(arrayData.length, 12); i++) {
    const row = arrayData[i] as string[]
    if (!Array.isArray(row)) continue

    const headers = row.map((h) => String(h || '').trim())
    const dateCol = findColumnIndex(headers, ['datum'])
    const descCol = findColumnIndex(headers, ['naam', 'omschrijving'])
    const amountCol = findColumnIndex(headers, ['bedrag'])
    const debitCreditCol = findColumnIndex(headers, ['af bij'])

    if (dateCol !== -1 && descCol !== -1 && amountCol !== -1 && debitCreditCol !== -1) {
      return i
    }
  }
  return -1
}

/**
 * Find column index that matches any of the given names (case insensitive, handles accents)
 */
function findColumnIndex(headers: string[], possibleNames: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const header = normalizeForSearch(headers[i])
    for (const name of possibleNames) {
      if (header.includes(normalizeForSearch(name))) {
        return i
      }
    }
  }
  return -1
}

/**
 * Normalize string for search - remove accents, special chars, lowercase
 */
function normalizeForSearch(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .trim()
}

