'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CategoryInput } from '@/lib/types/database'

/**
 * Get all categories for the current user
 */
export async function getCategories() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  if (error) {
    console.error('Error fetching categories:', error)
    throw new Error('Failed to fetch categories')
  }

  return data
}

/**
 * Create a new category
 */
export async function createCategory(input: CategoryInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({
      user_id: user.id,
      name: input.name,
      parent_id: input.parent_id || null,
      color: input.color || null,
      icon: input.icon || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating category:', error)
    throw new Error('Failed to create category')
  }

  revalidatePath('/dashboard/categories')
  return data
}

/**
 * Update a category
 */
export async function updateCategory(id: string, input: CategoryInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('categories')
    .update({
      name: input.name,
      parent_id: input.parent_id || null,
      color: input.color || null,
      icon: input.icon || null,
    })
    .eq('id', id)
    .eq('user_id', user.id) // Ensure user owns this category
    .select()
    .single()

  if (error) {
    console.error('Error updating category:', error)
    throw new Error('Failed to update category')
  }

  revalidatePath('/dashboard/categories')
  return data
}

/**
 * Delete a category
 */
export async function deleteCategory(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id) // Ensure user owns this category

  if (error) {
    console.error('Error deleting category:', error)
    throw new Error('Failed to delete category')
  }

  revalidatePath('/dashboard/categories')
}

