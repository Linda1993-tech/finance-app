import { NextRequest, NextResponse } from 'next/server'
import { getCategorySpending } from '@/app/dashboard/analytics/data-actions'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const month = searchParams.get('month') || undefined

  try {
    const categorySpending = await getCategorySpending(month)
    return NextResponse.json(categorySpending)
  } catch (error) {
    console.error('Error fetching category spending:', error)
    return NextResponse.json({ error: 'Failed to fetch category spending' }, { status: 500 })
  }
}
