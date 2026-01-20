/**
 * XLSX Parser for ING ES format
 */

import * as XLSX from 'xlsx'
import { parseAmount, parseDate } from '../utils/transaction-utils'
import type { ParsedTransaction, ParseResult } from './csv-parser'

/**
 * Parse ING ES XLSX/XLS file
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

    // ING ES files have headers on row 4 (index 3)
    // Rows 1-3 contain account information
    const headerRowIndex = 3
    
    if (arrayData.length <= headerRowIndex) {
      return {
        success: false,
        error: 'File has fewer than 4 rows. Cannot find header row.',
      }
    }
    
    const headers = (arrayData[headerRowIndex] as string[]).map((h) => String(h || '').trim())

    // Now parse the data starting from the row after headers
    const dataRows = arrayData.slice(headerRowIndex + 1)
    const transactions: ParsedTransaction[] = []

    // Find column indices (look for ING ES specific columns)
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
        
        // Parse amount (already negative for expenses in ING ES files)
        const amountStr = String(rowArray[amountColIndex] || '0').trim()
        if (!amountStr || amountStr === '0' || amountStr === '0,00') continue
        
        const amount = parseAmount(amountStr)

        transactions.push({
          date,
          description,
          amount,
          currency: 'EUR',
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

