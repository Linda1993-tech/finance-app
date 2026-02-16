-- STEP 1: Check what fields are missing
-- Copy this entire file and run it in Supabase SQL Editor

-- Check if account_type, is_transfer, is_income exist
SELECT 
  'Checking transactions table fields...' as step;

SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'transactions'
  AND column_name IN ('account_type', 'is_transfer', 'is_income')
ORDER BY column_name;

-- If you see 3 rows above: GOOD! Fields exist
-- If you see 0 rows above: Fields are MISSING, run STEP_2_add_missing_fields.sql

-- Check your current transactions
SELECT 
  COUNT(*) as total_transactions,
  SUM(amount) as total_amount,
  MIN(transaction_date) as oldest_transaction,
  MAX(transaction_date) as newest_transaction
FROM transactions
WHERE user_id = auth.uid();

-- Check if user_preferences table exists
SELECT 
  dutch_account_starting_balance,
  dutch_account_starting_date,
  spanish_account_starting_balance,
  spanish_account_starting_date
FROM user_preferences
WHERE user_id = auth.uid();

-- If the query above fails, you need to create user_preferences table first
