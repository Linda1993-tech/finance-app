'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type MatchType = 'contains' | 'starts_with' | 'exact'

/**
 * Create a pattern-based rule
 */
export async function createPatternRule(
  pattern: string,
  matchType: MatchType,
  categoryId: string
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Store the pattern with a prefix indicating the match type
  // Format: "type:pattern"
  // e.g., "contains:GLOVO", "starts_with:ALBERT", "exact:NETFLIX"
  const learningKey = `${matchType}:${pattern}`

  // Check if rule already exists
  const { data: existing } = await supabase
    .from('categorization_rules')
    .select('id')
    .eq('user_id', user.id)
    .eq('learning_key', learningKey)
    .single()

  if (existing) {
    throw new Error('A rule with this pattern already exists')
  }

  const { error } = await supabase.from('categorization_rules').insert({
    user_id: user.id,
    learning_key: learningKey,
    category_id: categoryId,
    confidence: 1,
  })

  if (error) {
    console.error('Error creating pattern rule:', error)
    throw new Error('Failed to create rule')
  }

  revalidatePath('/dashboard/rules')
  revalidatePath('/dashboard/transactions')
}

/**
 * Auto-categorize using pattern-based rules
 */
export async function autoCategorizeWithPatterns() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Get all rules
  const { data: rules } = await supabase
    .from('categorization_rules')
    .select('learning_key, category_id')
    .eq('user_id', user.id)

  if (!rules) return { success: true, count: 0 }

  // Get uncategorized transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('id, normalized_description, learning_key')
    .eq('user_id', user.id)
    .is('category_id', null)
    .eq('exclude_from_learning', false)
    .eq('disable_auto_rules', false)

  if (!transactions) return { success: true, count: 0 }

  let categorizedCount = 0

  for (const transaction of transactions) {
    const normalizedDesc = transaction.normalized_description?.toUpperCase() || ''
    const learningKey = transaction.learning_key?.toUpperCase() || ''

    // Skip if no learning key and no normalized description
    if (!learningKey && !normalizedDesc) continue

    for (const rule of rules) {
      let matches = false
      const ruleKey = rule.learning_key || ''

      // Check if this is a pattern rule (contains ':') or exact-match rule
      if (ruleKey.includes(':')) {
        // Pattern-based rule (e.g., "contains:GLOVO")
        const colonIndex = ruleKey.indexOf(':')
        const matchType = ruleKey.substring(0, colonIndex)
        const pattern = ruleKey.substring(colonIndex + 1).toUpperCase()

        if (matchType === 'contains') {
          matches = normalizedDesc.includes(pattern)
        } else if (matchType === 'starts_with') {
          matches = normalizedDesc.startsWith(pattern)
        } else if (matchType === 'exact') {
          matches = learningKey === pattern
        }
      } else {
        // Legacy exact-match rule (no ':' prefix)
        // Match against learning key OR normalized description
        const ruleKeyUpper = ruleKey.toUpperCase()
        
        // Try exact match with learning key first
        if (learningKey && learningKey === ruleKeyUpper) {
          matches = true
        }
        // Also try if normalized description contains the rule key
        else if (normalizedDesc && normalizedDesc.includes(ruleKeyUpper)) {
          matches = true
        }
      }

      if (matches) {
        await supabase
          .from('transactions')
          .update({ category_id: rule.category_id })
          .eq('id', transaction.id)

        categorizedCount++
        break // Stop checking other rules for this transaction
      }
    }
  }

  revalidatePath('/dashboard/transactions')
  return { success: true, count: categorizedCount }
}

