import { NextRequest, NextResponse } from 'next/server'
import { fetchMultipleStockQuotes, clearPriceCache } from '@/lib/utils/multi-stock-api'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const tickers = searchParams.get('tickers')
  const forceRefresh = searchParams.get('refresh') === 'true'

  if (!tickers) {
    return NextResponse.json({ error: 'No tickers provided' }, { status: 400 })
  }

  // Clear cache if force refresh requested
  if (forceRefresh) {
    clearPriceCache()
  }

  const tickerList = tickers.split(',').map((t) => t.trim().toUpperCase())
  const quotes = await fetchMultipleStockQuotes(tickerList)

  return NextResponse.json({ 
    quotes,
    cachedCount: Object.values(quotes).filter(q => q.source === 'cache').length,
    totalCount: Object.keys(quotes).length
  })
}
