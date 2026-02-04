'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { UserPreferences } from '@/lib/types/database'

/**
 * Get user preferences
 */
export async function getUserPreferences(): Promise<UserPreferences | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = row not found, which is ok
    console.error('Error fetching user preferences:', error)
    return null
  }

  return data
}

/**
 * Update or create user preferences
 */
export async function updateUserPreferences(input: {
  dutch_account_starting_balance: number
  dutch_account_starting_date: string | null
  spanish_account_starting_balance: number
  spanish_account_starting_date: string | null
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Try to get existing preferences
  const existing = await getUserPreferences()

  if (existing) {
    // Update existing
    const { error } = await supabase
      .from('user_preferences')
      .update({
        dutch_account_starting_balance: input.dutch_account_starting_balance,
        dutch_account_starting_date: input.dutch_account_starting_date,
        spanish_account_starting_balance: input.spanish_account_starting_balance,
        spanish_account_starting_date: input.spanish_account_starting_date,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (error) {
      console.error('Error updating user preferences:', error)
      return { success: false, error: 'Failed to update preferences' }
    }
  } else {
    // Create new
    const { error } = await supabase.from('user_preferences').insert({
      user_id: user.id,
      dutch_account_starting_balance: input.dutch_account_starting_balance,
      dutch_account_starting_date: input.dutch_account_starting_date,
      spanish_account_starting_balance: input.spanish_account_starting_balance,
      spanish_account_starting_date: input.spanish_account_starting_date,
    })

    if (error) {
      console.error('Error creating user preferences:', error)
      return { success: false, error: 'Failed to create preferences' }
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')
  return { success: true }
}

/**
 * Debug: Get transaction summary for troubleshooting
 */
export async function getTransactionDebugInfo() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: transactions } = await supabase
    .from('transactions')
    .select('transaction_date, amount, account_type, is_transfer, description')
    .eq('user_id', user.id)
    .order('transaction_date', { ascending: false })

  const { data: preferences } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Group transactions by account_type
  const dutchTx = transactions?.filter(t => t.account_type === 'dutch') || []
  const spanishTx = transactions?.filter(t => t.account_type === 'spanish') || []
  const otherTx = transactions?.filter(t => t.account_type === 'other' || !t.account_type) || []

  // Calculate totals after starting date
  const dutchStartDate = preferences?.dutch_account_starting_date
  const spanishStartDate = preferences?.spanish_account_starting_date

  const dutchAfterStart = dutchTx.filter(t => (!dutchStartDate || t.transaction_date > dutchStartDate))
  const spanishAfterStart = spanishTx.filter(t => (!spanishStartDate || t.transaction_date > spanishStartDate))

  const dutchTotal = dutchAfterStart.reduce((sum, t) => sum + t.amount, 0)
  const spanishTotal = spanishAfterStart.reduce((sum, t) => sum + t.amount, 0)

  return {
    preferences,
    totalTransactions: transactions?.length || 0,
    byAccountType: {
      dutch: dutchTx.length,
      spanish: spanishTx.length,
      other: otherTx.length,
    },
    afterStartingDate: {
      dutch: {
        count: dutchAfterStart.length,
        total: dutchTotal,
        transactions: dutchAfterStart.slice(0, 10), // First 10 for review
      },
      spanish: {
        count: spanishAfterStart.length,
        total: spanishTotal,
        transactions: spanishAfterStart.slice(0, 10),
      },
    },
    calculatedBalance: {
      dutch: (preferences?.dutch_account_starting_balance || 0) + dutchTotal,
      spanish: (preferences?.spanish_account_starting_balance || 0) + spanishTotal,
      total: (preferences?.dutch_account_starting_balance || 0) + (preferences?.spanish_account_starting_balance || 0) + dutchTotal + spanishTotal,
    },
  }
}
