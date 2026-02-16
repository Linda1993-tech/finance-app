-- VERIFY: Check of de fix echt is doorgegaan in de database

-- 1. Check waar het salaris nu staat
SELECT 
  '💼 SALARIS TRANSACTIE (waar staat die nu?)' as check,
  transaction_date,
  description,
  amount,
  account_type,
  is_income
FROM transactions
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
  AND description ILIKE '%CITYTOURS DREAMS%';

-- 2. Check de nieuwe balans berekening
SELECT 
  '🧮 NIEUWE BALANS (wat database nu zou moeten tonen)' as check,
  50.52 as dutch_start,
  COALESCE(SUM(CASE WHEN account_type = 'dutch' AND NOT is_transfer AND transaction_date > '2025-12-31' THEN amount ELSE 0 END), 0) as dutch_trans,
  50.52 + COALESCE(SUM(CASE WHEN account_type = 'dutch' AND NOT is_transfer AND transaction_date > '2025-12-31' THEN amount ELSE 0 END), 0) as dutch_total,
  
  3404.61 as spanish_start,
  COALESCE(SUM(CASE WHEN account_type = 'spanish' AND NOT is_transfer AND transaction_date > '2025-12-31' THEN amount ELSE 0 END), 0) as spanish_trans,
  3404.61 + COALESCE(SUM(CASE WHEN account_type = 'spanish' AND NOT is_transfer AND transaction_date > '2025-12-31' THEN amount ELSE 0 END), 0) as spanish_total,
  
  50.52 + COALESCE(SUM(CASE WHEN account_type = 'dutch' AND NOT is_transfer AND transaction_date > '2025-12-31' THEN amount ELSE 0 END), 0) +
  3404.61 + COALESCE(SUM(CASE WHEN account_type = 'spanish' AND NOT is_transfer AND transaction_date > '2025-12-31' THEN amount ELSE 0 END), 0) as current_account_total
FROM transactions
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9';
