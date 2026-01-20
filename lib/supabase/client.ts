import { createBrowserClient } from '@supabase/ssr'

/**
 * Client-side Supabase client for use in Client Components
 * This reads the session from cookies automatically
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

