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
  created_at: string
  updated_at: string
}

export type SavingsEntry = {
  id: string
  user_id: string
  account_id: string
  entry_date: string
  entry_type: 'balance' | 'deposit' | 'withdrawal'
  amount: number
  notes: string | null
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

