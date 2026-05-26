/**
 * Auto-detect Dutch vs Spanish bank statement format from file content
 */

import Papa from 'papaparse'
import * as XLSX from 'xlsx'

export type DetectedBankFormat = {
  accountType: 'dutch' | 'spanish'
  fileFormat: 'csv' | 'xlsx'
  importSource: 'NL' | 'ES'
}

const DUTCH_HEADER_SIGNALS = ['datum', 'bedrag', 'af bij', 'naam', 'omschrijving']
const SPANISH_HEADER_SIGNALS = ['f. valor', 'valor', 'fecha', 'descripcion', 'concepto', 'importe']

function scoreHeaders(headers: string[]): { dutch: number; spanish: number } {
  const normalized = headers.map((h) => normalizeHeader(h))
  let dutch = 0
  let spanish = 0

  for (const header of normalized) {
    for (const signal of DUTCH_HEADER_SIGNALS) {
      if (header.includes(normalizeHeader(signal))) dutch++
    }
    for (const signal of SPANISH_HEADER_SIGNALS) {
      if (header.includes(normalizeHeader(signal))) spanish++
    }
  }

  // Strong Dutch fingerprint: needs datum + bedrag + af bij
  if (
    normalized.some((h) => h.includes('datum')) &&
    normalized.some((h) => h.includes('bedrag')) &&
    normalized.some((h) => h.includes('af bij'))
  ) {
    dutch += 5
  }

  // Strong Spanish fingerprint: needs valor/fecha + descripcion + importe
  if (
    normalized.some((h) => h.includes('valor') || h.includes('fecha')) &&
    normalized.some((h) => h.includes('descripcion') || h.includes('concepto')) &&
    normalized.some((h) => h.includes('importe'))
  ) {
    spanish += 5
  }

  return { dutch, spanish }
}

function normalizeHeader(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s.]/g, '')
    .trim()
}

function detectFromCSV(content: string): 'dutch' | 'spanish' | null {
  for (const delimiter of [';', ',']) {
    const result = Papa.parse<Record<string, string>>(content, {
      header: true,
      preview: 1,
      skipEmptyLines: true,
      delimiter,
      transformHeader: (header) => header.trim().replace(/"/g, ''),
    })

    const headers = result.meta.fields || []
    if (headers.length === 0) continue

    const { dutch, spanish } = scoreHeaders(headers)
    if (dutch > spanish && dutch >= 3) return 'dutch'
    if (spanish > dutch && spanish >= 3) return 'spanish'
  }

  return null
}

function detectFromXLSX(buffer: ArrayBuffer): 'dutch' | 'spanish' | null {
  try {
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) return null

    const rows = XLSX.utils.sheet_to_json<string[]>(workbook.Sheets[sheetName], {
      header: 1,
      raw: false,
      defval: '',
    })

    let bestDutch = 0
    let bestSpanish = 0

    // Scan first rows for header row and metadata (IBAN hints)
    for (let i = 0; i < Math.min(rows.length, 12); i++) {
      const row = rows[i]
      if (!Array.isArray(row)) continue

      const rowText = row.map((c) => String(c || '')).join(' ')
      if (/\bNL\d{2}[A-Z]{4}\d{10}\b/i.test(rowText)) bestDutch += 3
      if (/\bES\d{2}\d{4}\d{4}\d{2}\d{10}\b/i.test(rowText)) bestSpanish += 3

      const headers = row.map((h) => String(h || '').trim())
      const { dutch, spanish } = scoreHeaders(headers)
      bestDutch = Math.max(bestDutch, dutch)
      bestSpanish = Math.max(bestSpanish, spanish)
    }

    if (bestDutch > bestSpanish && bestDutch >= 3) return 'dutch'
    if (bestSpanish > bestDutch && bestSpanish >= 3) return 'spanish'
    if (bestSpanish >= 3) return 'spanish'
    if (bestDutch >= 3) return 'dutch'

    return null
  } catch {
    return null
  }
}

function isXlsxFile(fileName: string): boolean {
  const lower = fileName.toLowerCase()
  return lower.endsWith('.xlsx') || lower.endsWith('.xls')
}

/**
 * Detect bank account type and file format from file name and content
 */
export function detectBankFormat(
  fileName: string,
  buffer: ArrayBuffer
): DetectedBankFormat {
  const fileFormat = isXlsxFile(fileName) ? 'xlsx' : 'csv'

  let accountType: 'dutch' | 'spanish' | null = null

  if (fileFormat === 'xlsx') {
    accountType = detectFromXLSX(buffer)
  } else {
    const content = new TextDecoder('utf-8').decode(buffer)
    accountType = detectFromCSV(content)
  }

  // Fallback: Dutch banks typically export CSV, Spanish banks export XLSX
  if (!accountType) {
    accountType = fileFormat === 'xlsx' ? 'spanish' : 'dutch'
  }

  return {
    accountType,
    fileFormat,
    importSource: accountType === 'spanish' ? 'ES' : 'NL',
  }
}
