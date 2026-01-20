import { NextRequest, NextResponse } from 'next/server'
import { getBudgetStatus } from '@/app/dashboard/budget/budget-actions'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const month = parseInt(searchParams.get('month') || '1')
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
  const viewMode = (searchParams.get('viewMode') || 'monthly') as 'monthly' | 'yearly'

  try {
    const budgetStatuses = await getBudgetStatus(month, year, viewMode)
    return NextResponse.json(budgetStatuses)
  } catch (error) {
    console.error('Error fetching budget status:', error)
    return NextResponse.json({ error: 'Failed to fetch budget status' }, { status: 500 })
  }
}

