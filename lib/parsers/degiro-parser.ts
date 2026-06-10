/**
 * Parser for DeGiro "Transactions" CSV export.
 *
 * DeGiro exports have unnamed currency columns next to each amount column,
 * so we parse by column index (resolved from the header row) instead of by name.
 * Works for both Dutch and English exports.
 */

import Papa from 'papaparse'
import { parseAmount, parseDate } from '../utils/transaction-utils'

export type DeGiroTransaction = {
  date: string // YYYY-MM-DD
  product: string
  isin: string
  exchange: string
  /** Positive = buy, negative = sell (as in the DeGiro file) */
  quantity: number
  /** Price per share in the stock's local currency */
  price: number
  priceCurrency: string
  /** Fees in EUR (absolute value) */
  fees: number
  /** Total in EUR, negative for buys (money out) */
  total: number
  orderId: string | null
}

export type DeGiroProduct = {
  isin: string
  product: string
  exchange: string
  suggestedTicker: string
  currency: string
  transactions: DeGiroTransaction[]
}

export type DeGiroParseResult = {
  success: boolean
  products?: DeGiroProduct[]
  error?: string
}

export type DeGiroHolding = {
  product: string
  symbolOrIsin: string
  suggestedTicker: string
  quantity: number
  /** Closing price from the export (local currency) */
  closingPrice: number
  valueEur: number
}

export type DeGiroPortfolioParseResult = {
  success: boolean
  holdings?: DeGiroHolding[]
  error?: string
}

/** DeGiro "Beurs" / "Reference exchange" codes → Yahoo Finance ticker suffix */
const EXCHANGE_SUFFIX: Record<string, string> = {
  EAM: '.AS', // Euronext Amsterdam
  EPA: '.PA', // Euronext Paris
  PAR: '.PA',
  EBR: '.BR', // Euronext Brussels
  ELI: '.LS', // Euronext Lisbon
  XET: '.DE', // Xetra
  FRA: '.F', // Frankfurt
  MAD: '.MC', // Madrid
  MIL: '.MI', // Milan
  LSE: '.L', // London
  SWX: '.SW', // Swiss
  EBS: '.SW',
  TOR: '.TO', // Toronto
  OMX: '.ST', // Stockholm
  CPH: '.CO', // Copenhagen
  OSL: '.OL', // Oslo
  WSE: '.WA', // Warsaw
  // US exchanges: no suffix
  NSY: '',
  NYSE: '',
  NDQ: '',
  NASDAQ: '',
}

function findColumn(headers: string[], candidates: string[]): number {
  return headers.findIndex((h) => {
    const header = h.trim().toLowerCase()
    return candidates.some((c) => header === c || header.startsWith(c))
  })
}

function suggestTicker(product: string, exchange: string): string {
  const suffix = EXCHANGE_SUFFIX[exchange.toUpperCase()] ?? ''
  const firstWord = product
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .trim()
    .split(/\s+/)[0] || ''

  return firstWord ? `${firstWord.substring(0, 8)}${suffix}` : ''
}

const ISIN_PATTERN = /^[A-Z]{2}[A-Z0-9]{9}\d$/

/** ISIN country code → likely Yahoo suffix (best guess, user can correct) */
const ISIN_COUNTRY_SUFFIX: Record<string, string> = {
  NL: '.AS',
  FR: '.PA',
  BE: '.BR',
  DE: '.DE',
  ES: '.MC',
  IT: '.MI',
  GB: '.L',
  CH: '.SW',
  PT: '.LS',
  SE: '.ST',
  DK: '.CO',
  NO: '.OL',
  IE: '.AS', // Irish ISINs are usually ETFs traded on Euronext Amsterdam
}

function suggestTickerFromSymbol(symbolOrIsin: string, product: string): string {
  const value = symbolOrIsin.trim().toUpperCase()

  if (ISIN_PATTERN.test(value)) {
    const suffix = ISIN_COUNTRY_SUFFIX[value.substring(0, 2)] ?? ''
    const firstWord = product
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .trim()
      .split(/\s+/)[0] || ''
    return firstWord ? `${firstWord.substring(0, 8)}${suffix}` : ''
  }

  return value
}

export function parseDeGiroCSV(fileContent: string): DeGiroParseResult {
  try {
    const result = Papa.parse<string[]>(fileContent, {
      skipEmptyLines: true,
    })

    const rows = result.data
    if (!rows || rows.length < 2) {
      return { success: false, error: 'Bestand bevat geen transacties' }
    }

    const headers = rows[0].map((h) => h.trim())

    const dateCol = findColumn(headers, ['datum', 'date'])
    const productCol = findColumn(headers, ['product'])
    const isinCol = findColumn(headers, ['isin'])
    const exchangeCol = findColumn(headers, ['beurs', 'reference exchange'])
    const quantityCol = findColumn(headers, ['aantal', 'quantity'])
    const priceCol = findColumn(headers, ['koers', 'price'])
    const feesCol = findColumn(headers, ['transactiekosten', 'transaction and/or'])
    const totalCol = findColumn(headers, ['totaal', 'total'])
    const orderIdCol = findColumn(headers, ['order id', 'order-id', 'orderid'])

    if (dateCol === -1 || productCol === -1 || isinCol === -1 || quantityCol === -1 || priceCol === -1) {
      return {
        success: false,
        error: `Dit lijkt geen DeGiro Transactions-export. Gevonden kolommen: ${headers.filter(Boolean).join(', ')}`,
      }
    }

    const productMap = new Map<string, DeGiroProduct>()

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      try {
        const dateStr = row[dateCol]?.trim()
        const isin = row[isinCol]?.trim()
        const quantityStr = row[quantityCol]?.trim()
        if (!dateStr || !isin || !quantityStr) continue

        const quantity = parseAmount(quantityStr)
        if (!quantity || isNaN(quantity)) continue

        const product = row[productCol]?.trim() || isin
        const exchange = row[exchangeCol]?.trim() || ''
        const price = parseAmount(row[priceCol]?.trim() || '0')
        // Currency sits in the unnamed column directly after the price column
        const priceCurrency = row[priceCol + 1]?.trim() || 'EUR'
        const fees = feesCol !== -1 ? Math.abs(parseAmount(row[feesCol]?.trim() || '0') || 0) : 0
        const total = totalCol !== -1 ? parseAmount(row[totalCol]?.trim() || '0') || 0 : 0
        const orderId = orderIdCol !== -1 ? row[orderIdCol]?.trim() || null : null

        const transaction: DeGiroTransaction = {
          date: parseDate(dateStr),
          product,
          isin,
          exchange,
          quantity,
          price,
          priceCurrency,
          fees,
          total,
          orderId,
        }

        const existing = productMap.get(isin)
        if (existing) {
          existing.transactions.push(transaction)
        } else {
          productMap.set(isin, {
            isin,
            product,
            exchange,
            suggestedTicker: suggestTicker(product, exchange),
            currency: priceCurrency,
            transactions: [transaction],
          })
        }
      } catch {
        // Skip unparseable rows (e.g. summary lines)
        continue
      }
    }

    const products = Array.from(productMap.values())
    if (products.length === 0) {
      return { success: false, error: 'Geen geldige transacties gevonden in het bestand' }
    }

    // Oldest first so positions can be rebuilt chronologically
    for (const p of products) {
      p.transactions.sort((a, b) => a.date.localeCompare(b.date))
    }

    return { success: true, products }
  } catch (err) {
    console.error('DeGiro parse error:', err)
    return { success: false, error: 'Kon het CSV-bestand niet lezen' }
  }
}

/**
 * Parse the DeGiro "Portfolio" export (current holdings snapshot).
 * Columns: Product, Symbool/ISIN, Aantal, Slotkoers, Lokale waarde, Waarde in EUR
 */
export function parseDeGiroPortfolioCSV(fileContent: string): DeGiroPortfolioParseResult {
  try {
    const result = Papa.parse<string[]>(fileContent, {
      skipEmptyLines: true,
    })

    const rows = result.data
    if (!rows || rows.length < 2) {
      return { success: false, error: 'Bestand bevat geen posities' }
    }

    const headers = rows[0].map((h) => h.trim())

    const productCol = findColumn(headers, ['product'])
    const symbolCol = findColumn(headers, ['symbool/isin', 'symbol/isin', 'symbool', 'symbol'])
    const quantityCol = findColumn(headers, ['aantal', 'amount', 'quantity'])
    const priceCol = findColumn(headers, ['slotkoers', 'closing'])
    const valueEurCol = findColumn(headers, ['waarde in eur', 'value in eur', 'waarde', 'value'])

    if (productCol === -1 || quantityCol === -1) {
      return {
        success: false,
        error: `Geen Portfolio-export herkend. Gevonden kolommen: ${headers.filter(Boolean).join(', ')}`,
      }
    }

    const holdings: DeGiroHolding[] = []

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      try {
        const product = row[productCol]?.trim()
        if (!product) continue

        // Skip cash rows (e.g. "CASH & CASH FUND & FTX CASH (EUR)")
        if (product.toUpperCase().includes('CASH')) continue

        const quantity = parseAmount(row[quantityCol]?.trim() || '0')
        if (!quantity || isNaN(quantity) || quantity <= 0) continue

        const symbolOrIsin = symbolCol !== -1 ? row[symbolCol]?.trim() || '' : ''
        const closingPrice = priceCol !== -1 ? parseAmount(row[priceCol]?.trim() || '0') || 0 : 0
        const valueEur = valueEurCol !== -1 ? parseAmount(row[valueEurCol]?.trim() || '0') || 0 : 0

        holdings.push({
          product,
          symbolOrIsin,
          suggestedTicker: suggestTickerFromSymbol(symbolOrIsin, product),
          quantity,
          closingPrice,
          valueEur,
        })
      } catch {
        continue
      }
    }

    if (holdings.length === 0) {
      return { success: false, error: 'Geen geldige posities gevonden in het bestand' }
    }

    return { success: true, holdings }
  } catch (err) {
    console.error('DeGiro portfolio parse error:', err)
    return { success: false, error: 'Kon het CSV-bestand niet lezen' }
  }
}
