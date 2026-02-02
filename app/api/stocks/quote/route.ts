import { NextRequest, NextResponse } from 'next/server'
import { fetchMultipleStockQuotes } from '@/lib/utils/stock-api'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const tickers = searchParams.get('tickers')

  if (!tickers) {
    return NextResponse.json({ error: 'No tickers provided' }, { status: 400 })
  }

  const tickerList = tickers.split(',').map((t) => t.trim().toUpperCase())
  const quotes = await fetchMultipleStockQuotes(tickerList)

  return NextResponse.json({ quotes })
}
