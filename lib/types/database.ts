/**
 * Database types for the Finance App
 * These match the Supabase schema
 */

export type Category = {
  id: string
  user_id: string
  name: string
  parent_id: string | null
  color: string | null
  icon: string | null
  created_at: string
  updated_at: string
}

export type Transaction = {
  id: string
  user_id: string
  transaction_date: string
  description: string
  amount: number
  currency: string
  account_type: 'dutch' | 'spanish' | 'other'
  normalized_description: string
  learning_key: string | null
  category_id: string | null
  is_manually_categorized: boolean
  is_transfer: boolean
  is_income: boolean
  exclude_from_learning: boolean
  disable_auto_rules: boolean
  import_source: string | null
  import_date: string
  original_row_data: Record<string, any> | null
  created_at: string
  updated_at: string
}

export type CategorizationRule = {
  id: string
  user_id: string
  learning_key: string
  category_id: string
  confidence: number
  created_by_transaction_id: string | null
  created_at: string
  updated_at: string
}

export type Budget = {
  id: string
  user_id: string
  category_id: string | null
  amount: number
  month: number
  year: number
  created_at: string
  updated_at: string
}

export type SavingsAccount = {
  id: string
  user_id: string
  name: string
  account_type: 'dutch' | 'spanish' | 'other'
  currency: string
  color: string | null
  icon: string | null
  interest_rate: number // Annual interest rate as decimal (e.g., 0.026 for 2.6%)
  interest_type: 'fixed' | 'variable' | 'manual' // fixed = auto-calculate, variable/manual = manual entry
  interest_payment_frequency: 'monthly' | 'quarterly' | 'annual'
  fixed_rate_end_date: string | null // Date when fixed rate expires (e.g., '2048-02-12')
  last_interest_calculation_date: string | null // Last date interest was calculated
  is_pension: boolean // True for pension accounts (not accessible until retirement)
  created_at: string
  updated_at: string
}

export type SavingsEntry = {
  id: string
  user_id: string
  account_id: string
  entry_date: string
  entry_type: 'balance' | 'deposit' | 'withdrawal' | 'interest'
  amount: number
  notes: string | null
  transaction_id: string | null
  created_at: string
  updated_at: string
}

export type Stock = {
  id: string
  user_id: string
  ticker: string
  name: string
  quantity: number
  average_cost: number
  currency: string
  notes: string | null
  created_at: string
  updated_at: string
}

export type StockTransaction = {
  id: string
  user_id: string
  stock_id: string | null
  transaction_id: string | null
  transaction_date: string
  transaction_type: 'buy' | 'sell' | 'dividend'
  ticker: string
  quantity: number | null
  price_per_share: number | null
  total_amount: number
  fees: number
  currency: string
  notes: string | null
  created_at: string
  updated_at: string
}

export type UserPreferences = {
  id: string
  user_id: string
  dutch_account_starting_balance: number
  dutch_account_starting_date: string | null
  spanish_account_starting_balance: number
  spanish_account_starting_date: string | null
  created_at: string
  updated_at: string
}

// Form types for creating/updating
export type CategoryInput = {
  name: string
  parent_id?: string | null
  color?: string | null
  icon?: string | null
}

