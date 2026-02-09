'use server'

import { createClient } from '@/lib/supabase/server'
import { calculateSavingsStats } from './savings/actions'
import { calculateSavingsStats as calculatePensionStats } from './pension/actions'

export type WealthOverview = {
  totalNetWorth: number
  savings: number
  pension: number
  stocks: number
  currentAccount: number
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
    }
  }

  // Get all savings accounts (non-pension)
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

  // Get all pension accounts
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

  // Get all stocks
  const { data: stocks } = await supabase
    .from('stocks')
    .select('*')
    .eq('user_id', user.id)

  let totalStocks = 0
  if (stocks) {
    // Import currency converter
    const { convertToEUR } = await import('@/lib/utils/currency-converter')
    
    for (const stock of stocks) {
      // Calculate current value based on quantity and current_price
      if (stock.quantity > 0) {
        const priceToUse = stock.current_price || stock.average_cost
        const stockCurrency = stock.currency || 'EUR'
        
        // Calculate value in stock's currency
        const valueInStockCurrency = stock.quantity * priceToUse
        
        // Convert to EUR for total calculation
        const valueInEUR = convertToEUR(valueInStockCurrency, stockCurrency)
        
        totalStocks += valueInEUR
        
        console.log(`💼 ${stock.ticker}: ${stock.quantity} x ${stockCurrency} ${priceToUse} = €${valueInEUR.toFixed(2)}`)
      }
    }
  }

  // Get user preferences for starting balances
  const { data: preferences } = await supabase
    .from('user_preferences')
    .select('dutch_account_starting_balance, dutch_account_starting_date, spanish_account_starting_balance, spanish_account_starting_date')
    .eq('user_id', user.id)
    .single()

  const dutchStartingBalance = preferences?.dutch_account_starting_balance || 0
  const dutchStartingDate = preferences?.dutch_account_starting_date
  const spanishStartingBalance = preferences?.spanish_account_starting_balance || 0
  const spanishStartingDate = preferences?.spanish_account_starting_date

  // Calculate current account balance from transactions AFTER starting date
  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount, is_transfer, account_type, transaction_date')
    .eq('user_id', user.id)

  let dutchAccountBalance = dutchStartingBalance
  let spanishAccountBalance = spanishStartingBalance

  if (transactions) {
    // Dutch account transactions AFTER starting date (including transfers!)
    const dutchTransactionsTotal = transactions
      .filter((t) => 
        t.account_type === 'dutch' &&
        (!dutchStartingDate || t.transaction_date > dutchStartingDate)
      )
      .reduce((sum, t) => sum + t.amount, 0)
    dutchAccountBalance = dutchStartingBalance + dutchTransactionsTotal

    // Spanish account transactions AFTER starting date (including transfers!)
    const spanishTransactionsTotal = transactions
      .filter((t) => 
        t.account_type === 'spanish' &&
        (!spanishStartingDate || t.transaction_date > spanishStartingDate)
      )
      .reduce((sum, t) => sum + t.amount, 0)
    spanishAccountBalance = spanishStartingBalance + spanishTransactionsTotal
  }

  const currentAccount = dutchAccountBalance + spanishAccountBalance

  const totalNetWorth = totalSavings + totalPension + totalStocks + currentAccount

  return {
    totalNetWorth,
    savings: totalSavings,
    pension: totalPension,
    stocks: totalStocks,
    currentAccount,
  }
}
