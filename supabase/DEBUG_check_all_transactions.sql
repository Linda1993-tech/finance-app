-- Check if there are ANY transactions in the database (regardless of user)
-- Run this to see if transactions exist at all

-- Check total transactions in database
SELECT 
  'Total transactions in entire database:' as info,
  COUNT(*) as count
FROM transactions;

-- Check transactions per user
SELECT 
  'Transactions per user:' as info,
  user_id,
  COUNT(*) as transaction_count
FROM transactions
GROUP BY user_id;

-- Check YOUR current user_id
SELECT 
  'Your current user_id:' as info,
  auth.uid() as your_user_id;

-- Check if there are transactions but with a different user_id
SELECT 
  'Checking if transactions exist with different user:' as info,
  COUNT(*) as transactions_with_other_users
FROM transactions
WHERE user_id != auth.uid() OR user_id IS NULL;

-- Show sample of transactions (if any exist)
SELECT 
  transaction_date,
  description,
  amount,
  user_id,
  import_source
FROM transactions
ORDER BY transaction_date DESC
LIMIT 10;
