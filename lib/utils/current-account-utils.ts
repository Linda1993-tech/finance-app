/**
 * Current account balance calculation.
 *
 * Formula per account:
 *   balance = starting_balance + sum(transaction amounts after starting date)
 *
 * All transactions count — including transfers to savings/pension/stocks —
 * so the total matches your actual ING checking account balance.
 * (Transfers are also tracked separately in savings/pension.)
 */

export type AccountTransaction = {
  amount: number
  account_type: 'dutch' | 'spanish' | 'other' | string | null
  transaction_date: string
  is_transfer?: boolean
}

export type CurrentAccountBreakdown = {
  dutchStartingBalance: number
  spanishStartingBalance: number
  dutchTransactionsTotal: number
  spanishTransactionsTotal: number
  dutchTransferTotal: number
  spanishTransferTotal: number
  dutchAccountBalance: number
  spanishAccountBalance: number
  currentAccount: number
  /** Transactions with account_type 'other' — not included in either account */
  excludedOtherTotal: number
  excludedOtherCount: number
  /** What balance would be if transfers were excluded (legacy/debug comparison) */
  balanceIfTransfersExcluded: number
  transferImpact: number
}

function isAfterStartingDate(transactionDate: string, startingDate: string | null): boolean {
  if (!startingDate) return true
  return transactionDate > startingDate
}

function sumForAccount(
  transactions: AccountTransaction[],
  accountType: 'dutch' | 'spanish',
  startingDate: string | null,
  options?: { excludeTransfers?: boolean }
): { total: number; transferTotal: number; count: number } {
  let total = 0
  let transferTotal = 0
  let count = 0

  for (const tx of transactions) {
    if (tx.account_type !== accountType) continue
    if (!isAfterStartingDate(tx.transaction_date, startingDate)) continue

    count++
    total += tx.amount
    if (tx.is_transfer) {
      transferTotal += tx.amount
    }
  }

  if (options?.excludeTransfers) {
    return {
      total: total - transferTotal,
      transferTotal,
      count,
    }
  }

  return { total, transferTotal, count }
}

export function calculateCurrentAccountBreakdown(
  transactions: AccountTransaction[],
  preferences: {
    dutchStartingBalance: number
    dutchStartingDate: string | null
    spanishStartingBalance: number
    spanishStartingDate: string | null
  }
): CurrentAccountBreakdown {
  const dutch = sumForAccount(
    transactions,
    'dutch',
    preferences.dutchStartingDate
  )
  const spanish = sumForAccount(
    transactions,
    'spanish',
    preferences.spanishStartingDate
  )

  const dutchExcluded = sumForAccount(
    transactions,
    'dutch',
    preferences.dutchStartingDate,
    { excludeTransfers: true }
  )
  const spanishExcluded = sumForAccount(
    transactions,
    'spanish',
    preferences.spanishStartingDate,
    { excludeTransfers: true }
  )

  let excludedOtherTotal = 0
  let excludedOtherCount = 0
  for (const tx of transactions) {
    if (tx.account_type === 'dutch' || tx.account_type === 'spanish') continue

    const afterDutch = isAfterStartingDate(
      tx.transaction_date,
      preferences.dutchStartingDate
    )
    const afterSpanish = isAfterStartingDate(
      tx.transaction_date,
      preferences.spanishStartingDate
    )
    if (!afterDutch && !afterSpanish) continue

    excludedOtherTotal += tx.amount
    excludedOtherCount++
  }

  const dutchAccountBalance = preferences.dutchStartingBalance + dutch.total
  const spanishAccountBalance = preferences.spanishStartingBalance + spanish.total
  const currentAccount = dutchAccountBalance + spanishAccountBalance

  const balanceIfTransfersExcluded =
    preferences.dutchStartingBalance +
    dutchExcluded.total +
    preferences.spanishStartingBalance +
    spanishExcluded.total

  return {
    dutchStartingBalance: preferences.dutchStartingBalance,
    spanishStartingBalance: preferences.spanishStartingBalance,
    dutchTransactionsTotal: dutch.total,
    spanishTransactionsTotal: spanish.total,
    dutchTransferTotal: dutch.transferTotal,
    spanishTransferTotal: spanish.transferTotal,
    dutchAccountBalance,
    spanishAccountBalance,
    currentAccount,
    excludedOtherTotal,
    excludedOtherCount,
    balanceIfTransfersExcluded,
    transferImpact: currentAccount - balanceIfTransfersExcluded,
  }
}
