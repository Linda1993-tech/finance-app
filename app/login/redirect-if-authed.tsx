'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Middleware skips Supabase on /login to avoid Edge timeouts; redirect authed users here.
 */
export function RedirectIfAuthed() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/dashboard')
    })
  }, [router])

  return null
}
