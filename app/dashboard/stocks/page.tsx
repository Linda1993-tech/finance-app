import { getStocks, getStockTransactions } from './actions'
import { StocksClient } from './stocks-client'

export default async function StocksPage() {
  const stocks = await getStocks()
  const transactions = await getStockTransactions()

  return <StocksClient initialStocks={stocks} initialTransactions={transactions} />
}
