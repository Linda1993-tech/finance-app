'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type CategorizeOption = 
  | 'once' // Apply once, don't create rule
  | 'rule' // Create/update rule
  | 'exclude' // Don't learn from this transaction
  | 'no-auto' // Don't auto-apply rules (for Amazon, Bizum, etc.)

/**
 * Categorize a transaction with various learning options
 */
export async function categorizeTransaction(
  transactionId: string,
  categoryId: string | null,
  option: CategorizeOption,
  isTransfer: boolean = false,
  isIncome: boolean = false,
  savingsAccountId?: string,
  savingsEntryType?: 'deposit' | 'withdrawal',
  transactionDate?: string
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Get the transaction first
  const { data: transaction, error: fetchError } = await supabase
    .from('transactions')
    .select('learning_key, user_id, amount, description, transaction_date')
    .eq('id', transactionId)
    .single()

  if (fetchError || !transaction) {
    throw new Error('Transaction not found')
  }

  if (transaction.user_id !== user.id) {
    throw new Error('Unauthorized')
  }

  // Update transaction based on option
  const updates: any = {
    category_id: categoryId || null, // Ensure null, not empty string
    is_manually_categorized: true,
    is_transfer: isTransfer,
    is_income: isIncome,
  }

  if (option === 'exclude') {
    updates.exclude_from_learning = true
    updates.learning_key = null // Clear learning key
  }

  if (option === 'no-auto') {
    updates.disable_auto_rules = true
  }

  const { error: updateError } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', transactionId)

  if (updateError) {
    throw new Error('Failed to update transaction')
  }

  // Create or update rule if option is 'rule'
  if (option === 'rule' && transaction.learning_key && categoryId) {
    await upsertCategorizationRule(
      user.id,
      transaction.learning_key,
      categoryId,
      transactionId
    )
  }

  // Link to savings account if selected
  if (isTransfer && savingsAccountId && savingsEntryType) {
    const { error: savingsError } = await supabase.from('savings_entries').insert({
      user_id: user.id,
      account_id: savingsAccountId,
      transaction_id: transactionId,
      entry_date: transactionDate || transaction.transaction_date,
      entry_type: savingsEntryType,
      amount: Math.abs(transaction.amount),
      notes: `Linked from transaction: ${transaction.description}`,
    })

    if (savingsError) {
      console.error('Failed to create savings entry:', savingsError)
      // Don't throw - the transaction was still categorized successfully
    }
  }

  revalidatePath('/dashboard/transactions')
  revalidatePath('/dashboard/savings')
}

/**
 * Create or update a categorization rule
 */
async function upsertCategorizationRule(
  userId: string,
  learningKey: string,
  categoryId: string,
  transactionId: string
) {
  const supabase = await createClient()

  // Check if rule exists
  const { data: existingRule } = await supabase
    .from('categorization_rules')
    .select('id, confidence')
    .eq('user_id', userId)
    .eq('learning_key', learningKey)
    .single()

  if (existingRule) {
    // Update existing rule - increment confidence
    await supabase
      .from('categorization_rules')
      .update({
        category_id: categoryId,
        confidence: existingRule.confidence + 1,
      })
      .eq('id', existingRule.id)
  } else {
    // Create new rule
    await supabase.from('categorization_rules').insert({
      user_id: userId,
      learning_key: learningKey,
      category_id: categoryId,
      confidence: 1,
      created_by_transaction_id: transactionId,
    })
  }
}

/**
 * Auto-categorize all uncategorized transactions based on existing rules
 */
export async function autoCategorizeTransactions() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Get all rules for this user
  const { data: rules, error: rulesError } = await supabase
    .from('categorization_rules')
    .select('learning_key, category_id')
    .eq('user_id', user.id)

  if (rulesError || !rules) {
    throw new Error('Failed to fetch rules')
  }

  // Get all uncategorized transactions that:
  // - Have no category
  // - Have a learning key
  // - Are not excluded from learning
  // - Do not have auto-rules disabled
  const { data: transactions, error: transactionsError } = await supabase
    .from('transactions')
    .select('id, learning_key')
    .eq('user_id', user.id)
    .is('category_id', null)
    .not('learning_key', 'is', null)
    .eq('exclude_from_learning', false)
    .eq('disable_auto_rules', false)

  if (transactionsError || !transactions) {
    throw new Error('Failed to fetch transactions')
  }

  // Match transactions to rules
  let categorizedCount = 0
  const updates: Array<{ id: string; category_id: string }> = []

  for (const transaction of transactions) {
    const matchingRule = rules.find((r) => r.learning_key === transaction.learning_key)
    if (matchingRule) {
      updates.push({
        id: transaction.id,
        category_id: matchingRule.category_id,
      })
      categorizedCount++
    }
  }

  // Apply updates in batch
  for (const update of updates) {
    await supabase
      .from('transactions')
      .update({ category_id: update.category_id })
      .eq('id', update.id)
  }

  revalidatePath('/dashboard/transactions')
  return { success: true, count: categorizedCount }
}

/**
 * Get all categorization rules for the current user
 */
export async function getCategorizationRules() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('categorization_rules')
    .select('*, category:categories(name, icon, color)')
    .eq('user_id', user.id)
    .order('learning_key')

  if (error) {
    throw new Error('Failed to fetch rules')
  }

  return data
}

