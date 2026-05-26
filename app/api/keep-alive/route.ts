import { NextResponse } from 'next/server'

/**
 * Keep-alive endpoint for Supabase.
 * Called automatically by Vercel Cron every 5 days to prevent
 * the free-tier Supabase project from being paused due to inactivity.
 */
export async function GET(request: Request) {
  // Protect with CRON_SECRET when set in Vercel environment variables
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { ok: false, error: 'Supabase environment variables not configured' },
      { status: 500 }
    )
  }

  try {
    // Ping the Supabase REST API — this is enough to keep the project active
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    })

    return NextResponse.json({
      ok: true,
      supabaseStatus: res.status,
      timestamp: new Date().toISOString(),
      message: 'Supabase keep-alive ping successful',
    })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    )
  }
}
