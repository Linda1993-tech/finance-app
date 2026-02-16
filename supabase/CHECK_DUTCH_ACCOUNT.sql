-- CHECK: Wat zit er in de Dutch account?
-- Dit account heeft €2858,55 aan positieve transacties!

-- 1. OVERZICHT DUTCH ACCOUNT
SELECT 
  '🇳🇱 DUTCH ACCOUNT OVERZICHT' as info,
  COUNT(*) as aantal_transacties,
  SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as positieve_bedragen,
  SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END) as negatieve_bedragen,
  SUM(amount) as netto_bedrag,
  COUNT(CASE WHEN is_transfer THEN 1 END) as transfers,
  COUNT(CASE WHEN is_income THEN 1 END) as income
FROM transactions
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
  AND account_type = 'dutch'
  AND transaction_date > '2025-12-31';

-- 2. ALLE POSITIEVE TRANSACTIES IN DUTCH ACCOUNT
SELECT 
  '💰 POSITIEVE TRANSACTIES (Dutch)' as info,
  transaction_date,
  description,
  amount,
  is_income,
  is_transfer
FROM transactions
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
  AND account_type = 'dutch'
  AND transaction_date > '2025-12-31'
  AND amount > 0
ORDER BY amount DESC;

-- 3. ALLE NEGATIEVE TRANSACTIES IN DUTCH ACCOUNT
SELECT 
  '💸 NEGATIEVE TRANSACTIES (Dutch)' as info,
  transaction_date,
  description,
  amount,
  is_transfer
FROM transactions
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
  AND account_type = 'dutch'
  AND transaction_date > '2025-12-31'
  AND amount < 0
ORDER BY transaction_date DESC;

-- 4. GROTE TRANSACTIES (> €100) IN DUTCH ACCOUNT
SELECT 
  '🔥 GROTE TRANSACTIES (> €100)' as info,
  transaction_date,
  description,
  amount,
  is_income,
  is_transfer
FROM transactions
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
  AND account_type = 'dutch'
  AND transaction_date > '2025-12-31'
  AND ABS(amount) > 100
ORDER BY ABS(amount) DESC;

-- 5. CHECK OF ER EEN GROTE FOUT IS
-- Misschien is er één transactie van ~€2858?
SELECT 
  '⚠️ TRANSACTIES ROND €2858' as info,
  transaction_date,
  description,
  amount,
  is_transfer,
  is_income
FROM transactions
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
  AND account_type = 'dutch'
  AND transaction_date > '2025-12-31'
  AND ABS(amount) > 2000
ORDER BY transaction_date DESC;
