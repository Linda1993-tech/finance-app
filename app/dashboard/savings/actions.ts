'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { SavingsAccount, SavingsEntry } from '@/lib/types/database'

/**
 * Get all savings accounts for the current user
 */
export async function getSavingsAccounts(): Promise<SavingsAccount[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('savings_accounts')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_pension', false) // Only regular savings, not pension
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching savings accounts:', error)
    throw new Error('Failed to fetch savings accounts')
  }

  return data || []
}

/**
 * Create a new savings account
 */
export async function createSavingsAccount(input: {
  name: string
  account_type: 'dutch' | 'spanish' | 'other'
  currency?: string
  color?: string
  icon?: string
  interest_rate?: number
  interest_type?: 'fixed' | 'variable' | 'manual'
  interest_payment_frequency?: 'annual' | 'quarterly' | 'monthly'
  fixed_rate_end_date?: string | null
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error } = await supabase.from('savings_accounts').insert({
    user_id: user.id,
    name: input.name,
    account_type: input.account_type,
    currency: input.currency || 'EUR',
    color: input.color || null,
    icon: input.icon || null,
    interest_rate: input.interest_rate || 0,
    interest_type: input.interest_type || 'manual',
    interest_payment_frequency: input.interest_payment_frequency || 'annual',
    fixed_rate_end_date: input.fixed_rate_end_date || null,
    is_pension: false, // Regular savings account
  })

  if (error) {
    console.error('Error creating savings account:', error)
    return { success: false, error: 'Failed to create savings account' }
  }

  revalidatePath('/dashboard/savings')
  return { success: true }
}

/**
 * Delete a savings account
 */
export async function deleteSavingsAccount(accountId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('savings_accounts')
    .delete()
    .eq('id', accountId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting savings account:', error)
    return { success: false, error: 'Failed to delete account' }
  }

  revalidatePath('/dashboard/savings')
  return { success: true }
}

/**
 * Update a savings account
 */
export async function updateSavingsAccount(
  accountId: string,
  input: {
    name?: string
    color?: string
    icon?: string
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('savings_accounts')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', accountId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error updating savings account:', error)
    return { success: false, error: 'Failed to update savings account' }
  }

  revalidatePath('/dashboard/savings')
  return { success: true }
}

/**
 * Get all entries for a savings account
 */
export async function getSavingsEntries(accountId: string): Promise<SavingsEntry[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('savings_entries')
    .select('*')
    .eq('user_id', user.id)
    .eq('account_id', accountId)
    .order('entry_date', { ascending: true })

  if (error) {
    console.error('Error fetching savings entries:', error)
    throw new Error('Failed to fetch savings entries')
  }

  return data || []
}

/**
 * Get all entries for all accounts (for summary views)
 */
export async function getAllSavingsEntries(): Promise<(SavingsEntry & { account: SavingsAccount })[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('savings_entries')
    .select('*, account:savings_accounts(*)')
    .eq('user_id', user.id)
    .order('entry_date', { ascending: true })

  if (error) {
    console.error('Error fetching all savings entries:', error)
    throw new Error('Failed to fetch savings entries')
  }

  return (data as any) || []
}

/**
 * Add a savings entry (balance snapshot, deposit, or withdrawal)
 */
export async function addSavingsEntry(input: {
  account_id: string
  entry_date: string
  entry_type: 'balance' | 'deposit' | 'withdrawal'
  amount: number
  notes?: string
  transaction_id?: string
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  if (input.amount <= 0) {
    return { success: false, error: 'Amount must be greater than 0' }
  }

  const { error } = await supabase.from('savings_entries').insert({
    user_id: user.id,
    account_id: input.account_id,
    entry_date: input.entry_date,
    entry_type: input.entry_type,
    amount: input.amount,
    notes: input.notes || null,
    transaction_id: input.transaction_id || null,
  })

  if (error) {
    console.error('Error adding savings entry:', error)
    return { success: false, error: 'Failed to add savings entry' }
  }

  revalidatePath('/dashboard/savings')
  return { success: true }
}

/**
 * Delete a savings entry
 */
export async function deleteSavingsEntry(entryId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('savings_entries')
    .delete()
    .eq('id', entryId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting savings entry:', error)
    return { success: false, error: 'Failed to delete savings entry' }
  }

  revalidatePath('/dashboard/savings')
  return { success: true }
}

/**
 * Calculate interest and statistics for an account
 */
export type SavingsStats = {
  currentBalance: number
  totalDeposits: number
  totalWithdrawals: number
  totalInterest: number
  interestRate: number // annualized percentage
  entries: SavingsEntry[]
}

export async function calculateSavingsStats(accountId: string): Promise<SavingsStats> {
  const entries = await getSavingsEntries(accountId)

  if (entries.length === 0) {
    return {
      currentBalance: 0,
      totalDeposits: 0,
      totalWithdrawals: 0,
      totalInterest: 0,
      interestRate: 0,
      entries: [],
    }
  }

  // Get balance snapshots sorted by date
  const balanceEntries = entries.filter((e) => e.entry_type === 'balance')
  const latestSnapshot = balanceEntries.length > 0 ? balanceEntries[balanceEntries.length - 1] : null

  // Calculate total deposits and withdrawals
  const totalDeposits = entries
    .filter((e) => e.entry_type === 'deposit')
    .reduce((sum, e) => sum + e.amount, 0)

  const totalWithdrawals = entries
    .filter((e) => e.entry_type === 'withdrawal')
    .reduce((sum, e) => sum + e.amount, 0)

  // Calculate current balance
  // Current Balance = Latest Snapshot + Deposits after snapshot - Withdrawals after snapshot
  let currentBalance = 0
  if (latestSnapshot) {
    const snapshotDate = new Date(latestSnapshot.entry_date)
    const depositsAfterSnapshot = entries
      .filter((e) => e.entry_type === 'deposit' && new Date(e.entry_date) > snapshotDate)
      .reduce((sum, e) => sum + e.amount, 0)
    const withdrawalsAfterSnapshot = entries
      .filter((e) => e.entry_type === 'withdrawal' && new Date(e.entry_date) > snapshotDate)
      .reduce((sum, e) => sum + e.amount, 0)
    currentBalance = latestSnapshot.amount + depositsAfterSnapshot - withdrawalsAfterSnapshot
  } else {
    // No snapshots, just deposits - withdrawals
    currentBalance = totalDeposits - totalWithdrawals
  }

  // Calculate interest between snapshots
  let totalInterest = 0
  if (balanceEntries.length >= 2) {
    for (let i = 1; i < balanceEntries.length; i++) {
      const prevSnapshot = balanceEntries[i - 1]
      const currSnapshot = balanceEntries[i]
      const prevDate = new Date(prevSnapshot.entry_date)
      const currDate = new Date(currSnapshot.entry_date)

      // Get deposits and withdrawals between these snapshots
      const depositsBetween = entries
        .filter((e) => e.entry_type === 'deposit' && new Date(e.entry_date) > prevDate && new Date(e.entry_date) <= currDate)
        .reduce((sum, e) => sum + e.amount, 0)
      const withdrawalsBetween = entries
        .filter((e) => e.entry_type === 'withdrawal' && new Date(e.entry_date) > prevDate && new Date(e.entry_date) <= currDate)
        .reduce((sum, e) => sum + e.amount, 0)

      // Interest = (Current Snapshot - Previous Snapshot) - (Deposits - Withdrawals)
      const expectedChange = depositsBetween - withdrawalsBetween
      const actualChange = currSnapshot.amount - prevSnapshot.amount
      const interestForPeriod = actualChange - expectedChange
      totalInterest += interestForPeriod
    }
  }

  // Calculate annualized interest rate
  let interestRate = 0
  if (balanceEntries.length >= 2 && totalInterest !== 0) {
    const firstEntry = balanceEntries[0]
    const lastEntry = balanceEntries[balanceEntries.length - 1]
    const daysDiff = Math.max(
      1,
      (new Date(lastEntry.entry_date).getTime() - new Date(firstEntry.entry_date).getTime()) / (1000 * 60 * 60 * 24)
    )
    const yearFraction = daysDiff / 365
    const avgBalance = (firstEntry.amount + lastEntry.amount) / 2
    if (avgBalance > 0 && yearFraction > 0) {
      interestRate = (totalInterest / avgBalance / yearFraction) * 100
    }
  }

  return {
    currentBalance,
    totalDeposits,
    totalWithdrawals,
    totalInterest,
    interestRate,
    entries,
  }
}

/**
 * Get transfer transactions that haven't been linked to savings yet
 */
export async function getUnlinkedTransfers() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Get all transfer transactions
  const { data: transfers, error: transfersError } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_transfer', true)
    .order('transaction_date', { ascending: false })

  if (transfersError) {
    console.error('Error fetching transfers:', transfersError)
    throw new Error('Failed to fetch transfers')
  }

  // Get all linked transaction IDs
  const { data: linkedEntries, error: linkedError } = await supabase
    .from('savings_entries')
    .select('transaction_id')
    .eq('user_id', user.id)
    .not('transaction_id', 'is', null)

  if (linkedError) {
    console.error('Error fetching linked entries:', linkedError)
    throw new Error('Failed to fetch linked entries')
  }

  const linkedIds = new Set((linkedEntries || []).map((e) => e.transaction_id))

  // Filter out already linked transactions
  const unlinked = (transfers || []).filter((t) => !linkedIds.has(t.id))

  return unlinked
}

/**
 * Import multiple transfers as savings entries
 */
export async function importTransfersToSavings(
  imports: {
    transaction_id: string
    account_id: string
    entry_type: 'deposit' | 'withdrawal'
    transaction_date: string
    amount: number
    description: string
  }[]
): Promise<{ success: boolean; imported: number; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, imported: 0, error: 'Not authenticated' }
  }

  let imported = 0

  for (const imp of imports) {
    const result = await addSavingsEntry({
      account_id: imp.account_id,
      entry_date: imp.transaction_date,
      entry_type: imp.entry_type,
      amount: Math.abs(imp.amount), // Always positive
      notes: `Imported from transaction: ${imp.description}`,
      transaction_id: imp.transaction_id,
    })

    if (result.success) {
      imported++
    } else {
      console.error(`Failed to import transaction ${imp.transaction_id}:`, result.error)
    }
  }

  revalidatePath('/dashboard/savings')
  
  return {
    success: imported > 0,
    imported,
    error: imported === 0 ? 'Failed to import any transactions' : undefined,
  }
}
