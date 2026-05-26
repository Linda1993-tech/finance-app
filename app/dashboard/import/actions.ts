'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { parseINGNLCSV, parseINGESCSV } from '@/lib/parsers/csv-parser'
import { parseINGESXLSX, parseINGNLXLSX } from '@/lib/parsers/xlsx-parser'
import { detectBankFormat } from '@/lib/parsers/detect-format'
import { normalizeDescription, generateLearningKey } from '@/lib/utils/transaction-utils'
import type { ParsedTransaction, ParseResult } from '@/lib/parsers/csv-parser'

export type ImportResult = {
  success: boolean
  count?: number
  duplicates?: number
  error?: string
  accountType?: 'dutch' | 'spanish'
}

function parseBankStatement(
  buffer: ArrayBuffer,
  fileFormat: 'csv' | 'xlsx',
  accountType: 'dutch' | 'spanish'
): ParseResult {
  if (fileFormat === 'xlsx') {
    return accountType === 'spanish'
      ? parseINGESXLSX(buffer)
      : parseINGNLXLSX(buffer)
  }

  const content = new TextDecoder('utf-8').decode(buffer)
  return accountType === 'spanish'
    ? parseINGESCSV(content)
    : parseINGNLCSV(content)
}

/**
 * Import bank statement with automatic account detection
 */
export async function importBankStatement(formData: FormData): Promise<ImportResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const file = formData.get('file') as File

  if (!file) {
    return { success: false, error: 'No file provided' }
  }

  const buffer = await file.arrayBuffer()
  const detection = detectBankFormat(file.name, buffer)

  let parseResult = parseBankStatement(buffer, detection.fileFormat, detection.accountType)

  // If primary parse fails, try the other account type as fallback
  if (!parseResult.success || !parseResult.transactions?.length) {
    const alternateType = detection.accountType === 'dutch' ? 'spanish' : 'dutch'
    const alternateResult = parseBankStatement(buffer, detection.fileFormat, alternateType)

    if (alternateResult.success && alternateResult.transactions?.length) {
      parseResult = alternateResult
      detection.accountType = alternateType
      detection.importSource = alternateType === 'spanish' ? 'ES' : 'NL'
    }
  }

  if (!parseResult.success || !parseResult.transactions) {
    return {
      success: false,
      error: parseResult.error ?? 'Could not parse bank statement. Check that the file is a valid ING export.',
    }
  }

  if (parseResult.transactions.length === 0) {
    return {
      success: false,
      error: 'No transactions found in file. Check that the file contains valid transaction data.',
    }
  }

  const transactionsWithAccountType = parseResult.transactions.map((t) => ({
    ...t,
    account_type: detection.accountType,
  }))

  const saveResult = await saveTransactions(
    user.id,
    transactionsWithAccountType,
    detection.importSource
  )

  revalidatePath('/dashboard/transactions')
  revalidatePath('/dashboard')

  return {
    ...saveResult,
    accountType: detection.accountType,
  }
}

/**
 * @deprecated Use importBankStatement instead
 */
export async function importCSV(formData: FormData): Promise<ImportResult> {
  return importBankStatement(formData)
}

/**
 * @deprecated Use importBankStatement instead
 */
export async function importXLSX(formData: FormData): Promise<ImportResult> {
  return importBankStatement(formData)
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

