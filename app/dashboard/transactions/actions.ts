'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  findSuspiciousTransactions,
  groupImportBatches,
  type ImportBatch,
  type SuspiciousTransaction,
} from '@/lib/utils/account-type-detection'

export type FixAccountTypeResult = {
  success: boolean
  count?: number
  error?: string
}

function revalidateTransactionPaths() {
  revalidatePath('/dashboard/transactions')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')
}

export type AccountTypeFixData = {
  suspicious: SuspiciousTransaction[]
  importBatches: ImportBatch[]
}

export async function getAccountTypeFixData(): Promise<AccountTypeFixData> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { suspicious: [], importBatches: [] }
  }

  const { data: transactions } = await supabase
    .from('transactions')
    .select('id, transaction_date, description, amount, account_type, import_date')
    .eq('user_id', user.id)
    .order('import_date', { ascending: false })

  if (!transactions?.length) {
    return { suspicious: [], importBatches: [] }
  }

  return {
    suspicious: findSuspiciousTransactions(transactions),
    importBatches: groupImportBatches(transactions),
  }
}

export async function fixTransactionsAccountType(
  transactionIds: string[],
  newAccountType: 'dutch' | 'spanish'
): Promise<FixAccountTypeResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Niet ingelogd' }
  }

  if (transactionIds.length === 0) {
    return { success: false, error: 'Geen transacties geselecteerd' }
  }

  const importSource = newAccountType === 'spanish' ? 'ES' : 'NL'

  const { data, error } = await supabase
    .from('transactions')
    .update({
      account_type: newAccountType,
      import_source: importSource,
    })
    .eq('user_id', user.id)
    .in('id', transactionIds)
    .select('id')

  if (error) {
    console.error('Error fixing account type:', error)
    return { success: false, error: 'Kon accounttype niet bijwerken' }
  }

  revalidateTransactionPaths()

  return { success: true, count: data?.length ?? 0 }
}

export async function fixImportBatchAccountType(
  importDate: string,
  newAccountType: 'dutch' | 'spanish'
): Promise<FixAccountTypeResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Niet ingelogd' }
  }

  const importSource = newAccountType === 'spanish' ? 'ES' : 'NL'

  const { data, error } = await supabase
    .from('transactions')
    .update({
      account_type: newAccountType,
      import_source: importSource,
    })
    .eq('user_id', user.id)
    .eq('import_date', importDate)
    .select('id')

  if (error) {
    console.error('Error fixing import batch:', error)
    return { success: false, error: 'Kon importbatch niet bijwerken' }
  }

  revalidateTransactionPaths()

  return { success: true, count: data?.length ?? 0 }
}

export async function fixDateRangeAccountType(
  fromDate: string,
  toDate: string,
  fromAccountType: 'dutch' | 'spanish',
  toAccountType: 'dutch' | 'spanish'
): Promise<FixAccountTypeResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Niet ingelogd' }
  }

  const importSource = toAccountType === 'spanish' ? 'ES' : 'NL'

  const { data, error } = await supabase
    .from('transactions')
    .update({
      account_type: toAccountType,
      import_source: importSource,
    })
    .eq('user_id', user.id)
    .eq('account_type', fromAccountType)
    .gte('transaction_date', fromDate)
    .lte('transaction_date', toDate)
    .select('id')

  if (error) {
    console.error('Error fixing date range:', error)
    return { success: false, error: 'Kon transacties niet bijwerken' }
  }

  revalidateTransactionPaths()

  return { success: true, count: data?.length ?? 0 }
}

export async function deleteImportBatch(importDate: string): Promise<FixAccountTypeResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Niet ingelogd' }
  }

  const { data, error } = await supabase
    .from('transactions')
    .delete()
    .eq('user_id', user.id)
    .eq('import_date', importDate)
    .select('id')

  if (error) {
    console.error('Error deleting import batch:', error)
    return { success: false, error: 'Kon importbatch niet verwijderen' }
  }

  revalidateTransactionPaths()

  return { success: true, count: data?.length ?? 0 }
}

export async function deleteRecentImportBatches(count: number): Promise<FixAccountTypeResult> {
  const { importBatches } = await getAccountTypeFixData()
  const batchesToDelete = importBatches.slice(0, count)

  if (batchesToDelete.length === 0) {
    return { success: false, error: 'Geen imports gevonden om te verwijderen' }
  }

  let total = 0
  for (const batch of batchesToDelete) {
    const result = await deleteImportBatch(batch.import_date)
    if (!result.success) {
      return result
    }
    total += result.count ?? 0
  }

  return { success: true, count: total }
}
