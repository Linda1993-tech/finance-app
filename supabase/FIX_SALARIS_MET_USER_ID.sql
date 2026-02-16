-- FIX SALARIS MET HARD-CODED USER ID
-- Dit zou MOETEN werken omdat je admin bent in Supabase

-- 1. Check VOOR de update
SELECT 
  '❌ VOOR UPDATE' as status,
  id,
  transaction_date,
  description,
  amount,
  account_type,
  is_income
FROM transactions
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
  AND description ILIKE '%CITYTOURS DREAMS%'
  AND amount > 4000;

-- 2. UPDATE het salaris
UPDATE transactions
SET account_type = 'spanish'
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
  AND description ILIKE '%CITYTOURS DREAMS%'
  AND amount > 4000;

-- 3. Check NA de update  
SELECT 
  '✅ NA UPDATE' as status,
  id,
  transaction_date,
  description,
  amount,
  account_type,
  is_income
FROM transactions
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
  AND description ILIKE '%CITYTOURS DREAMS%'
  AND amount > 4000;

-- 4. Check de nieuwe balans berekening
SELECT 
  '🧮 NIEUWE BALANS' as info,
  50.52 + COALESCE(SUM(CASE WHEN account_type = 'dutch' AND NOT is_transfer AND transaction_date > '2025-12-31' THEN amount ELSE 0 END), 0) as dutch_total,
  3404.61 + COALESCE(SUM(CASE WHEN account_type = 'spanish' AND NOT is_transfer AND transaction_date > '2025-12-31' THEN amount ELSE 0 END), 0) as spanish_total,
  50.52 + COALESCE(SUM(CASE WHEN account_type = 'dutch' AND NOT is_transfer AND transaction_date > '2025-12-31' THEN amount ELSE 0 END), 0) +
  3404.61 + COALESCE(SUM(CASE WHEN account_type = 'spanish' AND NOT is_transfer AND transaction_date > '2025-12-31' THEN amount ELSE 0 END), 0) as current_account
FROM transactions
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9';

SELECT '✅ Als account_type nu "spanish" is, dan is de fix geslaagd!' as resultaat;
