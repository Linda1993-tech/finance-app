'use server'

import { createClient } from '@/lib/supabase/server'
import { calculateSavingsStats } from './savings/actions'
import { calculateSavingsStats as calculatePensionStats } from './pension/actions'
import { calculateCurrentAccountBreakdown } from '@/lib/utils/current-account-utils'

export type WealthOverview = {
  totalNetWorth: number
  savings: number
  pension: number
  stocks: number
  currentAccount: number
  dutchAccountBalance: number
  spanishAccountBalance: number
}

/**
 * Get complete wealth overview
 */
export async function getWealthOverview(): Promise<WealthOverview> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      totalNetWorth: 0,
      savings: 0,
      pension: 0,
      stocks: 0,
      currentAccount: 0,
      dutchAccountBalance: 0,
      spanishAccountBalance: 0,
    }
  }

  const { data: savingsAccounts } = await supabase
    .from('savings_accounts')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_pension', false)

  let totalSavings = 0
  if (savingsAccounts) {
    for (const account of savingsAccounts) {
      const stats = await calculateSavingsStats(account.id)
      totalSavings += stats.currentBalance
    }
  }

  const { data: pensionAccounts } = await supabase
    .from('savings_accounts')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_pension', true)

  let totalPension = 0
  if (pensionAccounts) {
    for (const account of pensionAccounts) {
      const stats = await calculatePensionStats(account.id)
      totalPension += stats.currentBalance
    }
  }

  const { data: stocks } = await supabase
    .from('stocks')
    .select('*')
    .eq('user_id', user.id)

  let totalStocks = 0
  if (stocks) {
    const { convertToEUR } = await import('@/lib/utils/currency-converter')

    for (const stock of stocks) {
      if (stock.quantity > 0) {
        const priceToUse = stock.current_price || stock.average_cost
        const stockCurrency = stock.currency || 'EUR'
        const valueInStockCurrency = stock.quantity * priceToUse
        const valueInEUR = convertToEUR(valueInStockCurrency, stockCurrency)
        totalStocks += valueInEUR
      }
    }
  }

  const { data: preferences } = await supabase
    .from('user_preferences')
    .select('dutch_account_starting_balance, dutch_account_starting_date, spanish_account_starting_balance, spanish_account_starting_date')
    .eq('user_id', user.id)
    .single()

  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount, is_transfer, account_type, transaction_date')
    .eq('user_id', user.id)

  const breakdown = calculateCurrentAccountBreakdown(transactions || [], {
    dutchStartingBalance: preferences?.dutch_account_starting_balance || 0,
    dutchStartingDate: preferences?.dutch_account_starting_date || null,
    spanishStartingBalance: preferences?.spanish_account_starting_balance || 0,
    spanishStartingDate: preferences?.spanish_account_starting_date || null,
  })

  const totalNetWorth =
    totalSavings + totalPension + totalStocks + breakdown.currentAccount

  return {
    totalNetWorth,
    savings: totalSavings,
    pension: totalPension,
    stocks: totalStocks,
    currentAccount: breakdown.currentAccount,
    dutchAccountBalance: breakdown.dutchAccountBalance,
    spanishAccountBalance: breakdown.spanishAccountBalance,
  }
}
