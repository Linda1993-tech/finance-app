-- ZOEK ANDERE PROBLEMEN
-- Na het fixen van het salaris, zoeken we andere grote transacties

-- 1. ALLE GROTE TRANSACTIES (> €200) die niet als transfer gemarkeerd zijn
SELECT 
  '🔍 GROTE TRANSACTIES (> €200, geen transfer)' as info,
  transaction_date,
  description,
  amount,
  account_type,
  is_transfer,
  is_income
FROM transactions
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
  AND transaction_date > '2025-12-31'
  AND ABS(amount) > 200
  AND is_transfer = false
ORDER BY ABS(amount) DESC;

-- 2. CHECK: Zijn er transacties naar spaarrekeningen/beleggingen?
SELECT 
  '💰 MOGELIJKE TRANSFERS (keywords)' as info,
  transaction_date,
  description,
  amount,
  account_type,
  is_transfer
FROM transactions
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
  AND transaction_date > '2025-12-31'
  AND (
    description ILIKE '%spaar%'
    OR description ILIKE '%saving%'
    OR description ILIKE '%transfer%'
    OR description ILIKE '%overboeking%'
    OR description ILIKE '%degiro%'
    OR description ILIKE '%trade republic%'
    OR description ILIKE '%bux%'
    OR description ILIKE '%investment%'
    OR description ILIKE '%belegging%'
  )
  AND is_transfer = false
ORDER BY ABS(amount) DESC;

-- 3. CHECK: Duplicates (zelfde bedrag + datum)
SELECT 
  '⚠️ MOGELIJKE DUPLICATES' as info,
  transaction_date,
  description,
  amount,
  COUNT(*) as aantal_keer
FROM transactions
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
  AND transaction_date > '2025-12-31'
GROUP BY transaction_date, description, amount
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC, ABS(amount) DESC;
