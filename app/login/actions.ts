'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

async function getOrigin(): Promise<string> {
  const headerList = await headers()
  const origin = headerList.get('origin')
  if (origin) return origin

  const host = headerList.get('host')
  const protocol = host?.startsWith('localhost') ? 'http' : 'https'
  return host ? `${protocol}://${host}` : 'https://worthflow.app'
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const origin = await getOrigin()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  // If a session is returned, email confirmation is disabled -> go straight in.
  if (data.session) {
    redirect('/dashboard')
  }

  redirect(
    '/login?message=' +
      encodeURIComponent(
        'Bevestig je account via de link in je e-mail om de registratie te voltooien.'
      )
  )
}

