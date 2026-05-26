/**
 * Heuristics to detect transactions that may be on the wrong account
 */

const SPANISH_SIGNALS = [
  'nomina',
  'nómina',
  'recibida',
  'transferencia',
  'adeudo',
  'comision',
  'comisión',
  'citytours',
  'bbva',
  'caixabank',
  'santander',
  'bizum',
  'tarjeta',
]

const DUTCH_SIGNALS = [
  'ideal',
  'incasso',
  'pinbetaling',
  'mollie',
  'bol.com',
  'overboeking',
  'tikkie',
  'rabobank',
  'abn amro',
  'ing bank',
]

export type SuspiciousTransaction = {
  id: string
  transaction_date: string
  description: string
  amount: number
  account_type: 'dutch' | 'spanish' | 'other'
  suggested_account_type: 'dutch' | 'spanish'
  reason: string
}

type TransactionRow = {
  id: string
  transaction_date: string
  description: string
  amount: number
  account_type: 'dutch' | 'spanish' | 'other'
}

function containsSignal(text: string, signals: string[]): string | null {
  const lower = text.toLowerCase()
  for (const signal of signals) {
    if (lower.includes(signal)) return signal
  }
  return null
}

export function findSuspiciousTransactions(
  transactions: TransactionRow[]
): SuspiciousTransaction[] {
  const suspicious: SuspiciousTransaction[] = []

  for (const tx of transactions) {
    if (tx.account_type === 'dutch') {
      const signal = containsSignal(tx.description, SPANISH_SIGNALS)
      if (signal) {
        suspicious.push({
          ...tx,
          suggested_account_type: 'spanish',
          reason: `Spaanse omschrijving ("${signal}") op Nederlandse rekening`,
        })
      }
    } else if (tx.account_type === 'spanish') {
      const signal = containsSignal(tx.description, DUTCH_SIGNALS)
      if (signal) {
        suspicious.push({
          ...tx,
          suggested_account_type: 'dutch',
          reason: `Nederlandse omschrijving ("${signal}") op Spaanse rekening`,
        })
      }
    }
  }

  return suspicious.sort(
    (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
  )
}

export type ImportBatch = {
  import_date: string
  count: number
  account_type: 'dutch' | 'spanish' | 'other'
  date_range: { from: string; to: string }
  total_amount: number
}

export function groupImportBatches(
  transactions: (TransactionRow & { import_date: string })[]
): ImportBatch[] {
  const batches = new Map<string, (TransactionRow & { import_date: string })[]>()

  for (const tx of transactions) {
    const key = tx.import_date
    const group = batches.get(key) ?? []
    group.push(tx)
    batches.set(key, group)
  }

  return Array.from(batches.entries())
    .map(([import_date, txs]) => {
      const dates = txs.map((t) => t.transaction_date).sort()
      return {
        import_date,
        count: txs.length,
        account_type: txs[0].account_type,
        date_range: { from: dates[0], to: dates[dates.length - 1] },
        total_amount: txs.reduce((sum, t) => sum + t.amount, 0),
      }
    })
    .sort((a, b) => new Date(b.import_date).getTime() - new Date(a.import_date).getTime())
}
