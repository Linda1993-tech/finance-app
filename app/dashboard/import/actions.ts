'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { parseINGNLCSV } from '@/lib/parsers/csv-parser'
import { parseINGESXLSX } from '@/lib/parsers/xlsx-parser'
import { normalizeDescription, generateLearningKey } from '@/lib/utils/transaction-utils'
import type { ParsedTransaction } from '@/lib/parsers/csv-parser'

export type ImportResult = {
  success: boolean
  count?: number
  duplicates?: number
  error?: string
}

/**
 * Import transactions from CSV (supports both Dutch and Spanish bank formats)
 */
export async function importCSV(formData: FormData): Promise<ImportResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const file = formData.get('file') as File
  const bank = formData.get('bank') as string || 'NL'
  
  if (!file) {
    return { success: false, error: 'No file provided' }
  }

  // Read file content
  const content = await file.text()

  // Parse CSV (supports Dutch and Spanish bank formats)
  const parseResult = parseINGNLCSV(content)

  if (!parseResult.success || !parseResult.transactions) {
    return { success: false, error: parseResult.error }
  }

  // Override account_type based on bank selection
  const accountType = bank === 'ES' ? 'spanish' : 'dutch'
  const transactionsWithCorrectAccountType = parseResult.transactions.map(t => ({
    ...t,
    account_type: accountType as 'dutch' | 'spanish' | 'other'
  }))

  // Save to database
  const saveResult = await saveTransactions(
    user.id,
    transactionsWithCorrectAccountType,
    bank as 'NL' | 'ES'
  )

  revalidatePath('/dashboard/transactions')
  return saveResult
}

/**
 * Import transactions from XLSX/XLS (supports both Dutch and Spanish bank formats)
 */
export async function importXLSX(formData: FormData): Promise<ImportResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const file = formData.get('file') as File
  const bank = formData.get('bank') as string || 'ES'
  
  if (!file) {
    return { success: false, error: 'No file provided' }
  }

  // Read file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer()

  // Parse XLSX (supports Dutch and Spanish bank formats)
  const parseResult = parseINGESXLSX(arrayBuffer)

  if (!parseResult.success || !parseResult.transactions) {
    return { success: false, error: parseResult.error }
  }

  // Override account_type based on bank selection
  const accountType = bank === 'ES' ? 'spanish' : 'dutch'
  const transactionsWithCorrectAccountType = parseResult.transactions.map(t => ({
    ...t,
    account_type: accountType as 'dutch' | 'spanish' | 'other'
  }))

  // Save to database
  const saveResult = await saveTransactions(
    user.id,
    transactionsWithCorrectAccountType,
    bank as 'NL' | 'ES'
  )

  revalidatePath('/dashboard/transactions')
  return saveResult
}

/**
 * Save parsed transactions to database (with duplicate detection)
 */
async function saveTransactions(
  userId: string,
  transactions: ParsedTransaction[],
  source: string
): Promise<ImportResult> {
  const supabase = await createClient()

  // Prepare transactions for comparison
  const transactionsToCheck = transactions.map((t) => {
    const normalized = normalizeDescription(t.description)
    const learningKey = generateLearningKey(normalized)

    return {
      user_id: userId,
      transaction_date: t.date,
      description: t.description,
      amount: t.amount,
      currency: t.currency,
      account_type: t.account_type,
      normalized_description: normalized,
      learning_key: learningKey,
      import_source: source,
    }
  })

  // Get existing transactions for this user to check for duplicates
  const { data: existing, error: fetchError } = await supabase
    .from('transactions')
    .select('transaction_date, amount, description')
    .eq('user_id', userId)

  if (fetchError) {
    console.error('Error fetching existing transactions:', fetchError)
    return { success: false, error: 'Failed to check for duplicates' }
  }

  // Create a Set of unique keys for existing transactions
  const existingKeys = new Set(
    (existing || []).map(
      (t) => `${t.transaction_date}|${t.amount}|${t.description}`
    )
  )

  // Filter out duplicates
  const newTransactions = transactionsToCheck.filter((t) => {
    const key = `${t.transaction_date}|${t.amount}|${t.description}`
    return !existingKeys.has(key)
  })

  const duplicateCount = transactions.length - newTransactions.length

  // If no new transactions, return early
  if (newTransactions.length === 0) {
    return {
      success: true,
      count: 0,
      duplicates: duplicateCount,
    }
  }

  // Insert only new transactions
  const { error: insertError, count } = await supabase
    .from('transactions')
    .insert(newTransactions)

  if (insertError) {
    console.error('Error saving transactions:', insertError)
    return { success: false, error: 'Failed to save transactions to database' }
  }

  return {
    success: true,
    count: count || newTransactions.length,
    duplicates: duplicateCount,
  }
}

/**
 * Get all transactions for the current user
 */
export async function getTransactions() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('transactions')
    .select('*, category:categories(id, name, icon, color)')
    .eq('user_id', user.id)
    .order('transaction_date', { ascending: false })

  if (error) {
    console.error('Error fetching transactions:', error)
    throw new Error('Failed to fetch transactions')
  }

  return data
}

/**
 * Delete all transactions (for testing)
 */
export async function deleteAllTransactions(): Promise<ImportResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting transactions:', error)
    return { success: false, error: 'Failed to delete transactions' }
  }

  revalidatePath('/dashboard/transactions')
  return { success: true }
}

