import { NextRequest, NextResponse } from 'next/server'
import { getBudgetStatus, getAllCategoriesBudgetStatus } from '@/app/dashboard/budget/budget-actions'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const month = parseInt(searchParams.get('month') || '1')
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
  const viewMode = (searchParams.get('viewMode') || 'monthly') as 'monthly' | 'yearly'

  try {
    // For monthly view, use getAllCategoriesBudgetStatus to show all categories from yearly table
    // For yearly view, use getBudgetStatus to get yearly totals
    const budgetStatuses = viewMode === 'monthly' 
      ? await getAllCategoriesBudgetStatus(month, year)
      : await getBudgetStatus(month, year, viewMode)
    
    return NextResponse.json(budgetStatuses)
  } catch (error) {
    console.error('Error fetching budget status:', error)
    return NextResponse.json({ error: 'Failed to fetch budget status' }, { status: 500 })
  }
}

