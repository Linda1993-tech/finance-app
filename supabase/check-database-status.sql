-- Diagnostic script: Check current database status
-- Run this to see what fields exist and what data you have

-- Check if required fields exist in transactions table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'transactions'
  AND column_name IN ('account_type', 'is_transfer', 'is_income')
ORDER BY column_name;

-- If the above returns 0 rows, the fields are missing!
-- If it returns 3 rows, the fields exist.

-- Check transactions summary
SELECT 
  COUNT(*) as total_transactions,
  COUNT(CASE WHEN account_type = 'dutch' THEN 1 END) as dutch_transactions,
  COUNT(CASE WHEN account_type = 'spanish' THEN 1 END) as spanish_transactions,
  COUNT(CASE WHEN is_transfer = true THEN 1 END) as transfers,
  COUNT(CASE WHEN is_income = true THEN 1 END) as income_transactions,
  SUM(amount) as total_amount,
  SUM(CASE WHEN NOT is_transfer THEN amount ELSE 0 END) as amount_excluding_transfers
FROM transactions
WHERE user_id = auth.uid();

-- Check user preferences (starting balances)
SELECT 
  dutch_account_starting_balance,
  dutch_account_starting_date,
  spanish_account_starting_balance,
  spanish_account_starting_date
FROM user_preferences
WHERE user_id = auth.uid();

-- Show recent transactions to verify
SELECT 
  transaction_date,
  description,
  amount,
  account_type,
  is_transfer,
  is_income,
  import_source
FROM transactions
WHERE user_id = auth.uid()
ORDER BY transaction_date DESC
LIMIT 20;
